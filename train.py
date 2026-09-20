"""Local PEFT LoRA SFT. No hosted inference APIs. Python 3.11+."""
import argparse,json,os,platform,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
def main():
 p=argparse.ArgumentParser();p.add_argument('--epochs',type=int,choices=[1,2,3],default=2);p.add_argument('--cpu',action='store_true',help='Explicit 200-step CPU training; otherwise skip when CUDA is absent');p.add_argument('--max-steps',type=int,default=None);p.add_argument('--skip',action='store_true');p.add_argument('--backend',choices=['auto','mlx','peft'],default='auto');args=p.parse_args()
 if args.skip:
  print('RAG-only mode selected; no adapter trained.');return
 if args.backend=='mlx' or (args.backend=='auto' and platform.system()=='Darwin' and platform.machine()=='arm64' and not args.cpu):
  cmd=[sys.executable,'-m','mlx_lm','lora','--config',str(ROOT/'scripts/mlx_config.yaml')]
  if os.getenv('MODEL_NAME'):cmd.extend(['--model',os.environ['MODEL_NAME']])
  if args.max_steps is not None:cmd.extend(['--iters',str(args.max_steps)])
  log=ROOT/'data/specialist/training_log.txt';log.parent.mkdir(parents=True,exist_ok=True)
  with log.open('w') as out:
   process=subprocess.Popen(cmd,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
   for line in process.stdout:print(line,end='',flush=True);out.write(line);out.flush()
   if process.wait():raise subprocess.CalledProcessError(process.returncode,cmd)
  from scripts.training_metadata import record
  record(log);return
 import torch
 if not torch.cuda.is_available() and not args.cpu:
  print('No CUDA: RAG-only mode. App remains fully functional. Use --cpu for a 200-step LoRA run.');return
 from datasets import load_dataset
 from transformers import AutoModelForCausalLM,AutoTokenizer
 from peft import LoraConfig
 from trl import SFTTrainer,SFTConfig
 name=os.getenv('MODEL_NAME','Qwen/Qwen2.5-0.5B-Instruct');use_cpu=args.cpu or not torch.cuda.is_available();steps=args.max_steps if args.max_steps is not None else (200 if use_cpu else -1)
 tokenizer=AutoTokenizer.from_pretrained(name);tokenizer.pad_token=tokenizer.eos_token;tokenizer.padding_side='right'
 model=AutoModelForCausalLM.from_pretrained(name,torch_dtype=torch.float32 if use_cpu else torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16)
 data=load_dataset('json',data_files={'train':str(ROOT/'data/train.jsonl'),'validation':str(ROOT/'data/val.jsonl')})
 # Prompt/completion gives completion-only loss without requiring generation tags in Qwen's template.
 data=data.map(lambda row:{'prompt':row['messages'][:-1],'completion':row['messages'][-1:]},remove_columns=['messages'])
 config=SFTConfig(output_dir=str(ROOT/'training-output'),num_train_epochs=args.epochs,max_steps=steps,max_length=768,per_device_train_batch_size=1,per_device_eval_batch_size=1,gradient_accumulation_steps=4,learning_rate=2e-4,logging_steps=10,save_strategy='no',eval_strategy='no',report_to='none',use_cpu=use_cpu,bf16=not use_cpu and torch.cuda.is_bf16_supported(),fp16=not use_cpu and not torch.cuda.is_bf16_supported(),gradient_checkpointing=True,gradient_checkpointing_kwargs={'use_reentrant':False},completion_only_loss=True,seed=8)
 trainer=SFTTrainer(model=model,args=config,train_dataset=data['train'],eval_dataset=data['validation'],processing_class=tokenizer,peft_config=LoraConfig(r=16,lora_alpha=32,lora_dropout=0.05,bias='none',task_type='CAUSAL_LM',target_modules=['q_proj','k_proj','v_proj','o_proj']))
 result=trainer.train();trainer.save_model(str(ROOT/'adapter'));tokenizer.save_pretrained(str(ROOT/'adapter'))
 (ROOT/'adapter/training_run.json').write_text(json.dumps({'base':name,'metrics':result.metrics,'steps':trainer.state.global_step,'max_length':768,'rank':16,'alpha':32},indent=2));print('Adapter saved to',ROOT/'adapter')
if __name__=='__main__':main()
