/** Start the app and local model API together; all inference stays on this computer. */
import {spawn} from 'node:child_process';import {existsSync} from 'node:fs';
const python=process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python';
if(!existsSync(python)){console.error('Create .venv and install requirements-mlx.txt (Apple silicon) or requirements.txt first. See README.');process.exit(1)}
const children=[spawn(python,['-m','uvicorn','server:app','--host','127.0.0.1','--port','8000'],{stdio:'inherit'}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1'],{stdio:'inherit'})];
let stopping=false;function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(code),500)}
for(const child of children){child.on('error',error=>{console.error(error.message);stop(1)});child.on('exit',code=>{if(!stopping)stop(code??1)})}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
