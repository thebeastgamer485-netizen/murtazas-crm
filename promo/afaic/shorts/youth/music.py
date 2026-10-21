"""Soundtrack for the Youth Leadership Camp short: bouncy 120 BPM house-pop in C major (C-G-Am-F),
with thuds on every card landing and stabs on every sticker slam."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from afaic_synth import *

SEC = 30.0
dry, wet = Bus(SEC + 1), Bus(SEC + 1)
duck = np.ones(dry.n)
B = 0.5
CH = [([60, 64, 67], 36), ([59, 62, 67], 43), ([60, 64, 69], 45), ([60, 65, 69], 41)]   # C G Am F (bass in octave 2)

def kik(t, g=0.85):
    dry.add(kick(1.1, 0.25), t, g)
    i, n = int(t * SR), int(0.28 * SR)
    if i + n < len(duck): duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.5 * np.exp(-np.arange(n) / SR / 0.09))

def stab(ci, t, dur=0.16, cut=5000, g=1.0, oct=0):
    s = supersaw([mtof(m + 12 * oct) for m in CH[ci][0]], dur, cutoff=cut, d=0.08, s=0.15)
    dry.add(s, t, 1.1 * g); wet.add(s, t, 0.4 * g)

def thud(t, g=0.7):          # card landing
    dry.add(kick(0.6, 0.12), t, g * 0.9)
    n = int(0.12 * SR); tt = np.arange(n) / SR
    pop = np.sin(2 * np.pi * np.cumsum(900 * np.exp(-tt / 0.03) + 200) / SR) * np.exp(-tt / 0.03) * 0.3
    dry.add(pop, t, g)

def slam_fx(t, ci, g=1.0):
    dry.add(boom(1.0), t, 0.5 * g); dry.add(crash(1.5), t, 0.7 * g); stab(ci, t, 0.3, 6500, 1.2 * g)

def tick(t, f):
    n = int(0.04 * SR); tt = np.arange(n) / SR
    dry.add(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.01) * 0.25, t, 0.7)

# ---- intro (0-3.5): hits on HEY / YOU / sticker, riser into the drop
for t, ci in ((0.5, 0), (1.0, 1)):
    kik(t, 0.9); stab(ci, t, 0.25, 5500)
slam_fx(1.75, 2, 0.8)
thud(2.5 + 0.55)
dry.add(riser(1.1, 400, 8000, 0.1), 2.4)

# ---- groove 3.5-20 and 20.25-29
def groove(a, b):
    t = a
    while t < b - 1e-6:
        beat = round((t - 3.5) / B)
        ci = (beat // 4) % 4
        kik(t)
        if beat % 2 == 1: dry.add(clap(0.1), t, 0.55); wet.add(clap(), t, 0.25)
        dry.add(hat(True), t + 0.25, 0.3, pan=0.25)
        for k in range(4): dry.add(hat(), t + k * 0.125, 0.12 + (0.06 if k % 2 else 0), pan=-0.25)
        # octave-bouncing bass on the off-beats
        dry.add(bass(CH[ci][1], 0.18, 1.8), t, 0.5); dry.add(bass(CH[ci][1] + 12, 0.18, 1.8), t + 0.25, 0.45)
        # house stab on the "and"
        stab(ci, t + 0.25, 0.12, 3800, 0.7)
        t += B
groove(3.5, 20.0)

# melody on top from the stats onwards
def melody(a, b):
    motif = [(0, 72, .4), (.5, 76, .4), (1, 79, .8), (2, 76, .4), (2.5, 74, .4), (3, 72, .8), (4, 74, .4), (4.5, 76, .4), (5, 79, .4), (5.5, 81, .4), (6, 79, 1.2)]
    t = a
    while t < b - 1e-6:
        for st, m, d in motif:
            tt = t + st * B
            if tt >= b: break
            s = pluck_saw(m, d, 5600, 0.18); dry.add(s, tt, 0.5, pan=0.3); wet.add(s, tt, 0.5)
        t += 8 * B
melody(8.5, 20.0)

# scene pushes
for t in (3.5, 8.5, 13.5, 20.0, 25.0): dry.add(whoosh(0.5, 0.35, 0.12), t - 0.35)
dry.add(crash(2.0), 3.5, 0.8); kik(3.5, 1.0); dry.add(boom(), 3.5, 0.5)
# landings, slides and counters
for t in (5.5, 9.0, 9.5, 10.0, 14.0, 21.25, 25.75, 26.25): thud(t + 0.55)
for i in range(4): dry.add(whoosh(0.35, 0.25, 0.06), 14.5 + i * 0.75 - 0.15); thud(14.5 + i * 0.75 + 0.4, 0.4)
for k in range(10): tick(9.4 + k * 0.12, 1200 + 60 * k)
for k in range(12): tick(20.25 + k * 0.11, 1000 + 50 * k)
dry.add(riser(1.0, 300, 7000, 0.1), 19.0)

# ---- 20.25: "90+" — a beat of silence then the hit, groove back with more energy
slam_fx(20.25, 0, 1.2); kik(20.25, 1.0)
groove(20.5, 29.0)
melody(21.0, 28.5)
slam_fx(22.5, 2, 0.9)
slam_fx(25.0, 3, 0.8)
slam_fx(27.0, 0, 1.0)
for k in range(8): dry.add(snare(), 28.0 + k * 0.125, 0.15 + 0.05 * k)
# ending
slam_fx(29.0, 0, 1.3); kik(29.0, 1.0)
end = pad([60, 64, 67, 72], 0.8, bright=0.8, attack=0.01, release=0.8, gain=0.08); dry.add(end, 29.0); wet.add(end, 29.0)

master(dry, wet, SEC, wet_gain=0.22, duck=duck, fade_out=0.7, out=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav'))
