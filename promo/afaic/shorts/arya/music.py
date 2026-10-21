"""Soundtrack for the ARYA Awards 2027 ad: a cinematic gala cue in D major.
Drone + shimmer for the emblem, a brass-like fanfare on the title, timpani building through the question,
a string ostinato and drums under the categories, and a final fanfare on the call to action."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from afaic_synth import *

SEC = 30.0
dry, wet = Bus(SEC + 1), Bus(SEC + 1)
BT = 60 / 90  # 90 BPM
CH = {'D': [50, 57, 62, 66, 69], 'A': [45, 57, 61, 64, 69], 'Bm': [47, 54, 59, 62, 66], 'G': [43, 55, 59, 62, 67]}

def timpani(m, g=0.7):
    f = mtof(m); n = int(1.4 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.08 * np.exp(-t / 0.05))) / SR) * np.exp(-t / 0.7)
    s += 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5 * (1 + 0.05 * np.exp(-t / 0.05))) / SR) * np.exp(-t / 0.35)
    s += filt(rng.standard_normal(n), 'lowpass', 600) * np.exp(-t / 0.04) * 0.4
    return np.tanh(s * 1.2) * g

def brass(ch, dur, g=1.0):
    ms = CH[ch][1:]
    s = supersaw([mtof(m) for m in ms], dur, cutoff=2300, a=0.18, d=0.6, s=0.8, r=0.9, voices=5, spread=0.008)
    sub = np.sin(2 * np.pi * mtof(CH[ch][0] - 12) * np.arange(s.shape[0]) / SR) * env_adsr(s.shape[0], 0.2, 0.5, 0.8, 0.8, dur) * 0.12
    return (s + sub[:, None]) * g

def strings(ch, dur, bright=0.4, g=1.0):
    return pad(CH[ch][1:], dur, bright=bright, attack=0.6, release=1.2, gain=0.06 * g)

def chime(m, t, g=0.4, pan=0.0):
    s = bell(m, 0.6); dry.add(s, t, g, pan); wet.add(s, t, g * 1.4)

# ---- 0-4.4: drone, shimmer while the emblem assembles
dr = drone([26, 33, 38], 9.0, 0.06); dry.add(dr, 0); wet.add(dr, 0, 0.5)
for k, (t, m) in enumerate([(0.8, 86), (0.92, 90), (1.04, 93), (1.16, 98), (1.7, 86), (1.82, 90), (1.94, 93), (2.06, 98)]):
    chime(m, t, 0.22, pan=-0.5 + 0.15 * k)
dry.add(timpani(38, 0.6), 2.55); chime(98, 2.55, 0.5); chime(93, 2.6, 0.35)
for k in range(8): chime(98 + [0, 2, 4, 7, 9, 12, 14, 16][k], 2.85 + k * 0.06, 0.18, pan=-0.6 + k * 0.17)   # glint
dry.add(riser(1.4, 200, 6000, 0.08), 3.0)

# ---- 4.4-8.6: fanfare on the title
dry.add(boom(2.0), 4.4, 0.8); dry.add(crash(3.0), 4.4, 0.7); wet.add(crash(3.0), 4.4, 0.5); dry.add(timpani(38, 0.9), 4.4)
b = brass('D', 3.6); dry.add(b, 4.4, 1.0); wet.add(b, 4.4, 0.6)
for i, ch in enumerate(['D', 'Bm', 'G', 'A']):
    t0 = 4.4 + i * 1.0
    for k, m in enumerate(CH[ch][1:] + [CH[ch][3] + 12]):
        s = piano(m + 12, 0.5, 0.55); dry.add(s, t0 + k * 0.17, 0.5, pan=-0.3 + 0.15 * k); wet.add(s, t0 + k * 0.17, 0.4)
st = strings('D', 4.0, 0.3); dry.add(st, 4.4); wet.add(st, 4.4, 0.7)
for t, m in ((5.15, 81), (5.7, 86), (6.3, 90)): chime(m, t, 0.3)

# ---- 8.6-13.2: the question; timpani build
seq = ['Bm', 'G', 'D', 'A']
for i, ch in enumerate(seq):
    t0 = 8.6 + i * 1.15
    st = strings(ch, 1.25, 0.35, 1.1); dry.add(st, t0); wet.add(st, t0, 0.7)
    s = piano(CH[ch][3] + 12, 1.0, 0.6); dry.add(s, t0, 0.6); wet.add(s, t0, 0.5)
k = 0
t = 8.6
while t < 13.1:
    dry.add(timpani(38 if k % 2 == 0 else 45, 0.25 + 0.5 * (t - 8.6) / 4.5), t); k += 1; t += BT
dry.add(boom(1.2), 9.15, 0.4); chime(86, 9.2, 0.4)
for t, m in ((10.7, 81), (11.1, 85), (11.5, 88)): chime(m, t, 0.35)
dry.add(riser(1.0, 300, 7000, 0.08), 12.3)

# ---- 13.2-19.8: categories — drums + string ostinato
dry.add(crash(2.0), 13.2, 0.6); dry.add(boom(1.5), 13.2, 0.6)
prog = ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A', 'D', 'A']
t, i = 13.2, 0
while t < 19.8 - 1e-6:
    ch = prog[(i // 2) % len(prog)]
    if i % 2 == 0:
        st = strings(ch, 2 * BT + 0.1, 0.45, 1.2); dry.add(st, t); wet.add(st, t, 0.6)
    dry.add(kick(0.7, 0.35), t, 0.6)
    if i % 2 == 1: dry.add(snare(), t, 0.4); wet.add(snare(), t, 0.5)
    dry.add(timpani(CH[ch][0] - 12 if CH[ch][0] > 45 else CH[ch][0], 0.35), t + BT / 2)
    for e in range(4):   # staccato string ostinato (16ths)
        m = CH[ch][1 + (e % 3)]
        s = pluck_saw(m, 0.08, 2600, 0.06); dry.add(s, t + e * BT / 4, 0.35, pan=-0.3 if e % 2 else 0.3); wet.add(s, t + e * BT / 4, 0.2)
    t += BT; i += 1
for j in range(6): chime([86, 88, 90, 93, 95, 98][j], 13.8 + j * 0.42, 0.35, pan=-0.5 + 0.2 * j)

# ---- 19.8-24.4: lift, then a cymbal swell into the call to action
for i, ch in enumerate(['G', 'A', 'D', 'Bm']):
    t0 = 19.8 + i * 1.15
    st = strings(ch, 1.25, 0.6, 1.2); dry.add(st, t0); wet.add(st, t0, 0.7)
    for k, m in enumerate(CH[ch][1:]):
        s = piano(m + 12, 0.4, 0.5); dry.add(s, t0 + k * 0.14, 0.45, pan=0.3); wet.add(s, t0 + k * 0.14, 0.4)
    dry.add(kick(0.7, 0.35), t0, 0.5); dry.add(timpani(45, 0.4), t0 + 0.575)
for t, m in ((21.4, 90), (21.7, 93)): chime(m, t, 0.3)
sw = riser(2.2, 1500, 12000, 0.1); dry.add(sw, 22.2)

# ---- 24.4-30: final fanfare, then a calm resolution
dry.add(boom(2.0), 24.4, 0.9); dry.add(crash(3.5), 24.4, 0.8); wet.add(crash(3.5), 24.4, 0.6); dry.add(timpani(38, 1.0), 24.4)
b = brass('D', 2.4, 1.1); dry.add(b, 24.4); wet.add(b, 24.4, 0.6)
b = brass('G', 1.2, 0.9); dry.add(b, 26.9); wet.add(b, 26.9, 0.6)
b = brass('D', 2.2, 0.9); dry.add(b, 28.0); wet.add(b, 28.0, 0.7)
for k, m in enumerate([74, 78, 81, 86, 81, 78, 74, 69]):
    s = piano(m, 0.6, 0.5); dry.add(s, 25.3 + k * 0.33, 0.5, pan=-0.3 + 0.08 * k); wet.add(s, 25.3 + k * 0.33, 0.5)
for k in range(8): chime(98 + [0, 2, 4, 7, 9, 12, 14, 16][k], 27.6 + k * 0.06, 0.16, pan=-0.6 + k * 0.17)
dr = drone([26, 33, 38], 6.5, 0.05); dry.add(dr, 24.0); wet.add(dr, 24.0, 0.5)

master(dry, wet, SEC, wet_gain=0.38, fade_in=0.6, fade_out=1.4, drive=1.15, out=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav'))
