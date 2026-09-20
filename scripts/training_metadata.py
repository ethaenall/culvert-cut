"""Record the completed MLX run from its trainer log and actual artifact hashes."""
import datetime,hashlib,json,platform,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def record(log_path):
 log_path=Path(log_path);text=log_path.read_text();folder=ROOT/'adapter/mlx';config=json.loads((folder/'adapter_config.json').read_text())
 steps=[int(x) for x in re.findall(r'Iter (\d+): Train loss',text)]
 if not steps or max(steps)!=config['iters']:raise ValueError('Trainer log does not show all configured steps completed')
 peak=re.findall(r'Peak mem ([\d.]+) GB',text);val=re.findall(r'Val loss ([\d.]+)',text);params=re.findall(r'Trainable parameters: (.+)',text)
 digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 result={'base':config['model'],'backend':'mlx-lm 0.31.3','hardware':platform.machine(),'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'steps':max(steps),'batchSize':config['batch_size'],'rank':config['lora_parameters']['rank'],'scale':config['lora_parameters']['scale'],'equivalentAlpha':config['lora_parameters']['scale']*config['lora_parameters']['rank'],'sequenceLength':config['max_seq_length'],'seed':config['seed'],'peakMemoryGB':float(peak[-1]),'finalValidationLoss':float(val[-1]),'validationLossNote':'Five validation batches, completion-only loss; not task accuracy.','datasetSha256':digest(ROOT/config['data']/'train.jsonl'),'benchmarkSha256':digest(ROOT/config['data']/'benchmark.json'),'adapterSha256':digest(folder/'adapters.safetensors'),'adapterBytes':(folder/'adapters.safetensors').stat().st_size,'trainableParametersReported':params[-1]}
 (folder/'training_run.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
if __name__=='__main__':
 import sys
 record(sys.argv[1])
