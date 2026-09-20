"""Local synthetic narration and video assembly. Requires macOS say and FFmpeg."""
import json,subprocess,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];BUILD=ROOT/'video-build';BUILD.mkdir(exist_ok=True)
def run(args):return subprocess.run(args,cwd=ROOT,check=True)
def duration(path):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)]))
def timestamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
def main():
 p=argparse.ArgumentParser();p.add_argument('mode',choices=['audio','assemble']);a=p.parse_args()
 if a.mode=='audio':
  ss=json.loads((ROOT/'scripts/video_segments.json').read_text())
  for i,s in enumerate(ss):
   path=BUILD/f'{i:02}';path.with_suffix('.txt').write_text(s['text'])
   run(['say','-v','Samantha','-r','155','-f',str(path.with_suffix('.txt')),'-o',str(path.with_suffix('.aiff'))])
   pad=11 if s['scene']=='map' else 1
   run(['ffmpeg','-loglevel','error','-y','-i',str(path.with_suffix('.aiff')),'-af',f'apad=pad_dur={pad}','-ar','48000',str(path.with_suffix('.wav'))])
   s['duration']=duration(path.with_suffix('.wav'))
  (BUILD/'timeline.json').write_text(json.dumps(ss,indent=2));print('Narration timeline:',sum(s['duration'] for s in ss));return
 ss=json.loads((BUILD/'timeline.json').read_text());concat=BUILD/'audio-list.txt';concat.write_text(''.join(f"file '{i:02}.wav'\n" for i in range(len(ss))))
 run(['ffmpeg','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c:a','pcm_s16le',str(BUILD/'narration.wav')])
 video=(BUILD/'recording-path.txt').read_text().strip()
 run(['ffmpeg','-loglevel','error','-y','-i',video,'-i',str(BUILD/'narration.wav'),'-filter_complex','[0:v]tpad=stop_mode=clone:stop_duration=2[v];[1:a]adelay=700|700[a]','-map','[v]','-map','[a]','-c:v','libx264','-crf','23','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest',str(ROOT/'public/demo.mp4')])
 captions=['WEBVTT\n'];elapsed=.7
 for s in ss:
  sentences=[t.strip()+'.' for t in s['text'].split('. ') if t.strip()];length=sum(len(t) for t in sentences);spoken=s['duration']-(11 if s['scene']=='map' else 1)
  for sentence in sentences:
   end=elapsed+spoken*len(sentence)/length;captions.append(f'{timestamp(elapsed)} --> {timestamp(end)}\n{sentence}\n');elapsed=end
  elapsed+=11 if s['scene']=='map' else 1
 (ROOT/'public/demo.vtt').write_text('\n'.join(captions));print('Final video duration:',duration(ROOT/'public/demo.mp4'))
if __name__=='__main__':main()
