"""Local Qwen + optional adapter. Raw output must be grounded before UI display."""
import argparse,json,os
from pathlib import Path
from scripts.build_jsonl import SYSTEM
ROOT=Path(__file__).resolve().parent
class LocalModel:
 def __init__(self,base_only=False):
  import torch
  from transformers import AutoModelForCausalLM,AutoTokenizer
  from peft import PeftModel,PeftConfig
  adapter=ROOT/'adapter';self.adapter_loaded=(adapter/'adapter_config.json').exists() and not base_only
  name=PeftConfig.from_pretrained(str(adapter)).base_model_name_or_path if self.adapter_loaded else os.getenv('MODEL_NAME','Qwen/Qwen2.5-0.5B-Instruct')
  self.tokenizer=AutoTokenizer.from_pretrained(name);self.model=AutoModelForCausalLM.from_pretrained(name,torch_dtype=torch.float32 if not torch.cuda.is_available() else torch.float16)
  if self.adapter_loaded:self.model=PeftModel.from_pretrained(self.model,str(adapter))
  self.model.to('cuda' if torch.cuda.is_available() else 'cpu').eval()
 def answer(self,question,context):
  import torch
  if not context:return "I don't know: no retrieved context. Consult WDFW. [WDFW]"
  messages=[{'role':'system','content':SYSTEM},{'role':'user','content':question+'\n\nContext:\n'+json.dumps(context,ensure_ascii=False)}]
  text=self.tokenizer.apply_chat_template(messages,tokenize=False,add_generation_prompt=True);tokens=self.tokenizer(text,return_tensors='pt').to(self.model.device)
  if tokens.input_ids.shape[1]>6000:raise ValueError('Retrieved context exceeds local inference limit')
  with torch.inference_mode():output=self.model.generate(**tokens,max_new_tokens=220,do_sample=False,pad_token_id=self.tokenizer.eos_token_id)
  return self.tokenizer.decode(output[0,tokens.input_ids.shape[1]:],skip_special_tokens=True)
def main():
 p=argparse.ArgumentParser();p.add_argument('--context',required=True);p.add_argument('--question',default='Explain this site.');p.add_argument('--base-only',action='store_true');a=p.parse_args();model=LocalModel(a.base_only);print(model.answer(a.question,json.loads(Path(a.context).read_text())))
if __name__=='__main__':main()
