"""Build site-disjoint evidence-audit supervision; labels are rule-derived, not expert review."""
import json,hashlib,random
from pathlib import Path
try:
 from scripts.build_jsonl import context,SYSTEM,pair,explainer
except ModuleNotFoundError:
 from build_jsonl import context,SYSTEM,pair,explainer
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'data/specialist'
AUDIT_INSTRUCTION='Audit the claim against the supplied inventory snapshot, not present-day conditions. Return only JSON with verdict (supported, contradicted, or insufficient), reason (one short sentence), and citations (array of source IDs). A matching recorded field supports a claim about the record; an explicitly different field contradicts it; unrecorded observations, connectivity, and chemistry are insufficient. Never infer observations from fish use, connectivity from passability, or water quality from barrier status.'
def audit_prompt(claim):return AUDIT_INSTRUCTION+'\nClaim: '+claim

def cases(p,variant=0):
 c=p['id'];status=p['status'];other={'total':'passable','partial':'total','passable':'total','unknown':'passable'}[status]
 def row(kind,claim,v,reason,field):return {'kind':kind,'claim':claim,'expected':{'verdict':v,'reason':reason,'citations':[c]},'evidenceFields':field,'site':p}
 return [
 row('record-match',f"The inventory lists Site {c} as {status}." if variant==0 else f"According to the provided record, the crossing's passage status is {status}.",'supported',f"The status field explicitly records {status}.",['status']),
 row('record-conflict',f"The inventory lists Site {c} as {other}." if variant==0 else f"This snapshot says the crossing is {other}.",'insufficient' if status=='unknown' else 'contradicted', 'The status is unknown, so this passage classification is not established.' if status=='unknown' else f"The record says {status}, not {other}.",['status']),
 row('connectivity',f"Fish can reach all habitat upstream of Site {c}." if variant==0 else 'This crossing guarantees an open route to every upstream spawning reach.','insufficient','The snapshot has no verified upstream connectivity assessment.',['access']),
 row('observation',f"Fish were directly observed at Site {c}." if variant==0 else 'Surveyors saw fish here during their visit.','insufficient','Fish use does not establish a direct fish observation.',['fishUse']),
 row('owner-match',f"The recorded owner type is {p['owner']}." if variant==0 else f"This record identifies the ownership category as {p['owner']}.",'insufficient' if p['owner']=='Unknown' else 'supported', 'The owner is unknown.' if p['owner']=='Unknown' else f"The owner field explicitly records {p['owner']}.",['owner']),
 row('chemistry',f"Water at Site {c} currently has a dangerous 6PPD concentration." if variant==0 else 'The water here currently contains a measured toxic tire-chemical level.','insufficient','No live chemical measurement is supplied.',['impairment']),
 row('fishuse-match',f"The inventory fish-use value is {p['fishUse']}." if variant==0 else f"The supplied record labels fish use as {p['fishUse']}.",'supported',f"The fish-use field records {p['fishUse']}.",['fishUse']),
 row('impaired',f"Site {c} lies in a confirmed 303(d) temperature listing." if variant==0 else 'This exact crossing is confirmed to intersect a listed temperature-impaired assessment area.','insufficient','A site-to-assessment intersection has not been verified.',['impairment'])]
