from pathlib import Path
import argparse,shutil,subprocess,sys
parser=argparse.ArgumentParser(description='Chronological GT-R acceleration with deliberate black title interruptions')
parser.add_argument('--ffmpeg',default=shutil.which('ffmpeg'))
parser.add_argument('--input',default='.qa/source-gtr.mp4')
parser.add_argument('--output',default='public/video/gtr_final_ready_v5.mp4')
parser.add_argument('--font',default='C:/Windows/Fonts/impact.ttf')
args=parser.parse_args()
if not args.ffmpeg: parser.error('Pass --ffmpeg /path/to/ffmpeg')
subprocess.run([sys.executable,str(Path(__file__).with_name('render-hero-outro.py'))],check=True)
work=Path('.qa/user-montage');work.mkdir(parents=True,exist_ok=True)
shutil.copyfile(args.font,work/'impact.ttf')
for name,value in {'a':'А','want':'ВЫ ХОТИТЕ','drive':'ТАК ЕЗДИТЬ?','offer':'ДИАГНОСТИКА ДВИГАТЕЛЯ','brand':'MotorServiceKRD  •  Краснодар','credit':'Видео: Авторевю / Nissan GT-R'}.items():
 (work/f'{name}.txt').write_text(value,encoding='utf-8')
def card(name,size,duration):
 return (f"color=c=black:s=1920x1080:r=30:d={duration},drawtext=fontfile=.qa/user-montage/impact.ttf:"
  f"textfile=.qa/user-montage/{name}.txt:fontsize={size}:fontcolor=white:x=(w-text_w)/2:"
  "y='(h-text_h)/2+8*pow(1-min(1,t/0.12),3)':alpha='min(1,t/0.04)'")
def sound(source,start,duration,out,fade_out=True):
 fade=f',afade=t=out:st={duration-.003}:d=0.003' if fade_out else ''
 return f'[{source}]atrim=start={start}:duration={duration},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.003{fade}[{out}]'

parts=[
 '[0:v]fps=30,crop=trunc(iw*0.92/2)*2:trunc(ih*0.92/2)*2,scale=1920:1080:flags=lanczos,format=yuv420p,cas=strength=0.28:planes=1,setsar=1,split=4[v0s][v1s][v2s][v3s]',
 '[0:a]aresample=48000,aformat=channel_layouts=stereo,asplit=5[a0s][a1s][a2s][a3s][tails]',
 '[v0s]trim=start_frame=102:end_frame=107,setpts=PTS-STARTPTS[v0]',
 '[v1s]trim=start_frame=107:end_frame=143,setpts=PTS-STARTPTS[v1]',
 '[v2s]trim=start_frame=143:end_frame=292,setpts=PTS-STARTPTS[v2]',
 '[v3s]trim=start_frame=292:end_frame=544,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=0.9[v3]',
 sound('a0s',3.4,5/30,'a0'), sound('a1s',107/30,36/30,'a1'),
 sound('a2s',143/30,149/30,'a2'), sound('a3s',292/30,279/30,'a3',False),
 card('a',210,.5)+'[ca]',card('want',132,20/30)+'[cw]',card('drive',132,.8)+'[cd]',
 'anullsrc=r=48000:cl=stereo,atrim=duration=0.5,asetpts=PTS-STARTPTS[sa]',
 'anullsrc=r=48000:cl=stereo,atrim=duration=0.666666667,asetpts=PTS-STARTPTS[sw]',
 'anullsrc=r=48000:cl=stereo,atrim=duration=0.8,asetpts=PTS-STARTPTS[sd]',
 '[v0][a0][ca][sa][v1][a1][cw][sw][v2][a2][cd][sd][v3][a3]concat=n=7:v=1:a=1[main_v][main_a]',
 '[1:v]fps=30,setsar=1,format=yuv420p,settb=1/30[end]',
 '[main_v]fps=30,settb=1/30[main_sync];[main_sync][end]xfade=transition=fade:duration=0.4:offset=17.2,format=yuv420p[outv]',
 '[tails]atrim=start=18.633333:duration=4,asetpts=PTS-STARTPTS,volume=0.28,afade=t=out:st=1.7:d=2.3[tail]',
 '[main_a][tail]acrossfade=d=0.4:c1=tri:c2=tri[outa]'
]
graph=';'.join(parts);(work/'filter-v5.txt').write_text(graph,encoding='utf-8')
subprocess.run([args.ffmpeg,'-y','-hide_banner','-loglevel','warning','-i',args.input,'-framerate','30','-i','.qa/outro-v5/frame-%03d.png','-filter_complex',graph,
 '-map','[outv]','-map','[outa]','-t','21.2','-c:v','libx264','-preset','fast','-tune','fastdecode','-crf','18',
 '-g','30','-keyint_min','30','-sc_threshold','0','-bf','0','-refs','1','-maxrate','5000k','-bufsize','10000k',
 '-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',args.output],check=True)
print('CAS montage with brand arc rendered:',args.output)
