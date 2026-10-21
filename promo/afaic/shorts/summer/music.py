"""Soundtrack for the Summer Camp 2026 ad. The green logo sting (played 1.4x, cue-for-cue with the reveal) builds
through a snare roll into a bright 128 BPM summer-house drop in D major, with steel-pan hook, 16th arps in the
tunnel, slot-machine ticks on the stats and hits locked to every 3D move. Times match summer/index.html."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from afaic_synth import *

SEC = 30.0
dry, wet, mus = Bus(SEC + 1), Bus(SEC + 1), Bus(SEC + 1)     # mus: everything that ducks under the kick
duck = np.ones(dry.n)
BEAT = 60 / 128; BAR = 4 * BEAT
D = 4.2                                                       # the drop (logo portal opens)
T_TUN, T_STAT = D + 10 * BEAT, D + 26 * BEAT                  # 8.89, 16.39
T_LCG, T_CTA, T_END = D + 36 * BEAT, D + 44 * BEAT, D + 52 * BEAT   # 21.08, 24.83, 28.58
S = 1 / 1.4                                                   # the logo reveal runs 1.4x faster than the 6 s sting

CH = {'D': ([62, 66, 69], 38), 'A': ([61, 64, 69], 33), 'Bm': ([62, 66, 71], 35), 'G': ([62, 67, 71], 31)}
PROG = {}                                                     # half-bar index (from D) -> chord
for b, c in enumerate('D A Bm G D A Bm G D'.split()): PROG[2 * b] = PROG[2 * b + 1] = c
PROG.update({18: 'Bm', 19: 'G', 20: 'A', 21: 'A',             # LEAD. / CONNECT. / GROW. + build on the dominant
             22: 'D', 23: 'D', 24: 'G', 25: 'A', 26: 'D', 27: 'D'})   # CTA, card, final
def chord_at(t): return CH[PROG.get(int(np.floor((t - D) / (2 * BEAT) + 1e-6)), 'D')]


# ------------------------------------------------------------------ instruments
def kik(t, g=0.9):
    dry.add(kick(1.15, 0.26), t, g)
    i, n = int(t * SR), int(0.3 * SR)
    if 0 <= i and i + n < len(duck): duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.55 * np.exp(-np.arange(n) / SR / 0.1))

def stab(t, ch, dur=0.12, cut=4000, g=1.0, oct=0):
    s = supersaw([mtof(m + 12 * oct) for m in ch[0]], dur, cutoff=cut, d=0.07, s=0.18)
    mus.add(s, t, g); wet.add(s, t, 0.35 * g)

def steel(m, t, g=0.5, pan=0.15, dur=0.9):                    # steel-pan lead
    f = mtof(m); n = int(dur * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.45) + 0.55 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt / 0.25)
         + 0.3 * np.sin(2 * np.pi * 3.01 * f * tt) * np.exp(-tt / 0.12) + 0.12 * np.sin(2 * np.pi * 4.2 * f * tt) * np.exp(-tt / 0.05))
    s *= np.minimum(1, tt / 0.003) * 0.28
    mus.add(s, t, g, pan); wet.add(s, t, g * 0.6)

def chime(m, t, g=0.3, pan=0.0):
    s = bell(m, 0.55, 2.5); mus.add(s, t, g, pan); wet.add(s, t, g * 1.4)

def marimba(m, t, g=0.5, pan=0.0):
    f = mtof(m); n = int(1.2 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.35) + 0.25 * np.sin(2 * np.pi * f * 3.93 * tt) * np.exp(-tt / 0.07)
         + 0.1 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt / 0.02)) * np.minimum(1, tt / 0.002)
    mus.add(s * 0.3, t, g, pan); wet.add(s * 0.3, t, g * 0.6)

def pop(t, f0=400, f1=1500, g=0.35, pan=0.0):                 # bubbly pop for things appearing
    n = int(0.09 * SR); tt = np.arange(n) / SR
    fr = f0 + (f1 - f0) * (1 - np.exp(-tt / 0.015))
    s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt / 0.028) * np.minimum(1, tt / 0.001) * 0.5
    mus.add(s, t, g, pan); wet.add(s, t, g * 0.3)

def tick(t, f=1800, g=0.25):                                  # slot-machine tick
    n = int(0.03 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006) * 0.4 + filt(rng.standard_normal(n), 'highpass', 3000) * np.exp(-tt / 0.003) * 0.2
    dry.add(s, t, g)

def thud(t, g=0.5):
    dry.add(kick(0.6, 0.12), t, g * 0.8); pop(t, 900, 300, g * 0.6)

def hit(t, ch, g=1.0, long=0.45):                             # section impact
    kik(t, 1.0); dry.add(boom(1.3), t, 0.5 * g); dry.add(crash(2.2), t, 0.75 * g)
    stab(t, ch, long, 6500, 1.25 * g); stab(t, ch, long, 7000, 0.55 * g, oct=1)
    dry.add(sub808(ch[1], 0.9), t, 0.5 * g)
    dry.add(clap(0.2), t, 0.5 * g); wet.add(clap(0.3), t, 0.4 * g)

def roll(a, b, step, g0, g1):                                 # snare roll from a to b
    n = int(round((b - a) / step))
    for k in range(n): dry.add(snare(), a + k * step, g0 + (g1 - g0) * k / max(1, n - 1))

def rev_crash(t_end, dur=1.0, g=0.7):
    c = crash(dur)[::-1]; dry.add(c, t_end - dur, g)


# ------------------------------------------------------------------ groove + hook
MEL = [(0, 78), (0.5, 81), (1, 83), (1.5, 81), (2, 78), (2.75, 76), (3, 78), (3.5, 81),        # D
       (4, 85), (4.5, 81), (5, 76), (5.5, 81), (6, 85), (6.5, 88), (7, 85), (7.5, 81),        # A
       (8, 83), (8.5, 78), (9, 74), (9.5, 78), (10, 83), (10.75, 81), (11, 78), (11.5, 76),   # Bm
       (12, 79), (12.5, 83), (13, 86), (13.5, 83), (14, 81), (14.5, 79), (15, 78), (15.5, 76)]  # G

def melody(a, b, g=0.5):
    for k in range(4):
        for pos, m in MEL:
            t = D + (k * 16 + pos) * BEAT
            if a - 1e-6 <= t < b - 1e-6: steel(m, t, g)

def groove(a, b, arp=False, arp_cut=(3000, 3000), stabs=True, kicks=True):
    t = a
    while t < b - 1e-6:
        beat = int(round((t - D) / BEAT)); ch = chord_at(t + 1e-4)
        if kicks: kik(t)
        if beat % 2 == 1: dry.add(clap(0.11), t, 0.6); wet.add(clap(), t, 0.25)
        dry.add(hat(True), t + BEAT / 2, 0.28, pan=0.2)
        for k in range(4): dry.add(hat(), t + k * BEAT / 4, 0.1 + (0.06 if k % 2 else 0), pan=-0.25)
        dry.add(shaker(), t + BEAT * 0.75, 0.22, pan=0.4)
        mus.add(bass(ch[1], 0.17, 1.8), t, 0.5); mus.add(bass(ch[1] + 12, 0.17, 1.8), t + BEAT / 2, 0.45)
        if stabs: stab(t + BEAT / 2, ch, 0.11, 3800, 0.6)
        if arp:
            notes = [ch[0][0] + 12, ch[0][1] + 12, ch[0][2] + 12, ch[0][1] + 24]
            cut = arp_cut[0] + (arp_cut[1] - arp_cut[0]) * (t - a) / max(1e-6, b - a)
            for k in range(4):
                s = pluck_saw(notes[k], 0.1, cut, 0.08); mus.add(s, t + k * BEAT / 4, 0.3, pan=0.35 if k % 2 else -0.35); wet.add(s, t + k * BEAT / 4, 0.15)
        t += BEAT


# ================================================================== 0 - 4.2: the green logo sting at 1.4x, building
G = 0.6                                                       # sting sits well under the drop
p = pad([50, 57, 62, 64, 69], 4.3, bright=0.35, attack=1.0, release=0.5, gain=0.05 * G); mus.add(p, 0.2 * S); wet.add(p, 0.2 * S, 0.8)
for k, m in enumerate([86, 90, 93, 98, 100, 102]): chime(m, (0.3 + k * 0.19) * S, 0.22 * G, pan=-0.5 + 0.2 * k)      # trace
dry.add(riser(1.3 * S, 700, 5000, 0.05 * G), 0.3 * S)
for m in (38, 45, 50): s = piano(m, 1.0, 0.6); mus.add(s, 1.75 * S, 0.9 * G); wet.add(s, 1.75 * S, 0.5 * G)           # lock
dry.add(kick(0.5, 0.25), 1.75 * S, 0.5 * G)
for k, m in enumerate([86, 88, 90, 93, 95, 98, 100, 102, 98, 100, 102, 105]): chime(m, (1.85 + k * 0.055) * S, 0.14 * G, pan=-0.7 + 0.12 * k)  # bloom
dry.add(whoosh(0.6 * S, 0.55 * S, 0.1 * G), 2.3 * S)                                                                 # orbit
for m in (50, 57, 64, 66, 69): s = piano(m, 2.0, 0.66); mus.add(s, 2.85 * S, 0.8 * G, pan=-0.2 + 0.1 * (m % 5)); wet.add(s, 2.85 * S, 0.7 * G)   # ignite
for m in (86, 93, 98): chime(m, 2.85 * S, 0.3 * G)
dry.add(sub808(38, 1.0), 2.85 * S, 0.45 * G)
dry.add(whoosh(0.8 * S, 0.6 * S, 0.08 * G), 3.4 * S)                                                                 # glide
for i, m in enumerate([74, 78, 81, 83, 86]): marimba(m, (3.95 + i * 0.08) * S, 0.75 * G, pan=-0.4 + 0.2 * i)        # A F A I C
chime(110, 4.9 * S, 0.3 * G); dry.add(kick(0.4, 0.12), 4.9 * S, 0.3 * G)                                           # i-dot lands
for k, m in enumerate([93, 95, 98, 100, 102, 105, 107]): chime(m, (5.05 + k * 0.07) * S, 0.1 * G, pan=-0.6 + 0.2 * k)   # glint
# build into the drop: snare roll, riser, reversed crash, portal whoosh, a breath of silence
roll(D - 2 * BEAT, D - BEAT, BEAT / 4, 0.1, 0.18)
roll(D - BEAT, D - BEAT / 4, BEAT / 8, 0.2, 0.42)
dry.add(riser(1.5, 300, 9000, 0.13), D - 1.6)
rev_crash(D - 0.02, 1.1, 0.8)
dry.add(whoosh(0.36, 0.33, 0.16), D - 0.36)

# ================================================================== the drop: SUMMER / CAMP / 2026
hit(D, chord_at(D), 1.25, 0.6); dry.add(boom(1.6), D, 0.4)
for i, m in enumerate([74, 78, 81, 86, 90, 93]): steel(m, D + i * BEAT / 4, 0.55, pan=-0.5 + 0.2 * i)                 # S-U-M-M-E-R fly in
for i in range(4): thud(D + 2 * BEAT + i * BEAT / 4 + 0.18, 0.45)                                                    # C-A-M-P drop
hit(D + BAR, chord_at(D + BAR), 0.95)                                                                                # 2026 + confetti
for k, m in enumerate([98, 102, 105, 110, 105, 110]): chime(m, D + BAR + 0.05 + k * 0.06, 0.1, pan=-0.6 + 0.24 * k)
pop(D + 6 * BEAT, 500, 1600, 0.4)                                                                                    # "AFAIC Youth presents"
groove(D, T_TUN)
melody(D + BAR, T_TUN - BEAT)
# the title bursts, the camera dives into the tunnel
dry.add(riser(1.3, 400, 8000, 0.11), T_TUN - 1.3)
dry.add(whoosh(0.5, 0.45, 0.16), T_TUN - 0.5)
roll(T_TUN - BEAT, T_TUN, BEAT / 8, 0.15, 0.35)

# ================================================================== tunnel: 8 activities on every other beat
hit(T_TUN, chord_at(T_TUN), 1.1)
groove(T_TUN, T_STAT, arp=True, arp_cut=(2200, 6500))
for i in range(8):
    t0 = T_TUN + i * 2 * BEAT
    pop(t0, 420 + 40 * i, 1500 + 120 * i, 0.4, pan=(-1 if i % 2 == 0 else 1) * 0.3)                                  # item pops up
    dry.add(whoosh(0.4, 0.15, 0.11), t0 + 0.82, pan=0)                                                               # ...whips past
dry.add(riser(1.4, 500, 9000, 0.1), T_STAT - 1.4)
roll(T_STAT - BEAT, T_STAT, BEAT / 8, 0.15, 0.35)

# ================================================================== stats: slot-machine spins, whip pans
hit(T_STAT, chord_at(T_STAT), 1.0)
groove(T_STAT, T_LCG)
for i in range(3):
    t0 = T_STAT + i * 3 * BEAT
    if i: stab(t0, chord_at(t0), 0.3, 6000, 1.0); dry.add(crash(1.2), t0, 0.4)
    tt = t0
    for k in range(8): tick(tt, 2100 - 90 * k, 0.3); tt += 0.03 * 1.22 ** k
    chime(98 + 2 * i, tt + 0.02, 0.28); chime(105 + 2 * i, tt + 0.02, 0.16)                                         # it lands: ding
    if i < 2: dry.add(whoosh(0.42, 0.24, 0.14), T_STAT + (i + 1) * 3 * BEAT - 0.32)                                   # whip to the next
dry.add(riser(1.0, 500, 8000, 0.08), T_LCG - 1.0)

# ================================================================== LEAD. CONNECT. GROW. then the build
groove(T_LCG, T_CTA - 2 * BEAT)
for i in range(3):
    t0 = T_LCG + i * 2 * BEAT
    dry.add(whoosh(0.32, 0.3, 0.14), t0 - 0.32)
    hit(t0, chord_at(t0), 1.1 if i < 2 else 1.25, 0.5)
groove(T_CTA - 2 * BEAT, T_CTA, kicks=False, stabs=False)
roll(T_CTA - 2 * BEAT, T_CTA - BEAT, BEAT / 4, 0.14, 0.24)
roll(T_CTA - BEAT, T_CTA - BEAT / 4, BEAT / 8, 0.24, 0.48)
dry.add(riser(1.6, 300, 10000, 0.14), T_CTA - 1.7)
rev_crash(T_CTA - 0.02, 0.9, 0.7)

# ================================================================== call to action, card, final button
hit(T_CTA, chord_at(T_CTA), 1.3, 0.6); dry.add(boom(1.6), T_CTA, 0.4)
for k, m in enumerate([98, 102, 105, 110, 105, 110, 114]): chime(m, T_CTA + 0.05 + k * 0.05, 0.1, pan=-0.6 + 0.2 * k)
for i, m in enumerate([74, 76, 78, 81, 83, 86, 88, 90]): marimba(m, T_CTA + i * 0.035, 0.45, pan=-0.5 + 0.13 * i)   # REGISTER rises
for i, m in enumerate([78, 81, 83, 86, 88, 90, 93]): marimba(m, T_CTA + 2 * BEAT + i * 0.05, 0.4, pan=-0.5 + 0.16 * i)   # YOUR INTEREST
groove(T_CTA, T_END)
melody(T_CTA, T_CTA + BAR)
for pos, m in [(0, 79), (0.5, 83), (1, 86), (1.5, 83), (2, 85), (2.5, 88), (3, 85), (3.5, 81)]: steel(m, T_CTA + BAR + pos * BEAT)   # G - A
thud(T_CTA + 4 * BEAT + 0.12, 0.6); dry.add(crash(1.5), T_CTA + 4 * BEAT, 0.5)                                       # card lands
for k, m in enumerate([105, 110, 114, 117]): chime(m, T_CTA + 4 * BEAT + 0.1 + k * 0.07, 0.08)
roll(T_END - BEAT, T_END, BEAT / 8, 0.12, 0.3)
hit(T_END, CH['D'], 1.35, 1.1)
for m in (62, 66, 69, 74, 78): s = piano(m, 1.6, 0.7); mus.add(s, T_END, 0.55); wet.add(s, T_END, 0.6)
steel(86, T_END, 0.6, dur=1.4); chime(98, T_END, 0.25)

dry.x += mus.x * duck[:, None]
master(dry, wet, SEC, wet_gain=0.24, duck=None, fade_in=0.05, fade_out=1.0, drive=1.3,
       out=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav'))