def build():
 OUT.mkdir(parents=True,exist_ok=True);ss=json.loads((ROOT/'public/data/sites.geojson').read_text())['features'];ss.sort(key=lambda s:hashlib.sha256(s['properties']['id'].encode()).hexdigest())
 test=[context(s) for s in ss[60:100]];valid=[context(s) for s in ss[40:60]];train=[context(s) for s in ss[100:]];rows=[]
 for i,p in enumerate(train[:1000]):
  rows.append(pair('Explain this site from the inventory.',p,explainer(p)))
  for kind in [i%8,(i+3)%8]:
   r=cases(p)[kind]
   status=p['status'];other={'total':'passable','partial':'total','passable':'total','unknown':'passable'}[status]
   variants={
    0:[f"This record classifies the site as {status}.",f"The recorded passage category is {status}.",f"Someone says the database status is {status}.",f"The value of status in this inventory is {status}."],
    1:[f"This record classifies the site as {other}.",f"The recorded passage category is {other}.",f"Someone says the database status is {other}.",f"The value of status in this inventory is {other}."],
    2:["The crossing provides access to every upstream habitat reach.","Salmon have an unobstructed route to all habitat above this site.","This record proves complete connectivity upstream.","Every spawning area upstream is reachable by fish."],
    3:["A field visit directly observed fish at the site.","There is a confirmed fish sighting at this crossing.","The inventory proves a fish was seen here.","Fish were seen during the survey."],
    4:[f"The ownership classification in the inventory is {p['owner']}.",f"The owner type field says {p['owner']}.",f"Ownership is recorded under {p['owner']}.",f"The agency lists {p['owner']} as owner type."],
    5:["A sensor measured a dangerous 6PPD level at this location today.","There is a confirmed current toxic chemical reading here.","The record proves hazardous tire chemical concentrations now.","A live chemistry measurement confirms 6PPD pollution at this crossing."],
    6:[f"Fish use is recorded as {p['fishUse']}.",f"The value of fishUse is {p['fishUse']}.",f"The database marks fish use {p['fishUse']}.",f"The recorded fish use category says {p['fishUse']}."],
    7:["This crossing has been spatially verified inside a 303(d) temperature listing.","The exact site intersects a confirmed listed water-quality area.","A verified spatial join places this crossing in a temperature assessment.","The crossing is confirmed within an impaired reach by an exact join."]}
   r['claim']=variants[kind][(i//8)%4]
   rows.append(pair(audit_prompt(r['claim']),p,json.dumps(r['expected'],separators=(',',':'))))
 # Preserve domain explanations and refusal behavior without leaking held-out IDs.
 snippets=json.loads((ROOT/'public/data/snippets.json').read_text())
 for s in snippets:rows.append(pair('Explain '+s['title'],s,s['text']+' ['+s['id']+']'))
 for i in range(40):rows.append(pair('Explain an unlisted crossing.',{},"I don't know: no supporting record was retrieved. Consult WDFW. [WDFW]"))
 random.Random(2026).shuffle(rows)
 valrows=[pair(audit_prompt(r['claim']),p,json.dumps(r['expected'])) for p in valid for r in cases(p)[::2]]
 # Balanced capability test: one true field claim, one false field claim, one overreach per site.
 tests=[]
 for i,p in enumerate(test):
  cs=cases(p,1)
  other={'total':'passable','partial':'total','passable':'total','unknown':'passable'}[p['status']]
  fresh={0:f'The passage-status entry in this supplied inventory reads "{p["status"]}".',1:f'This official entry reports "{other}" for passage.',2:'From this record alone, we know all upstream spawning grounds are accessible.',3:'The survey includes an eyewitness observation of fish at the crossing.',5:'The evidence contains a present-day measurement of toxic tire pollution at the site.',7:"This site's overlap with a temperature-impaired listing has been confirmed."}
  for j,claim in fresh.items():cs[j]['claim']=claim
  for r in [cs[0],cs[1],cs[[2,3,5,7][i%4]]]:
   r['id']=f"audit-{len(tests)+1:03d}";r['question']=audit_prompt(r['claim']);tests.append(r)
 for n,rs in [('train',rows),('valid',valrows),('test',[pair(r['question'],r['site'],json.dumps(r['expected'])) for r in tests])]:
  (OUT/f'{n}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in rs))
 (OUT/'benchmark.json').write_text(json.dumps(tests,indent=2));(OUT/'manifest.json').write_text(json.dumps({'trainPairs':len(rows),'validationPairs':len(valrows),'testCases':len(tests),'testSites':40,'validationSites':20,'version':2,'developmentSitesExcluded':40,'split':'SHA256 Site ID ordering; first 40 previous experiment sites are development-only and excluded; next 20 validation sites; next 40 fresh test sites; training starts at index 100','labelMethod':'Programmatic field comparison and explicit missing-evidence rules. Not expert-reviewed. Fresh test sites after inspecting v1 errors; test uses distinct wording but related task families.','system':SYSTEM,'seed':2026},indent=2));print(len(rows),len(valrows),len(tests))
if __name__=='__main__':build()
