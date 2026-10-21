"""Sonic logo for the 6-second AFAIC logo reveal, cue-for-cue with logo-anim.js:
trace (rising celesta) -> petals lock (warm low chord) -> rosette bloom (sparkle run) -> tips orbit (whoosh)
-> centre ignites (Dmaj9 piano + bell) -> icon glides (air) -> A-F-A-I-C letters (marimba) -> i-dot lands (ting)
-> tagline + glint (shimmer), resolving on D."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from afaic_synth import *

SEC = 6.0
dry, wet = Bus(SEC + 1), Bus(SEC + 1)

def chime(m, t, g=0.3, pan=0.0):
    s = bell(m, 0.55, 2.5); dry.add(s, t, g, pan); wet.add(s, t, g * 1.4)

def marimba(m, t, g=0.5, pan=0.0):
    f = mtof(m); n = int(1.2 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.35) + 0.25 * np.sin(2 * np.pi * f * 3.93 * tt) * np.exp(-tt / 0.07)
         + 0.1 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt / 0.02)) * np.minimum(1, tt / 0.002)
    dry.add(s * 0.3, t, g, pan); wet.add(s * 0.3, t, g * 0.6)

p = pad([50, 57, 62, 64, 69], 5.4, bright=0.35, attack=1.6, release=1.2, gain=0.035); dry.add(p, 0.2); wet.add(p, 0.2, 0.8)
for k, m in enumerate([86, 90, 93, 98, 100, 102]): chime(m, 0.3 + k * 0.19, 0.14, pan=-0.5 + 0.2 * k)          # trace
dry.add(riser(1.3, 700, 5000, 0.035), 0.3)
for m in (38, 45, 50): s = piano(m, 1.2, 0.55); dry.add(s, 1.75, 0.6); wet.add(s, 1.75, 0.4)               # lock
dry.add(kick(0.5, 0.25), 1.75, 0.35)
for k, m in enumerate([86, 88, 90, 93, 95, 98, 100, 102, 98, 100, 102, 105]): chime(m, 1.85 + k * 0.055, 0.09, pan=-0.7 + 0.12 * k)   # bloom
dry.add(whoosh(0.6, 0.55, 0.07), 2.3)                                                                    # orbit
for m in (50, 57, 64, 66, 69): s = piano(m, 2.6, 0.62); dry.add(s, 2.85, 0.55, pan=-0.2 + 0.1 * (m % 5)); wet.add(s, 2.85, 0.6)   # ignite
for m in (86, 93, 98): chime(m, 2.85, 0.22)
dry.add(sub808(38, 1.2), 2.85, 0.35)
dry.add(whoosh(0.8, 0.6, 0.05), 3.4)                                                                     # glide into the lockup
for i, m in enumerate([74, 78, 81, 83, 86]): marimba(m, 3.95 + i * 0.08, 0.5, pan=-0.4 + 0.2 * i)        # A F A I C
chime(110, 4.9, 0.25); dry.add(kick(0.4, 0.12), 4.9, 0.2)                                               # i-dot lands
for k, m in enumerate([93, 95, 98, 100, 102, 105, 107]): chime(m, 5.05 + k * 0.07, 0.07, pan=-0.6 + 0.2 * k)   # glint
fin = pad([62, 66, 69, 74], 1.4, bright=0.6, attack=0.3, release=0.8, gain=0.04); dry.add(fin, 4.85); wet.add(fin, 4.85, 0.8)

master(dry, wet, SEC, wet_gain=0.4, fade_in=0.2, fade_out=0.7, drive=1.1, out=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav'))
