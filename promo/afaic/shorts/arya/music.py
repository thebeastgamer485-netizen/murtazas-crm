"""Soundtrack for the ARYA Awards 2027 ad (v2): driving 120 BPM orchestral-pop in D major.
Every impact, whoosh and bell is placed on the picture: logo build (trace, lock, bloom, orbit, ignite), zoom-through, title slam,
whip pans, the word slams, each carousel turn, the photo cuts and the final fanfare."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from afaic_synth import *

SEC = 30.0
dry, wet = Bus(SEC + 1), Bus(SEC + 1)
duck = np.ones(dry.n)
B = 0.5
CH = {'D': ([62, 66, 69], 38), 'Bm': ([62, 66, 71], 35), 'G': ([62, 67, 71], 43), 'A': ([61, 64, 69], 45)}
PROG = {4: 'D', 6: 'Bm', 8: 'G', 10: 'A', 12: 'D', 14: 'A', 16: 'Bm', 18: 'G', 20: 'G', 22: 'A', 24: 'D', 26: 'Bm', 28: 'D'}
chord_at = lambda t: PROG[max(k for k in PROG if k <= t)] if t >= 4 else 'D'

def kik(t, g=0.85):
    dry.add(kick(0.9, 0.3), t, g)
    i, n = int(t * SR), int(0.3 * SR)
    if i + n < len(duck): duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.4 * np.exp(-np.arange(n) / SR / 0.1))

def timpani(m, g=0.7):
    f = mtof(m); n = int(1.4 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.08 * np.exp(-t / 0.05))) / SR) * np.exp(-t / 0.6)
    s += 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5 * (1 + 0.05 * np.exp(-t / 0.05))) / SR) * np.exp(-t / 0.3)
    s += filt(rng.standard_normal(n), 'lowpass', 600) * np.exp(-t / 0.04) * 0.4
    return np.tanh(s * 1.2) * g

def brass(ch, t, dur, g=1.0, cut=2600):
    ms = CH[ch][0] + [CH[ch][0][0] - 12]
    s = supersaw([mtof(m) for m in ms], dur, cutoff=cut, a=0.05, d=0.4, s=0.75, r=0.5, voices=5, spread=0.008)
    dry.add(s, t, 1.3 * g); wet.add(s, t, 0.5 * g)

def lead(m, t, dur, g=1.0):
    n = int((dur + 0.4) * SR); tt = np.arange(n) / SR
    f = mtof(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * tt) * np.minimum(1, tt / 0.3))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(h * ph) / h * np.exp(-h / 4.5) for h in range(1, 14))
    s = filt(s, 'lowpass', 3400) * env_adsr(n, 0.035, 0.3, 0.8, 0.15, dur) * 0.16
    dry.add(s, t, g, pan=0.1); wet.add(s, t, g * 0.6)

def chime(m, t, g=0.35, pan=0.0):
    s = bell(m, 0.6); dry.add(s, t, g, pan); wet.add(s, t, g * 1.3)

def impact(t, ch='D', big=True):
    dry.add(boom(1.8), t, 0.9 if big else 0.6); dry.add(crash(3.0), t, 0.8 if big else 0.5); wet.add(crash(3.0), t, 0.4)
    dry.add(timpani(38, 0.9), t); kik(t, 1.0); brass(ch, t, 0.9 if big else 0.4, 1.0)
    dry.add(sub808(CH[ch][1], 1.2), t, 0.6)

def gliss(t, up=True, g=0.18):
    notes = [86, 88, 90, 93, 95, 98, 100, 102]
    for k, m in enumerate(notes if up else notes[::-1]): chime(m, t + k * 0.05, g, pan=-0.6 + k * 0.17)

# ---------------------------------------------------------------- 0-4: intro
dr = drone([26, 33, 38], 4.6, 0.06); dry.add(dr, 0); wet.add(dr, 0, 0.5)
gliss(0.4, True, 0.14)
for k in range(8):   # quiet ticking anticipation
    s = pluck_saw(74 if k % 2 == 0 else 81, 0.06, 3000, 0.05); dry.add(s, k * 0.25, 0.25 + 0.03 * k, pan=0.3 if k % 2 else -0.3)
# logo build (see logo-anim.js): trace -> lock -> bloom -> orbit -> ignite -> glint
for k, m in enumerate([74, 78, 81, 86, 88, 90]): chime(m + 12, 0.3 + k * 0.2, 0.16, pan=-0.5 + 0.2 * k)        # lines trace
air = riser(1.3, 600, 5000, 0.05); dry.add(air, 0.2)
dry.add(timpani(38, 0.7), 1.75); dry.add(boom(1.0), 1.75, 0.45); brass('D', 1.75, 0.5, 0.55, 1800); chime(86, 1.75, 0.35)   # petals lock
for k, m in enumerate([86, 88, 90, 93, 95, 98, 100, 102, 98, 100, 102, 105]): chime(m, 1.85 + k * 0.055, 0.11, pan=-0.7 + 0.12 * k)   # rosette bloom
dry.add(whoosh(0.6, 0.55, 0.12), 2.3)                                                                        # tips orbit
for k in range(5): dry.add(timpani(38, 0.15 + 0.07 * k), 2.3 + k * 0.11)
kik(2.85, 0.9); dry.add(timpani(45, 0.85), 2.85); dry.add(boom(1.4), 2.85, 0.6); dry.add(sub808(38, 1.2), 2.85, 0.5)   # ignite
for m in (86, 90, 93, 98): chime(m, 2.85, 0.3)
dry.add(crash(2.0), 2.85, 0.3); wet.add(crash(2.0), 2.85, 0.3)
gliss(3.15, True, 0.16)                                                                                      # glint
for k in range(8): dry.add(snare(), 3.0 + k * 0.125, 0.1 + 0.05 * k)
dry.add(riser(1.0, 300, 9000, 0.12), 3.0); dry.add(whoosh(0.4, 0.33, 0.12), 3.6)

# ---------------------------------------------------------------- 4-8: title
impact(4.0, 'D')
for k in range(14): chime(int(86 + rng.integers(0, 16)), 4.0 + rng.random() * 1.2, 0.12, pan=rng.uniform(-0.8, 0.8))   # confetti sparkle
brass('D', 4.5, 1.2, 0.7); chime(86, 5.0, 0.35); chime(90, 5.5, 0.25); chime(93, 6.0, 0.3)

def groove(a, b, claps=True, hats=True, ost=True, kick_every=1, bass_g=0.62):
    t = a
    while t < b - 1e-6:
        beat = round(t / B)
        ch = chord_at(t)
        if beat % kick_every == 0: kik(t, 0.8)
        if claps and beat % 2 == 1: dry.add(clap(0.12), t, 0.5); wet.add(clap(), t, 0.3)
        if hats:
            for k in range(4): dry.add(hat(), t + k * 0.125, 0.1 + (0.05 if k % 2 else 0), pan=-0.3)
            dry.add(hat(True), t + 0.25, 0.22, pan=0.3)
        for e in range(2): dry.add(bass(CH[ch][1] + 12 * e, 0.2, 1.5), t + e * 0.25, bass_g)
        if ost:
            for e in range(4):
                m = CH[ch][0][(e + beat) % 3] + (12 if e == 3 else 0)
                s = pluck_saw(m, 0.08, 3200, 0.06); dry.add(s, t + e * 0.125, 0.44, pan=-0.35 if e % 2 else 0.35); wet.add(s, t + e * 0.125, 0.18)
        t += B
    for bar in range(int(a), int(b), 2):
        st = pad(CH[chord_at(bar)][0], 2.0, bright=0.55, attack=0.3, release=0.6, gain=0.065); dry.add(st, bar); wet.add(st, bar, 0.6)

groove(4.0, 7.75)
dry.add(whoosh(0.5, 0.42, 0.14), 7.55); dry.add(crash(1.0), 7.5, 0.25)   # whip

# ---------------------------------------------------------------- 8-12: hook
impact(8.0, 'G', big=False)
groove(8.0, 9.75, claps=False, hats=False, ost=True, kick_every=2, bass_g=0.4)
dry.add(timpani(43, 0.8), 8.5); brass('G', 8.5, 0.5, 0.9); chime(91, 8.5, 0.4)
for k in range(4): dry.add(timpani(43 if k % 2 else 38, 0.35 + 0.1 * k), 9.0 + k * 0.25)
for t, ch in ((10.0, 'A'), (10.5, 'A'), (11.0, 'A')):
    kik(t, 1.0); dry.add(timpani(45, 0.8), t); dry.add(clap(), t, 0.6); brass(ch, t, 0.32, 1.0, 3400); dry.add(crash(1.0), t, 0.35)
for k in range(8): dry.add(snare(), 11.0 + k * 0.125, 0.12 + 0.05 * k)
dry.add(riser(1.0, 400, 9000, 0.12), 11.0)

# ---------------------------------------------------------------- 12-20: carousel
impact(12.0, 'D')
groove(12.0, 19.5)
for k in range(1, 6): dry.add(whoosh(0.5, 0.4, 0.1), 12.5 + k - 0.48)
for k in range(6): chime([86, 88, 90, 93, 95, 98][k], 12.5 + k, 0.4, pan=-0.5 + 0.2 * k)
dry.add(riser(1.5, 300, 10000, 0.13), 18.4); dry.add(whoosh(1.4, 1.1, 0.12), 18.4)
for k in range(12): dry.add(snare(), 18.5 + k * 0.125, 0.1 + 0.04 * k)
dry.add(whoosh(0.5, 0.42, 0.14), 19.5)

# ---------------------------------------------------------------- 20-24: recognition (lift)
impact(19.95, 'G', big=False)
t = 20.0
while t < 23.9:
    ch = chord_at(t)
    if round(t / B) % 2 == 0: kik(t, 0.6)
    for k, m in enumerate(CH[ch][0] + [CH[ch][0][0] + 12]):
        s = piano(m + 12, 0.3, 0.55); dry.add(s, t + k * 0.125, 0.45, pan=-0.3 + 0.2 * k); wet.add(s, t + k * 0.125, 0.4)
    t += B
for bar in (20, 22):
    st = pad(CH[chord_at(bar)][0] + [CH[chord_at(bar)][0][1] + 12], 2.0, bright=0.7, attack=0.4, release=0.6, gain=0.06); dry.add(st, bar); wet.add(st, bar, 0.8)
    dry.add(bass(CH[chord_at(bar)][1], 1.9, 1.2), bar, 0.5)
dry.add(boom(1.0), 22.0, 0.5); brass('A', 22.0, 0.4, 0.7); dry.add(whoosh(0.3, 0.2, 0.1), 21.8)
for k in range(10): chime(93 + k % 4, 22.5 + k * 0.1, 0.12)
for k in range(10): chime(95 + k % 4, 23.0 + k * 0.09, 0.12)
for k in range(8): dry.add(snare(), 23.0 + k * 0.125, 0.12 + 0.05 * k)
dry.add(riser(1.0, 400, 10000, 0.14), 23.0)

# ---------------------------------------------------------------- 24-30: call to action + fanfare
impact(24.0, 'D')
for k in range(18): chime(int(86 + rng.integers(0, 16)), 24.0 + rng.random() * 1.5, 0.12, pan=rng.uniform(-0.9, 0.9))
groove(24.0, 28.0)
for k, m in enumerate([90, 93, 95, 98, 100, 102]): chime(m, 24.3 + k * 0.035, 0.1, pan=-0.5 + 0.2 * k)   # quick logo rebuild
for m in (86, 90, 93): chime(m, 24.8, 0.25)
dry.add(timpani(45, 0.5), 24.8)
FAN = [(24.5, 69, .25), (24.75, 74, .25), (25.0, 78, .7), (25.75, 76, .25), (26.0, 74, .45), (26.5, 71, .45), (27.0, 69, .25), (27.25, 74, .25), (27.5, 78, .25), (27.75, 81, .25)]
for t, m, d in FAN: lead(m, t, d, 1.0)
gliss(27.6, True, 0.16)
impact(28.0, 'D')
lead(86, 28.0, 1.4, 0.9)
end = pad([62, 66, 69, 74, 78], 1.6, bright=0.8, attack=0.02, release=1.2, gain=0.07); dry.add(end, 28.0); wet.add(end, 28.0, 1.0)

master(dry, wet, SEC, wet_gain=0.3, duck=duck, fade_out=1.3, drive=1.2, out=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav'))
