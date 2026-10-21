"""Soundtrack for the Eid Mubarak short.

Afghan/Persian colour: a plucked rubab-style melody in a Bayati-like mode on D (with a quarter-flat E),
a frame drum (daf) in a lilting 6/8, and a low drone. 6/8 with the dotted quarter at 80 BPM:
one eighth = 0.25 s, one bar = 1.5 s, 20 bars = 30 s.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from afaic_synth import *

SEC = 30.0
dry, wet = Bus(SEC + 1), Bus(SEC + 1)
EI = 0.25
BAR = 6 * EI
# scale degrees (MIDI, fractional = microtonal): D  E-half-flat  F  G  A  Bb  C  D
N = {'D': 62, 'Eq': 63.5, 'F': 65, 'G': 67, 'A': 69, 'Bb': 70, 'C': 72, 'D5': 74, 'Eq5': 75.5, 'F5': 77}

def note(name, t, eighths, vel=0.8, oct=0):
    m = N[name] + 12 * oct
    f = mtof(m)
    dur = eighths * EI
    if eighths >= 4:      # santur-style tremolo on long notes
        k, n = 0, int(dur / 0.0625)
        while k < n:
            g = vel * (0.95 if k == 0 else 0.42 + 0.1 * np.sin(k))
            s = ks_pluck(f, 0.9, 0.55, 0.994); dry.add(s, t + k * 0.0625, g * 0.8, pan=0.15); wet.add(s, t + k * 0.0625, g * 0.35)
            k += 1
    else:
        s = ks_pluck(f, 1.6, 0.6, 0.996); dry.add(s, t, vel, pan=0.15); wet.add(s, t, vel * 0.45)

def phrase(bar0, seq, vel=0.8, oct=0):
    t = bar0 * BAR
    for name, e in seq:
        if name: note(name, t, e, vel, oct)
        t += e * EI

A = [('D', 3), ('Eq', 1), ('F', 2), ('G', 3), ('F', 1), ('Eq', 2), ('D', 2), ('Eq', 1), ('F', 1), ('G', 1), ('A', 1), ('A', 6)]
B_ = [('A', 2), ('Bb', 1), ('A', 1), ('G', 2), ('F', 3), ('G', 1), ('F', 1), ('Eq', 1), ('D', 2), ('F', 2), ('Eq', 2), ('D', 6)]
C = [('D5', 3), ('C', 1), ('Bb', 2), ('A', 3), ('Bb', 1), ('A', 1), ('G', 1), ('F', 2), ('G', 2), ('A', 2), ('A', 6)]
END = [('A', 2), ('G', 1), ('F', 1), ('Eq', 2), ('D', 12)]

# drone throughout (D + A), low and warm
dr = drone([38, 45, 50], SEC + 0.5, 0.045); dry.add(dr, 0, 1.0); wet.add(dr, 0, 0.6)
# shimmer while the pattern draws, sparkle on the calligraphy and the sign-off
for t in (0.6, 1.4, 2.2, 3.0): dry.add(sparkle(91 + int(t * 2)), t, 0.35); wet.add(sparkle(91 + int(t * 2)), t, 0.6)
for t, m in ((5.2, 98), (7.4, 93), (20.4, 98), (25.2, 93), (25.5, 98)): dry.add(sparkle(m), t, 0.45); wet.add(sparkle(m), t, 0.7)

# intro: sparse open notes (bars 2-3)
note('D', 3.0, 3, 0.6, -1); note('A', 3.75, 3, 0.55, -1); note('D', 4.5, 6, 0.6)
# phrases
phrase(4, A, 0.85)          # 6.0 - 12.0
phrase(8, B_, 0.85)         # 12.0 - 18.0
phrase(12, C, 0.8)          # 18.0 - 24.0
phrase(16, A[:6], 0.75)     # 24.0 - 27.0
phrase(18, END[:4], 0.7)    # 27.0 - 28.5
note('D', 28.5, 6, 0.65)

# daf in 6/8 from bar 5 (7.5 s) to bar 18, lighter in the message section
for bar in range(5, 19):
    t0 = bar * BAR
    g = 0.75 if bar < 8 or bar >= 12 else 0.55
    dry.add(daf('dum'), t0, g); wet.add(daf('dum'), t0, 0.15)
    dry.add(daf('tak'), t0 + 2 * EI, g * 0.6, pan=0.2)
    dry.add(daf('dum'), t0 + 3 * EI, g * 0.8)
    dry.add(daf('tak'), t0 + 4 * EI, g * 0.55, pan=-0.2)
    if bar % 2: dry.add(daf('tak'), t0 + 5 * EI, g * 0.35, pan=0.2)
# low plucked bass on downbeats
for bar in range(4, 19):
    m = 50 if bar % 4 in (0, 1) else (57 if bar % 4 == 2 else 53)
    s = ks_pluck(mtof(m - 12), 1.4, 0.3, 0.997); dry.add(s, bar * BAR, 0.5, pan=-0.2); wet.add(s, bar * BAR, 0.2)
# soft pad swell under the message and the blessing
p = pad([50, 57, 62, 65], 7.0, bright=0.2, attack=2.0, release=2.0, gain=0.03); dry.add(p, 12.0); wet.add(p, 12.0, 0.8)
p = pad([50, 57, 62, 69], 9.0, bright=0.3, attack=2.0, release=2.5, gain=0.03); dry.add(p, 20.0); wet.add(p, 20.0, 0.8)

master(dry, wet, SEC, wet_gain=0.4, fade_in=1.0, fade_out=1.6, drive=1.15, out=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav'))
