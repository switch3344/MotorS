from pathlib import Path
import subprocess,shutil
import argparse
parser=argparse.ArgumentParser(description='Build the requested seven-part GT-R edit')
parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
parser.add_argument('--input', default='.qa/source-gtr.mp4')
parser.add_argument('--output', default='public/video/gtr_final_ready.mp4')
parser.add_argument('--font', default='C:/Windows/Fonts/impact.ttf')
args=parser.parse_args()
if not args.ffmpeg: parser.error('Pass --ffmpeg /path/to/ffmpeg')
ff=args.ffmpeg
temp=Path('.qa/user-montage');temp.mkdir(parents=True, exist_ok=True)
shutil.copyfile(args.font,temp/'impact.ttf')
for name,text in {'t1':'А','t2':'ВЫ ХОТИТЕ','t3':'ТАК ЕЗДИТЬ?','offer':'ДИАГНОСТИКА ДВИГАТЕЛЯ','brand':'MotorServiceKRD  •  Краснодар','credit':'Видео: Авторевю / Nissan GT-R'}.items():
 (temp/(name+'.txt')).write_text(text,encoding='utf-8')
font='.qa/user-montage/impact.ttf'
def text(file,size,y='(h-text_h)/2',color='white'):
 return f'drawtext=fontfile={font}:textfile=.qa/user-montage/{file}.txt:fontcolor={color}:fontsize={size}:x=(w-text_w)/2:y={y}'
parts=[
 '[0:v]crop=trunc(iw*0.92/2)*2:trunc(ih*0.92/2)*2,scale=1280:720,fps=30,setsar=1,format=yuv420p,split=7[v0][v1][v2][v3][v4][v5][v6]',
 '[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,asplit=4[a0][a2][a4][a6]',
 '[v0]trim=start=0:end=22,setpts=PTS-STARTPTS[v_main]',
 '[a0]atrim=start=0:end=22,asetpts=PTS-STARTPTS[a_main]',
 '[v1]trim=duration=0.65,setpts=PTS-STARTPTS,drawbox=t=fill:c=black,'+text('t1','h*0.14')+'[v_t1]',
 'anullsrc=r=48000:cl=stereo,atrim=duration=0.65,asetpts=PTS-STARTPTS[a_t1]',
 '[v2]trim=start=18.5:end=19.15,setpts=PTS-STARTPTS[v_flash1]',
 '[a2]atrim=start=18.5:end=19.15,asetpts=PTS-STARTPTS,volume=1.3,alimiter=limit=0.95:level=false[a_flash1]',
 '[v3]trim=duration=0.75,setpts=PTS-STARTPTS,drawbox=t=fill:c=black,'+text('t2','h*0.08')+'[v_t2]',
 'anullsrc=r=48000:cl=stereo,atrim=duration=0.75,asetpts=PTS-STARTPTS[a_t2]',
 '[v4]trim=start=20.8:end=21.45,setpts=PTS-STARTPTS[v_flash2]',
 '[a4]atrim=start=20.8:end=21.45,asetpts=PTS-STARTPTS,volume=1.4,alimiter=limit=0.95:level=false[a_flash2]',
 '[v5]trim=duration=0.85,setpts=PTS-STARTPTS,drawbox=t=fill:c=black,'+text('t3','h*0.08')+'[v_t3]',
 'anullsrc=r=48000:cl=stereo,atrim=duration=0.85,asetpts=PTS-STARTPTS[a_t3]',
 '[v6]trim=start=16:end=19.5,setpts=PTS-STARTPTS,boxblur=20:5,drawbox=t=fill:c=black@0.55,'+text('offer','h*0.055','(h/2)-h*0.06')+','+text('brand','h*0.038','(h/2)+h*0.03','0xFFD700')+','+text('credit','16','h-30','white@0.5')+'[v_end]',
 '[a6]atrim=start=16:end=19.5,asetpts=PTS-STARTPTS,afade=t=out:st=0.5:d=3[a_end]',
 '[v_main][a_main][v_t1][a_t1][v_flash1][a_flash1][v_t2][a_t2][v_flash2][a_flash2][v_t3][a_t3][v_end][a_end]concat=n=7:v=1:a=1[outv][outa]'
]
graph=';'.join(parts)
(temp/'filter.txt').write_text(graph,encoding='utf-8')
cmd=[ff,'-y','-hide_banner','-loglevel','warning','-i',args.input,'-filter_complex',graph,'-map','[outv]','-map','[outa]','-c:v','libx264','-preset','fast','-tune','fastdecode','-crf','18','-g','30','-keyint_min','30','-sc_threshold','0','-bf','0','-refs','1','-maxrate','2500k','-bufsize','5000k','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',args.output]
subprocess.run(cmd,check=True)
subprocess.run([ff,'-y','-hide_banner','-loglevel','error','-ss','26.7','-i',args.output,'-frames:v','1',str(temp/'final-frame.png')],check=True)
print('User montage rendered')
