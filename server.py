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
 terms=set(re.findall(r'[a-z0-9]+',question.lower()))-{'what','this','the','is','a','on','in','can','you','tell','me','about','it','and','for','of','site'}
 ranked=sorted(((sum(t in re.findall(r"[a-z0-9]+", f"{s['id']} {s['stream']} {s['road']}".lower()) for t in terms),s) for s in SITES),key=lambda x:x[0],reverse=True)
 sites=[s for n,s in ranked if n][:3]
 # A selected site ID may guide retrieval, but all fields are read back from canonical files.
 if re.search(r'\b(this|selected)\b',question,re.I):
  ids={str(s.get('properties',{}).get('id')) for s in requested.get('sites',[]) if isinstance(s,dict)}
  sites=([s for s in SITES if s['id'] in ids]+sites)[:3]
 snippets=sorted(((sum(k in question.lower() for k in s['keywords']),s) for s in SNIPPETS),key=lambda x:x[0],reverse=True)
 return sites,[s for n,s in snippets if n][:2]
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
 if not allowed:return {'mode':'template fallback','sentences':[{'text':"I don't know: no matching official record was retrieved. Check WDFW's inventory.",'cite':'WDFW','url':'https://wdfw.wa.gov/species-habitats/habitat-recovery/fish-passage/assessment'}]}
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
