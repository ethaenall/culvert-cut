import json,unittest,hashlib
from pathlib import Path
from specialist import parse_audit
ROOT=Path(__file__).resolve().parents[1]
class SpecialistTests(unittest.TestCase):
 def test_parser_rejects_invalid_verdict(self):self.assertIsNone(parse_audit('{"verdict":"safe","reason":"sure","citations":[]}'))
 def test_parser_accepts_actual_schema(self):self.assertEqual(parse_audit('{"verdict":"insufficient","reason":"No observation","citations":["920121"]}')['verdict'],'insufficient')
 def test_parser_does_not_repair_bad_json(self):self.assertIsNone(parse_audit('probably supported'))
 def test_split_is_disjoint(self):
  paths={k:ROOT/f'data/specialist/{k}.jsonl' for k in ['train','valid','test']};ids={}
  for k,p in paths.items():
   ids[k]=set()
   for line in p.read_text().splitlines():
    context=json.loads(json.loads(line)['messages'][1]['content'].split('\n\nContext:\n')[1]);sid=context.get('id')
    if sid and context.get('wria')==8:ids[k].add(sid)
  self.assertFalse(ids['train']&ids['valid']);self.assertFalse(ids['train']&ids['test']);self.assertFalse(ids['valid']&ids['test']);self.assertEqual(len(ids['test']),40)
 def test_benchmark_balanced_and_source_grounded(self):
  rows=json.loads((ROOT/'data/specialist/benchmark.json').read_text());self.assertEqual(len(rows),120)
  for r in rows:self.assertEqual(r['expected']['citations'],[r['site']['id']])
 def test_published_raw_results_are_complete(self):
  p=ROOT/'public/data/model-evaluation.json'
  if not p.exists():self.skipTest('Evaluation not published yet')
  d=json.loads(p.read_text());self.assertEqual(len(d['cases']),120)
  benchmark=json.loads((ROOT/'data/specialist/benchmark.json').read_text())
  self.assertEqual([c['site']['id'] for c in d['cases']],[c['site']['id'] for c in benchmark])
  self.assertEqual(d['training']['adapterSha256'],hashlib.sha256((ROOT/'adapter/mlx/adapters.safetensors').read_bytes()).hexdigest())
  for mode in ['base','adapter']:
   self.assertEqual(sum(r[mode]['passed'] for r in d['cases']),d[mode]['passed'])
   for c in d['cases']:
    parsed=parse_audit(c[mode]['raw']);self.assertEqual(parsed,c[mode]['parsed'])
    self.assertEqual(bool(parsed and parsed['verdict']==c['expected']['verdict']),c[mode]['correctVerdict'])
if __name__=='__main__':unittest.main()
