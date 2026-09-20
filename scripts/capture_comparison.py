"""Save real base/adapter Zackuse outputs; this example is not a held-out benchmark."""
import json,sys,gc
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from specialist import Specialist
from scripts.build_specialist import audit_prompt
site=json.loads((ROOT/'data/zackuse_fixture.json').read_text());claim='Fish can reach all habitat upstream of this crossing.'
result={'claim':claim,'context':site,'note':'Actual local generations on a showcase site, not a held-out evaluation.'}
for mode in ['base','adapter']:
 model=Specialist(base_only=mode=='base');result[mode]=model.answer(audit_prompt(claim),site);del model;gc.collect()
(ROOT/'data/comparison_actual.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
