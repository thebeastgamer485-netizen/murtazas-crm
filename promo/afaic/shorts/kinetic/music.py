"""Soundtrack for the kinetic-typography short: 120 BPM, A major (F#m-D-A-E), hits locked to the word slams."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from afaic_synth import *

SEC = 30.0
dry, wet = Bus(SEC + 1), Bus(SEC + 1)
duck = np.ones(dry.n)
B = 0.5  # beat
CH = {'F#m': ([66, 69, 73], 42), 'D': ([66, 69, 74], 38), 'A': ([64, 69, 73], 45), 'E': ([64, 68, 71], 40)}

def kik(t, g=0.9, side=True):
    dry.add(kick(), t, g)
    if side:
        i, n = int(t * SR), int(0.3 * SR)
        if i + n < len(duck): duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.45 * np.exp(-np.arange(n) / SR / 0.1))

def stab(ch, t, dur=0.22, cut=4200, g=1.0):
    s = supersaw([mtof(m) for m in CH[ch][0]], dur, cutoff=cut)
    dry.add(s, t, 1.2 * g); wet.add(s, t, 0.5 * g)

def hit(t, big=False):
    dry.add(boom(), t, 0.8 if big else 0.5); kik(t, 1.0)
    if big: dry.add(crash(), t, 1.0); wet.add(crash(), t, 0.5)

# --- 0-1: riser into the first slam
dry.add(riser(1.0, 400, 7000, 0.10), 0.0)
# --- 1-6: NEW + rolling words
hit(1.0, True); stab('F#m', 1.0, 0.4)
for t, ch in ((1.5, 'F#m'), (2.5, 'D'), (3.5, 'A')):
    kik(t, 0.8); dry.add(sub808(CH[ch][1], 0.8), t, 0.7); stab(ch, t)
hit(4.5, True); dry.add(clap(), 4.5, 0.8); stab('E', 4.5, 0.5, 6000, 1.3); dry.add(sub808(40, 1.0), 4.5, 0.7)
arp_seq = {1: 'F#m', 2: 'F#m', 3: 'D', 4: 'A', 5: 'E'}
for k in range(int((6.0 - 1.0) / 0.125)):
    t = 1.0 + k * 0.125
    ch = arp_seq[int(t)]
    m = CH[ch][0][k % 3] + 12 * ((k // 3) % 2)
    s = pluck_saw(m, 0.1, 2200 + 1500 * (t - 1) / 5, 0.07); dry.add(s, t, 0.35, pan=-0.4 if k % 2 else 0.4); wet.add(s, t, 0.25)
dry.add(riser(0.5, 1000, 9000, 0.06), 5.5)

# --- 6-11 and 11-17: full groove, chord every second
prog = {6: 'F#m', 7: 'D', 8: 'A', 9: 'E', 10: 'F#m', 11: 'D', 12: 'A', 13: 'E', 14: 'F#m', 15: 'D', 16: 'E'}
for sec, ch in prog.items():
    for b in range(2):
        t = sec + b * B
        kik(t, 0.85)
        dry.add(hat(True), t + 0.25, 0.45, pan=0.3)
        for k in range(4): dry.add(hat(), t + k * 0.125, 0.18 if sec >= 11 else 0.1, pan=-0.3)
        for e in range(2): dry.add(bass(CH[ch][1] + 12 * e, 0.2, 1.6), t + e * 0.25, 0.55)
    dry.add(clap(), sec + B, 0.6); wet.add(clap(), sec + B, 0.3)
    stab(ch, sec, 0.25, 4000 if sec < 11 else 5200, 0.9)
dry.add(boom(), 6.25, 0.6); dry.add(crash(), 6.0, 0.6)
for i in range(6): dry.add(whoosh(0.3, 0.2, 0.09), 11 + i - 0.22)     # card pushes
for i in range(6): dry.add(crash(1.0), 11 + i, 0.35)

# --- 17-19: TOGETHER — drums drop, big chord, riser
hit(17.0, True)
p = pad([57, 61, 64, 69, 71, 76], 1.8, bright=0.8, attack=0.05, release=1.0, gain=0.09); dry.add(p, 17.0, 1.0); wet.add(p, 17.0, 0.8)
dry.add(sub808(45, 1.6), 17.0, 0.6)
dry.add(riser(1.0, 300, 8000, 0.12), 18.0)

# --- 19-24: counter ticks, then a snare build
hit(19.0, True); stab('D', 19.0, 0.4, 5000)
for k in range(14):
    t = 19.0 + k * 0.125
    tick = np.sin(2 * np.pi * (900 + 60 * k) * np.arange(int(0.05 * SR)) / SR) * np.exp(-np.arange(int(0.05 * SR)) / SR / 0.012) * 0.25
    dry.add(tick, t, 0.6)
for sec, ch in ((19, 'D'), (20, 'D'), (21, 'E'), (22, 'E'), (23, 'E')):
    for b in range(2):
        t = sec + b * B
        kik(t, 0.8)
        dry.add(bass(CH[ch][1], 0.45, 1.4), t, 0.5)
        dry.add(hat(), t + 0.25, 0.2)
dry.add(snare(), 20.5, 0.7); dry.add(snare(), 21.5, 0.7); stab('E', 21.5, 0.3)
roll = [22.0 + i * 0.25 for i in range(4)] + [23.0 + i * 0.125 for i in range(8)]
for i, t in enumerate(roll): dry.add(snare(), t, 0.25 + 0.04 * i)
dry.add(riser(2.0, 250, 9000, 0.13), 22.0)

# --- 24-30: final statement
for t, ch in ((24.0, 'F#m'), (24.5, 'D'), (25.0, 'A'), (25.5, 'E')):
    hit(t, t == 24.0); dry.add(clap(), t, 0.5); stab(ch, t, 0.35, 5500, 1.1); dry.add(sub808(CH[ch][1], 0.5), t, 0.6)
for sec, ch in ((26, 'F#m'), (27, 'D'), (28, 'A')):
    for b in range(2):
        t = sec + b * B
        kik(t, 0.75); dry.add(hat(True), t + 0.25, 0.35)
        dry.add(bass(CH[ch][1], 0.45, 1.4), t, 0.45)
    dry.add(clap(), sec + B, 0.45)
    stab(ch, sec, 0.3, 4500, 0.8)
hit(29.0, True)
end = pad([57, 61, 64, 69, 73], 1.0, bright=0.7, attack=0.02, release=1.0, gain=0.08); dry.add(end, 29.0); wet.add(end, 29.0, 1.0)

master(dry, wet, SEC, wet_gain=0.25, duck=duck, fade_out=0.8, out=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav'))
