"""Refresh official bounding-box snapshots. Standard library only; no fabricated fallback."""
import json, urllib.request, urllib.parse, concurrent.futures, datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/data'
WDFW='https://geodataservices.wdfw.wa.gov/arcgis/rest/services/ApplicationServices/FP_Sites/MapServer'
SERVICES={'streams':'https://services.arcgis.com/Ej0PsM5Aw677QF1W/arcgis/rest/services/WTRCRS_LINE_176/FeatureServer/0','coho':'https://services.arcgis.com/Ej0PsM5Aw677QF1W/arcgis/rest/services/FP_COHOINTRINSICPOTENTIAL_LINE_2880/FeatureServer/0','county-sites':'https://services.arcgis.com/Ej0PsM5Aw677QF1W/arcgis/rest/services/FP_FISHPASSAGESITES_POINT_2879/FeatureServer/0','impaired':'https://services.arcgis.com/6lCKYNJLvwTXqrmp/arcgis/rest/services/WQ/FeatureServer/4'}
def get(url,**params):
 req=urllib.request.Request(url+'?'+urllib.parse.urlencode(params),headers={'User-Agent':'CulvertCut/1.0 public-data research'})
 with urllib.request.urlopen(req,timeout=90) as r: d=json.load(r)
 if 'error' in d: raise RuntimeError(d['error'])
 return d
def query(url,where='1=1'):
 params=dict(where=where,geometry='-122.25,47.45,-121.85,47.78',geometryType='esriGeometryEnvelope',inSR=4326,spatialRel='esriSpatialRelIntersects')
 ids=get(url+'/query',f='json',returnIdsOnly='true',**params).get('objectIds') or []
 features=[]
 for start in range(0,len(ids),150):
  d=get(url+'/query',f='geojson',objectIds=','.join(map(str,ids[start:start+150])),outFields='*',outSR=4326,geometryPrecision=6)
  if d.get('exceededTransferLimit') or d.get('properties',{}).get('exceededTransferLimit'): raise RuntimeError('Truncated chunk')
  features.extend(d['features'])
 return {'type':'FeatureCollection','features':features}
def save(name,d):
 path=OUT/(name+'.geojson'); tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(d,separators=(',',':')));tmp.replace(path)
 print(name,len(d['features']),flush=True)
def fetch_sites():
 features=[]
 meta=get(WDFW+'/2',f='json'); domains={f['name']:{c['code']:c['name'] for c in (f.get('domain') or {}).get('codedValues',[])} for f in meta['fields']}
 for layer,status in [(0,'passable'),(1,'partial'),(2,'total'),(3,'unknown'),(8,'unknown')]:
  d=query(f'{WDFW}/{layer}','WRIANumber=8')
  for f in d['features']:
   p=f['properties']; p.update(id=p['SiteId'],status=status,stream=p.get('StreamName') or 'Unnamed stream',feature=p.get('FeatureType') or 'Unknown',fishUse=domains['FishUseCode'].get(p.get('FishUseCode'),'Unknown'),owner=domains['OwnerTypeCode'].get(p.get('OwnerTypeCode'),'Unknown'),access='Unknown — no network join',impairment='Unknown — no spatial join',source='WDFW',official=p.get('FormLinkURL') or f'{WDFW}/{layer}',wria=p.get('WRIANumber'),survey=p.get('SurveyDate'),road=p.get('RoadName') or 'Unnamed crossing')
   features.append(f)
 unique={f['properties']['id']:f for f in features};save('sites',{'type':'FeatureCollection','features':list(unique.values())})
def main():
 OUT.mkdir(parents=True,exist_ok=True);errors={}
 jobs={'sites':fetch_sites,**{n:lambda n=n,u=u:save(n,query(u)) for n,u in SERVICES.items()}}
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
  futures={pool.submit(fn):name for name,fn in jobs.items()}
  for future in concurrent.futures.as_completed(futures):
   try:future.result()
   except Exception as e:errors[futures[future]]=str(e);print('FAILED',futures[future],e,flush=True)
 manifest={'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bbox':[-122.25,47.45,-121.85,47.78],'siteFilter':'WRIANumber=8','services':{'sites':WDFW,**SERVICES},'errors':errors,'note':'Other layers are bbox clips, not a WRIA boundary clip. Failed refreshes preserve existing snapshots.'}
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
 if errors:raise SystemExit(1)
if __name__=='__main__':main()
