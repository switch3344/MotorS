"""Render the black brand outro as antialiased motion-graphics frames."""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.qa/outro-v6'
OUT.mkdir(parents=True,exist_ok=True)
W,H,FPS,COUNT=1920,1080,30,156

def font(subset,size,weight):
    value=ImageFont.truetype(str(ROOT/f'public/fonts/manrope-{subset}-wght-normal.woff2'),size)
    value.set_variation_by_axes([weight])
    return value
brand=font('latin',64,600)
headline=font('cyrillic',88,500)
subtitle=font('cyrillic',54,400)
credit=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)

def clamp(x): return max(0,min(1,x))
def smooth(x):
    x=clamp(x);return x*x*(3-2*x)
def curve(t):
    return (3*(1-t)**2*t*500 + 3*(1-t)*t*t*1420+t**3*1920,
        (1-t)**3*840+3*(1-t)**2*t*585+3*(1-t)*t*t*585+t**3*840)
points=[curve(i/1200) for i in range(1201)]
S=2
for frame in range(COUNT):
    t=frame/FPS
    image=Image.new('RGB',(W,H),'#000000')
    progress=smooth((t-1.35)/1.6)
    count=round(progress*1200)
    if count>0:
        # Supersample just the arc's narrow bounding strip; no full-frame blur or grain.
        arc=Image.new('RGB',(W*S,300*S),'#000000')
        draw=ImageDraw.Draw(arc)
        path=[(round(x*S),round((y-580)*S)) for x,y in points[:count+1]]
        draw.line(path,fill=(244,243,238),width=7,joint='curve')
        tip=smooth(1-(t-2.95)/.3)
        color=tuple(round(a*tip+b*(1-tip)) for a,b in zip((229,23,63),(244,243,238)))
        draw.line(path[max(0,len(path)-12):],fill=color,width=8,joint='curve')
        image.paste(arc.resize((W,300),Image.Resampling.LANCZOS),(0,580))
    draw=ImageDraw.Draw(image)
    for text,typeface,y,start,color in [
        ('MotorServiceKRD',brand,250,1.5,(245,246,248)),
        ('Чтобы ехать уверенно',headline,360,1.85,(245,246,248)),
        ('Диагностика двигателя',subtitle,490,2.25,(167,174,184)),
        ('Видео: Авторевю / Nissan GT-R',credit,1010,2.5,(82,88,96)),
    ]:
        alpha=smooth((t-start)/.35)
        if alpha<=0:continue
        rgb=tuple(round(v*alpha) for v in color)
        box=draw.textbbox((0,0),text,font=typeface)
        x=(W-(box[2]-box[0]))/2-box[0]
        rise=8*(1-smooth((t-start)/.4))
        draw.text((x,y+rise-box[1]),text,font=typeface,fill=rgb)
    image.save(OUT/f'frame-{frame:03d}.png',compress_level=2)
    if frame==COUNT-1:image.save(OUT/'preview.png')
print('Brand outro rendered:',COUNT,'frames')

# Title cards use the site's variable font at a deliberate heavy weight.
cardfont=font('cyrillic',208,800)
for name,text,count in [('a','ВСЁ',15),('want','НАЧИНАЕТСЯ',20),('drive','С ДВИГАТЕЛЯ',24)]:
    folder=ROOT/'.qa/user-montage'/('card-'+name);folder.mkdir(parents=True,exist_ok=True)
    for frame in range(count):
        image=Image.new('RGB',(W,H),'black');draw=ImageDraw.Draw(image)
        box=draw.textbbox((0,0),text,font=cardfont)
        x=(W-(box[2]-box[0]))/2-box[0];y=(H-(box[3]-box[1]))/2-box[1]
        alpha=min(1,frame/1.2);color=tuple([round(255*alpha)]*3)
        draw.text((x,y+8*(1-min(1,frame/3.6))**3),text,font=cardfont,fill=color)
        image.save(folder/f'frame-{frame:03d}.png',compress_level=2)
