"""Compare raw base and adapter outputs on the exact same held-out prompts and context.
No output repair, retry, template fallback or answer postprocessing contributes to model scores.
"""
import json,time,sys,gc,hashlib,platform,argparse,datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from specialist import Specialist,parse_audit,MODEL

def main():
 p=argparse.ArgumentParser();p.add_argument('--mode',choices=['base','adapter','publish'],required=True);a=p.parse_args()
 cases=json.loads((ROOT/'data/specialist/benchmark.json').read_text());out=ROOT/'data/specialist'
 if a.mode!='publish':
  if a.mode=='adapter' and not (ROOT/'adapter/mlx/adapters.safetensors').exists():raise SystemExit('No trained adapter')
  model=Specialist(base_only=a.mode=='base');results=[]
  for i,c in enumerate(cases):
   start=time.perf_counter();raw=model.answer(c['question'],c['site']);elapsed=time.perf_counter()-start;obj=parse_audit(raw)
   valid_cites=bool(obj and obj['citations']==[c['site']['id']]);correct=bool(obj and obj['verdict']==c['expected']['verdict'])
   results.append({'id':c['id'],'raw':raw,'parsed':obj,'model':model.model_name,'benchmarkSha256':hashlib.sha256((out/'benchmark.json').read_bytes()).hexdigest(),'seconds':round(elapsed,3),'correctVerdict':correct,'validCitations':valid_cites,'passed':correct and valid_cites})
   (out/f'results_{a.mode}.json').write_text(json.dumps(results,indent=2));print(f"{a.mode} {i+1}/{len(cases)} verdict={correct} citations={valid_cites} {elapsed:.2f}s",flush=True)
  return
 base=json.loads((out/'results_base.json').read_text());adapter=json.loads((out/'results_adapter.json').read_text())
 assert len(base)==len(adapter)==len(cases)==120
 checksum=hashlib.sha256((out/'benchmark.json').read_bytes()).hexdigest()
 assert all(r.get('benchmarkSha256')==checksum for r in base+adapter), 'Results must match the frozen benchmark'
 assert all(r.get('model')==MODEL for r in base+adapter), 'Both runs must use the same base model'
 assert all(c['id']==b['id']==d['id'] for c,b,d in zip(cases,base,adapter))
 training=json.loads((ROOT/'adapter/mlx/training_run.json').read_text())
 assert training['base']==MODEL and training['benchmarkSha256']==checksum
 assert training['adapterSha256']==hashlib.sha256((ROOT/'adapter/mlx/adapters.safetensors').read_bytes()).hexdigest(), 'Published weights must match the completed run'
 def summary(rows):return {'total':len(rows),'correctVerdicts':sum(r['correctVerdict'] for r in rows),'validCitations':sum(r['validCitations'] for r in rows),'passed':sum(r['passed'] for r in rows),'meanSeconds':round(sum(r['seconds'] for r in rows)/len(rows),2)}
 artifact={'model':MODEL,'trainedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'hardware':platform.machine(),'dataset':json.loads((out/'manifest.json').read_text()),'base':summary(base),'adapter':summary(adapter),'method':'Raw greedy generations on 120 rule-labeled cases from 40 unseen sites. Same prompts and retrieved context. No repair or fallback. Related task families; not an independent expert benchmark. Verdict/citation scores do not verify every word of the explanation.','cases':[{**c,'base':b,'adapter':d} for c,b,d in zip(cases,base,adapter)]}
 artifact['training']=training
 (ROOT/'public/data/model-evaluation.json').write_text(json.dumps(artifact,indent=2));print(json.dumps({k:artifact[k] for k in ['base','adapter','method']},indent=2))
if __name__=='__main__':main()
