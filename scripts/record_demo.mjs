/** Capture the actual local app. Synthesized narration is disclosed in VIDEO_SCRIPT.md. */
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const timeline=JSON.parse(fs.readFileSync('video-build/timeline.json','utf8'));
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:'video-build/recordings',size:{width:1440,height:1000}}});
const page=await context.newPage();
await page.goto('http://localhost:5173');
await page.getByLabel('Measured evaluation results').waitFor();
const recordingStart=Date.now();
fs.writeFileSync('video-build/capture-start.json',JSON.stringify({preRollSeconds:0}));
async function scroll(selector){await page.locator(selector).scrollIntoViewIfNeeded();}
for(const [i,s] of timeline.entries()){
 const start=Date.now();console.log('Recording',i,s.scene,s.duration);
 switch(s.scene){
  case 'intro':await page.evaluate(()=>scrollTo(0,0));break;
  case 'claim':await page.getByLabel('Case group').selectOption('all');await page.getByRole('button',{name:'Next case',exact:true}).click();await page.getByRole('button',{name:'Next case',exact:true}).click();await scroll('.trial-grid');break;
  case 'compare':await page.getByRole('button',{name:'Not established',exact:true}).click();await scroll('.trial-results');await page.locator('.model-output').first().getByText('Inspect unedited model output').click();break;
  case 'metrics':await page.evaluate(()=>scrollTo(0,380));await page.getByRole('button',{name:/Inspect the experiment/}).click();break;
  case 'failures':await page.getByRole('button',{name:'Close experiment'}).click();await page.getByLabel('Case group').selectOption('errors');await page.getByRole('button',{name:'Reveal both model responses'}).click();await scroll('.trial-results');break;
  case 'live':await page.getByRole('button',{name:'Run a new claim'}).click();await page.getByLabel('Claim to audit').fill('Fish can reach all habitat upstream of this crossing.');await page.getByRole('button',{name:'Audit this claim',exact:true}).click();await page.locator('.trial-results').waitFor();await scroll('.trial-results');break;
  case 'map':await page.getByRole('button',{name:'Explore the basin',exact:true}).click();await page.waitForFunction(()=>Number(document.querySelector('.map')?.dataset.rendered)>0);await page.getByLabel('Barriers only',{exact:true}).check();await page.getByLabel('Fish use recorded').check();await page.getByLabel('Culverts only',{exact:true}).check();await page.getByRole('button',{name:/01 Zackuse Creek/}).click();await page.waitForTimeout(2400);await page.getByRole('button',{name:'Close details'}).click();for(const row of await page.locator('.story-row').all()){await row.scrollIntoViewIfNeeded();await row.click();await page.waitForTimeout(400);}await page.getByRole('button',{name:'Close details'}).click();break;
  case 'layers':await page.getByRole('button',{name:/03 Sammamish River/}).click();await page.getByRole('button',{name:'Close details'}).click();await page.getByLabel('Coho potential / access').check();await page.getByLabel('303(d) impaired waters').check();await page.getByRole('button',{name:'Demo rain',exact:true}).click();await page.locator('.sidebar').evaluate(e=>e.scrollTop=220);break;
  case 'ask':await page.getByRole('button',{name:'Ask this basin',exact:true}).first().click();await page.getByRole('button',{name:'Explain Zackuse Creek',exact:true}).click();await page.locator('.answer .citation').first().waitFor();await page.locator('.answer').scrollIntoViewIfNeeded();break;
  case 'close':await page.getByRole('button',{name:'Evidence lab',exact:true}).click();await page.evaluate(()=>scrollTo(0,0));break;
 }
 const remaining=s.duration*1000-(Date.now()-start);if(remaining>0)await page.waitForTimeout(remaining);
}
const video=page.video();await context.close();const path=await video.path();fs.writeFileSync('video-build/recording-path.txt',path);await browser.close();console.log('Saved',path,'elapsed',(Date.now()-recordingStart)/1000);
