"""Record actual base and adapter outputs for the same Zackuse fixture after training."""
import sys,json,gc
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from infer import LocalModel
from scripts.build_jsonl import context
if not (ROOT/'adapter/adapter_config.json').exists():raise SystemExit('No adapter exists. Train first; do not label templates as adapter outputs.')
site=next(s for s in json.loads((ROOT/'public/data/sites.geojson').read_text())['features'] if s['properties']['id']=='920121');c=context(site);q='Explain this site and whether kokanee can reach habitat above it.'
base=LocalModel(base_only=True);base_text=base.answer(q,c);del base;gc.collect()
import torch
if torch.cuda.is_available():torch.cuda.empty_cache()
adapter=LocalModel();output={'question':q,'context':c,'base':base_text,'adapter':adapter.answer(q,c),'note':'Actual local generations; requires manual factual review. This fixture alone is not an evaluation.'}
(ROOT/'data/comparison_actual.json').write_text(json.dumps(output,indent=2));print(json.dumps(output,indent=2))
