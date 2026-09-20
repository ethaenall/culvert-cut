"""Apple-GPU local specialist. No hosted inference, raw outputs retained for evaluation."""
import json,time,re,os
from pathlib import Path
from scripts.build_jsonl import SYSTEM
ROOT=Path(__file__).resolve().parent
_config=ROOT/'adapter/mlx/adapter_config.json'
MODEL=os.getenv('MODEL_NAME') or (json.loads(_config.read_text()).get('model') if _config.exists() else None) or 'Qwen/Qwen2.5-0.5B-Instruct'
class Specialist:
 def __init__(self,base_only=False):
  from mlx_lm import load
  from mlx_lm.sample_utils import make_sampler
  self.adapter_loaded=(ROOT/'adapter/mlx/adapters.safetensors').exists() and not base_only
  self.model_name=json.loads((ROOT/'adapter/mlx/adapter_config.json').read_text()).get('model',MODEL) if self.adapter_loaded else MODEL
  self.model,self.tokenizer=load(self.model_name,adapter_path=str(ROOT/'adapter/mlx') if self.adapter_loaded else None)
  self.sampler=make_sampler(temp=0)
 def answer(self,question,context,max_tokens=160):
  from mlx_lm import generate
  messages=[{'role':'system','content':SYSTEM},{'role':'user','content':question+'\n\nContext:\n'+json.dumps(context,separators=(',',':'),ensure_ascii=False)}]
  prompt=self.tokenizer.apply_chat_template(messages,tokenize=False,add_generation_prompt=True)
  if len(self.tokenizer.encode(prompt))>4096:raise ValueError('Context too long')
  return generate(self.model,self.tokenizer,prompt=prompt,max_tokens=max_tokens,sampler=self.sampler,verbose=False)
def parse_audit(raw):
 text=raw.strip()
 if text.startswith('```'):text=re.sub(r'^```(?:json)?\s*|\s*```$','',text)
 try:
  obj=json.loads(text)
  if not isinstance(obj,dict) or obj.get('verdict') not in ['supported','contradicted','insufficient']:return None
  if not isinstance(obj.get('reason'),str) or not isinstance(obj.get('citations'),list):return None
  return obj
 except (ValueError,TypeError):return None
