"""Fail on out-of-context Site IDs over 40 site-disjoint held-out examples.
This is an identifier test, not proof of full factual accuracy. Raw outputs are retained.
"""
import argparse,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent
def emitted_ids(text):
 ids=set(re.findall(r'\b[Ss]ite(?:\s+ID)?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9_.-]*\d[A-Za-z0-9_.-]*)',text))
 ids.update(re.findall(r'\[([A-Za-z0-9_.-]*\d[A-Za-z0-9_.-]*)\]',text))
 # Bare numeric inventory IDs are also suspicious, even without a Site prefix.
 ids.update(re.findall(r'(?<![\w.])\d{6,}(?:\.[0-9A-Za-z]+)?(?![\w.])',text))
 return {i.rstrip('.') for i in ids}
def main():
 p=argparse.ArgumentParser();p.add_argument('--template',action='store_true',help='Evaluate deterministic reference only; does not score a model');p.add_argument('--base-only',action='store_true');a=p.parse_args()
 rows=json.loads((ROOT/'data/heldout_sites.json').read_text());assert len(rows)==40
 if not a.template:
  from infer import LocalModel
  model=LocalModel(a.base_only)
 from scripts.build_jsonl import explainer
 results=[]
 for s in rows:
  text=explainer(s) if a.template else model.answer('Explain this site. Never invent a Site ID.',s)
  # Remove the exact contextual identifier first: official IDs can contain spaces.
  checked=text.replace(s['id'], 'KNOWN_ID')
  unknown=sorted(emitted_ids(checked));results.append({'site':s['id'],'output':text,'unknownIds':unknown,'hasCitation':f"[{s['id']}]" in text})
 report={'mode':'template reference' if a.template else ('adapter' if model.adapter_loaded else 'base'),'evaluated':40,'failures':sum(bool(r['unknownIds']) for r in results),'missingCitations':sum(not r['hasCitation'] for r in results),'results':results}
 out=ROOT/'data'/('eval_template.json' if a.template else 'eval_model.json');out.write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2));raise SystemExit(1 if report['failures'] or report['missingCitations'] else 0)
if __name__=='__main__':main()
