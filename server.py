"""Optional loopback-only local inference API. UI never displays unchecked model prose."""
import json,re,threading
from pathlib import Path
from fastapi import FastAPI,HTTPException
from pydantic import BaseModel,Field
from scripts.build_jsonl import context
ROOT=Path(__file__).resolve().parent
app=FastAPI(title='Culvert Cut local model')
SITES=[context(s) for s in json.loads((ROOT/'public/data/sites.geojson').read_text())['features']]
SNIPPETS=json.loads((ROOT/'public/data/snippets.json').read_text());lock=threading.Lock();model=None
class Ask(BaseModel):
 question:str=Field(min_length=1,max_length=1500)
 context:dict=Field(default_factory=dict)
def retrieve(question,requested):
 terms=set(re.findall(r'[a-z0-9]+',question.lower()))-{'what','this','that','the','is','a','on','in','can','you','tell','me','about','it','and','for','of','does','why','site','explain','creek','cr','river','stream','crossing','barrier'}
 ranked=sorted(((sum((10 if t==s['id'].lower() else 0)+(3 if t in re.findall(r'[a-z0-9]+',s['stream'].lower()) else 0)+(1 if t in re.findall(r'[a-z0-9]+',s['road'].lower()) else 0) for t in terms),s) for s in SITES),key=lambda x:x[0],reverse=True)
 sites=[s for n,s in ranked if n][:3]
 # A selected site ID may guide retrieval, but all fields are read back from canonical files.
 if re.search(r'\b(this|selected)\b',question,re.I):
  ids={str(s.get('properties',{}).get('id')) for s in requested.get('sites',[]) if isinstance(s,dict)}
  sites=([s for s in SITES if s['id'] in ids]+sites)[:3]
 snippets=sorted(((sum(k in question.lower() for k in s['keywords']),s) for s in SNIPPETS),key=lambda x:x[0],reverse=True)
 docs=[s for n,s in snippets if n][:2]
 if docs and re.search(r'temperature|oxygen|6ppd|rain|flush|riparian|303|impaired',question,re.I) and not re.search(r'\b(this|selected)\b',question,re.I):
  sites=[s for s in sites if s['id'].lower() in re.findall(r'[a-z0-9]+',question.lower())]
 return sites,docs
def supported(sites,snippets):
 result=[]
 for s in sites:
  for text in [f"Site {s['id']} on {s['stream']} is recorded as {s['status']}.",f"Fish use is {s['fishUse']} and the feature is {s['feature']}.",f"Owner type is {s['owner']}; a named responsible contact is not supplied.","Upstream connectivity and site-level 303(d) status are not verified by this record."]:
   result.append({'text':text,'cite':s['id'],'url':s['official']})
 for s in snippets:result.append({'text':s['text'],'cite':s['id'],'url':s['url']})
 return result
@app.get('/api/health')
def health():return {'mode':'adapter loaded' if model and model.adapter_loaded else 'base available' if model else 'not loaded'}
@app.post('/api/ask')
def ask(body:Ask):
 global model
 sites,snippets=retrieve(body.question,body.context);allowed=supported(sites,snippets)
 if not allowed:return {'mode':'template fallback','sentences':[{'text':"I don't know: no matching official record was retrieved; check WDFW's inventory.",'cite':'WDFW','url':'https://wdfw.wa.gov/species-habitats/habitat-recovery/fish-passage/assessment'}]}
 with lock:
  try:
   if model is None:
    from infer import LocalModel
    model=LocalModel()
   raw=model.answer(body.question,{'sites':sites,'snippets':snippets,'supportedSentences':allowed})
  except Exception as e:raise HTTPException(503,'Local model unavailable; use templates.') from e
 # Fail closed: citation alone is insufficient proof. Accept only exact supported text + citation.
 selected=[s for s in allowed if s['text']+' ['+s['cite']+']' in raw]
 if not selected:return {'mode':'template fallback · model output rejected','sentences':allowed[:3]}
 return {'mode':'adapter loaded · extractive gate' if model.adapter_loaded else 'base model · extractive gate','sentences':selected[:5]}

class AuditRequest(BaseModel):
 siteId:str=Field(min_length=1,max_length=80)
 claim:str=Field(min_length=3,max_length=1000)

@app.post('/api/audit')
def audit(body:AuditRequest):
 global model
 site=next((s for s in SITES if s['id']==body.siteId),None)
 if site is None:raise HTTPException(404,'Site not in bundled inventory')
 from scripts.build_specialist import audit_prompt
 from specialist import parse_audit
 import time
 with lock:
  try:
   if model is None:
    from infer import LocalModel
    model=LocalModel()
   start=time.perf_counter();raw=model.answer(audit_prompt(body.claim),site);elapsed=time.perf_counter()-start
  except Exception as e:raise HTTPException(503,'Local model is unavailable.') from e
 parsed=parse_audit(raw)
 valid=bool(parsed and parsed['citations']==[site['id']])
 return {'mode':'adapter' if model.adapter_loaded else 'base','raw':raw,'parsed':parsed if valid else None,'citationCheck':valid,'seconds':round(elapsed,2),'site':site,'note':'Model interpretation of an inventory snapshot. Citation validation does not establish factual correctness.'}
