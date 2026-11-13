"""Render chronological acceleration, user-voiced title cards and glowing outro."""
from pathlib import Path
import argparse
import shutil
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
parser.add_argument('--input', default='.qa/source-gtr.mp4')
parser.add_argument('--output', default='public/video/gtr_final_ready_v10.mp4')
parser.add_argument('--cards-voice', default='assets-source/audio/hero-cards.wav')
parser.add_argument('--outro-voice', default='assets-source/audio/hero-outro.wav')
args = parser.parse_args()
if not args.ffmpeg:
    parser.error('Pass --ffmpeg /path/to/ffmpeg')
for source in [args.input, args.cards_voice, args.outro_voice]:
    if not Path(source).is_file():
        parser.error(f'Missing input: {source}')

renderer = Path(__file__).with_name('render-hero-outro.py')
frame_outputs = [Path('.qa/outro-v10/frame-155.png'), Path('.qa/outro-v10/preview.png'),
                 Path('.qa/user-montage/card-v10-a/frame-014.png'),
                 Path('.qa/user-montage/card-v10-want/frame-027.png'),
                 Path('.qa/user-montage/card-v10-drive/frame-025.png')]
if not all(p.exists() and p.stat().st_mtime >= renderer.stat().st_mtime for p in frame_outputs):
    subprocess.run([sys.executable, str(renderer)], check=True)
work = Path('.qa/user-montage')
work.mkdir(parents=True, exist_ok=True)
FPS = 30
CUTS = [102, 145, 209, 292, 579]  # ~50, ~100 and 150 km/h, then moving fade.
CARD_FRAMES = [15, 28, 26]  # Full spoken words, with their original voice speed.
MAIN_DURATION = (CUTS[-1] - CUTS[0] + sum(CARD_FRAMES)) / FPS
CROSSFADE = 1.2
OUTRO_DURATION = 5.2
FADE_START = MAIN_DURATION - CROSSFADE
VOICE_START = MAIN_DURATION + .05
DURATION = FADE_START + OUTRO_DURATION

def sound(source, start, duration, out, fade_out=True):
    fade = f',afade=t=out:st={duration-.003}:d=0.003' if fade_out else ''
    return (f'[{source}]atrim=start={start}:duration={duration},asetpts=PTS-STARTPTS,'
            f'afade=t=in:st=0:d=0.003{fade}[{out}]')

def spoken_card(source, start, end, duration, out):
    length = end - start
    # All cuts sit inside pauses, with tiny fades to avoid edit clicks.
    return (f'[{source}]atrim=start={start}:end={end},asetpts=PTS-STARTPTS,'
            f'afade=t=in:d=0.006,afade=t=out:st={length-.006}:d=0.006,'
            f'apad,atrim=duration={duration}[{out}]')

parts = [
    '[0:v]fps=30,crop=trunc(iw*.92/2)*2:trunc(ih*.92/2)*2,scale=1920:1080:flags=lanczos,'
    'format=yuv420p,cas=strength=0.28:planes=1,setsar=1,split=4[v0s][v1s][v2s][v3s]',
    '[0:a]aresample=48000,aformat=channel_layouts=stereo,asplit=5[a0s][a1s][a2s][a3s][tails]',
    '[5:a]loudnorm=I=-16:TP=-2:LRA=7,aresample=48000,aformat=channel_layouts=stereo,'
    'asplit=3[voice_a][voice_w][voice_d]',
]
for i, (start, end) in enumerate(zip(CUTS, CUTS[1:])):
    parts.append(f'[v{i}s]trim=start_frame={start}:end_frame={end},setpts=PTS-STARTPTS[v{i}]')
    parts.append(sound(f'a{i}s', start/FPS, (end-start)/FPS, f'a{i}', i < 3))
parts += [
    '[2:v]setsar=1,format=yuv420p[ca]',
    '[3:v]setsar=1,format=yuv420p[cw]',
    '[4:v]setsar=1,format=yuv420p[cd]',
    spoken_card('voice_a', .13, .57, CARD_FRAMES[0]/FPS, 'sa'),
    spoken_card('voice_w', .95, 1.85, CARD_FRAMES[1]/FPS, 'sw'),
    spoken_card('voice_d', 2.22, 3.06, CARD_FRAMES[2]/FPS, 'sd'),
    '[v0][a0][ca][sa][v1][a1][cw][sw][v2][a2][cd][sd][v3][a3]'
    'concat=n=7:v=1:a=1[main_v][main_a]',
    '[1:v]fps=30,setsar=1,format=yuv420p,settb=1/30[end]',
    '[main_v]fps=30,settb=1/30[main_sync]',
    f'[main_sync][end]xfade=transition=fade:duration={CROSSFADE}:offset={FADE_START},format=yuv420p[outv]',
    f'[tails]atrim=start=18.1:duration={OUTRO_DURATION},asetpts=PTS-STARTPTS,'
    'volume=0.28,afade=t=out:st=2.7:d=2.5[tail]',
    f'[main_a][tail]acrossfade=d={CROSSFADE}:c1=tri:c2=tri[bed]',
    # The final voice begins after black. Duck only the remaining engine bed.
    f"[bed]volume='if(lt(t,{VOICE_START-.2}),1,if(lt(t,{VOICE_START}),"
    f"1-.65*(t-{VOICE_START-.2})/.2,.35))':eval=frame[ducked]",
    '[6:a]atrim=start=0.08:end=3.94,asetpts=PTS-STARTPTS,loudnorm=I=-16:TP=-2:LRA=7,'
    'aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.006,'
    f'afade=t=out:st=3.83:d=0.03,adelay={round(VOICE_START*1000)}:all=1[final_voice]',
    '[ducked][final_voice]amix=inputs=2:normalize=0:duration=first,'
    'alimiter=limit=0.95:level=false:latency=true[outa]',
]
graph = ';'.join(parts)
(work/'filter-v10.txt').write_text(graph, encoding='utf-8')
inputs = ['-i', args.input]
for frames in ['.qa/outro-v10/frame-%03d.png', '.qa/user-montage/card-v10-a/frame-%03d.png',
               '.qa/user-montage/card-v10-want/frame-%03d.png', '.qa/user-montage/card-v10-drive/frame-%03d.png']:
    inputs += ['-framerate', '30', '-i', frames]
inputs += ['-i', args.cards_voice, '-i', args.outro_voice]
subprocess.run([
    args.ffmpeg, '-y', '-hide_banner', '-loglevel', 'warning', *inputs,
    '-filter_complex', graph, '-map', '[outv]', '-map', '[outa]', '-t', str(DURATION),
    '-c:v', 'libx264', '-preset', 'fast', '-tune', 'fastdecode', '-crf', '18',
    '-g', '30', '-keyint_min', '30', '-sc_threshold', '0', '-bf', '0', '-refs', '1',
    '-maxrate', '5000k', '-bufsize', '10000k', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', args.output,
], check=True)
print(f'User-voiced montage rendered: {args.output} ({DURATION:0.3f}s)')
