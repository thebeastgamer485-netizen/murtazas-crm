"""Original underscore for the AFAIC Annual Report video.

Warm, hopeful piano + strings in D major at 96 BPM (one bar = 2.5 s, 24 bars = 60 s),
arranged to the scene timing:  intro (0-5) -> build (5-30) -> full (30-55) -> resolve (55-60).
Everything is synthesised here, so there are no licensing questions.
"""
import numpy as np
import wave
from scipy import signal

SR = 48000
DUR = 60.0
N = int(SR * (DUR + 0.5))
BEAT = 60 / 96
BAR = 4 * BEAT
rng = np.random.default_rng(11)

def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output='sos')

class Bus:
    def __init__(self):
        self.x = np.zeros((N, 2))
    def add(self, sig, t, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i >= N or len(sig) == 0:
            return
        sig = sig[: N - i] * gain
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        if sig.ndim == 1:
            self.x[i:i + len(sig), 0] += sig * l * 1.414
            self.x[i:i + len(sig), 1] += sig * r * 1.414
        else:
            self.x[i:i + len(sig)] += sig

# ---------------------------------------------------------------- instruments
def piano(m, dur, vel=0.8):
    f = mtof(m)
    tail = 2.2
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    Bc = 0.00008 * (f / 261.6) ** 1.5
    T0 = 3.2 * (196.0 / f) ** 0.45
    for h in range(1, 16):
        fh = f * h * np.sqrt(1 + Bc * h * h)
        if fh > 15000:
            break
        amp = (1.0 / h ** 1.25) * (vel ** (0.6 + 0.12 * h))
        T = T0 / (1 + 0.42 * (h - 1))
        env = np.exp(-t / T)
        ph = rng.random() * 2 * np.pi
        out += amp * env * (np.sin(2 * np.pi * fh * t + ph) + 0.55 * np.sin(2 * np.pi * fh * 1.0007 * t + ph * 1.3))
    att = np.minimum(1.0, t / 0.003)
    rel = np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.28))
    ham = rng.standard_normal(n) * np.exp(-t / 0.006) * 0.015 * vel
    sig = (out * att + ham) * rel
    return signal.sosfilt(sos('lowpass', 2600 + 5200 * vel), sig) * 0.22

def pad(ms, dur, bright=0.0):
    n = int((dur + 1.6) * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for m in ms:
        f = mtof(m)
        for d, pan in ((-0.0045, -0.6), (0.0, 0.0), (0.0045, 0.6)):
            vib = 1 + 0.0018 * np.sin(2 * np.pi * (4.6 + rng.random()) * t + rng.random() * 6)
            phase = 2 * np.pi * np.cumsum(f * (1 + d) * vib) / SR
            v = np.zeros(n)
            for h in range(1, 12):
                v += np.sin(h * phase) / h * np.exp(-h / (3.2 + 3 * bright))
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            out[:, 0] += v * l
            out[:, 1] += v * r
    a = np.minimum(1, t / 0.9) ** 2
    rl = np.where(t < dur, 1.0, np.clip(1 - (t - dur) / 1.5, 0, 1)) ** 2
    out *= (a * rl)[:, None]
    out = signal.sosfilt(sos('lowpass', 2200 + 2500 * bright), out, axis=0)
    return out * 0.05

def bass(m, dur):
    f = mtof(m)
    n = int((dur + 0.3) * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.28 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.012) * (0.72 + 0.28 * np.exp(-t / 0.25))
    env *= np.where(t < dur, 1, np.exp(-(t - dur) / 0.07))
    return s * env * 0.5

def kick():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 44 + 70 * np.exp(-t / 0.035)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.3)
    click = signal.sosfilt(sos('bandpass', [1500, 5000]), rng.standard_normal(n)) * np.exp(-t / 0.004) * 0.12
    return (s + click) * 0.9

def clap():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    x = signal.sosfilt(sos('bandpass', [900, 3200]), rng.standard_normal(n))
    env = sum(np.where(t >= o, np.exp(-(t - o) / 0.009), 0) for o in (0, 0.011, 0.022)) * 0.6
    env += np.where(t >= 0.03, np.exp(-(t - 0.03) / 0.12), 0) * 0.5
    return x * env * 0.5

def hat(open_=False):
    n = int((0.25 if open_ else 0.07) * SR)
    t = np.arange(n) / SR
    x = signal.sosfilt(sos('highpass', 7500, 4), rng.standard_normal(n))
    return x * np.exp(-t / (0.09 if open_ else 0.018)) * 0.35

def shaker():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    x = signal.sosfilt(sos('bandpass', [4000, 10000]), rng.standard_normal(n))
    return x * np.minimum(1, t / 0.012) * np.exp(-t / 0.035) * 0.35

def bell(m, vel=0.7):
    f = mtof(m)
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t / 1.4)
         + 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.7)
         + 0.18 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.35)
         + 0.08 * np.sin(2 * np.pi * f * 5.43 * t) * np.exp(-t / 0.18))
    return s * np.minimum(1, t / 0.002) * vel * 0.3

def swell(dur=1.2, peak_at=0.85):
    """Soft airy whoosh that peaks at a scene cut."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal((n, 2))
    x = signal.sosfilt(sos('bandpass', [500, 6000]), x, axis=0)
    env = np.where(t < peak_at, (t / peak_at) ** 2.2, np.exp(-(t - peak_at) / 0.12))
    return x * env[:, None] * 0.05

# ---------------------------------------------------------------- harmony
D, A_, Bm, G = 'D', 'A', 'Bm', 'G'
VOICE = {  # bass, then right-hand voicing (low -> high)
    'D': (38, [57, 62, 66, 69, 74]),
    'A': (37, [57, 61, 64, 69, 73]),
    'Bm': (35, [54, 59, 62, 66, 71]),
    'G': (31, [55, 59, 62, 67, 71]),
}
PROG = [D, A_, Bm, G] * 5 + [D, A_, G, D]          # 24 bars
bar_t = lambda b: b * BAR                          # 0-indexed bar start

MOTIF_A = [[(0, 1.5, 78), (1.5, .5, 76), (2, 1, 74), (3, 1, 69)],
           [(0, 2, 76), (2, 1, 73), (3, 1, 76)],
           [(0, 1.5, 74), (1.5, .5, 73), (2, 2, 71)],
           [(0, 1, 74), (1, 1, 71), (2, 2, 69)]]
MOTIF_B = [[(0, 1.5, 81), (1.5, .5, 78), (2, 1, 76), (3, 1, 74)],
           [(0, 1.5, 76), (1.5, .5, 78), (2, 1, 76), (3, 1, 73)],
           [(0, 1.5, 74), (1.5, .5, 78), (2, 2, 78)],
           [(0, 1, 79), (1, 1, 78), (2, 1, 74), (3, 1, 76)]]
ENDING = {20: [(0, 2, 78), (2, 2, 81)], 21: [(0, 4, 76)], 22: [(0, 2, 74), (2, 2, 71)], 23: [(0, 4, 74)]}

dry, wet = Bus(), Bus()   # wet = reverb send
side = np.ones(N)         # kick side-chain envelope (applied to pad + bass)

for b, ch in enumerate(PROG):
    t0 = bar_t(b)
    bnote, vc = VOICE[ch]
    last = b == 23
    # --- pad / strings
    if b >= 1:
        p = pad(vc[1:4] if b < 12 else vc[1:5], BAR + (2.6 if last else 0.15), bright=0.0 if b < 12 else 0.5)
        g = 0.6 if b == 1 else (1.0 if b < 12 else 1.25)
        dry.add(p, t0, g * 0.8); wet.add(p, t0, g * 0.6)
    if 12 <= b <= 21:
        hi = pad([m + 12 for m in vc[2:5]], BAR + 0.15, bright=0.8)
        dry.add(hi, t0, 0.35); wet.add(hi, t0, 0.45)
    # --- piano
    if b < 2:   # intro: soft broken chord, then a held chord
        for k, m in enumerate(vc):
            s = piano(m, BAR * 0.9, 0.42 + 0.05 * k)
            dry.add(s, t0 + k * BEAT * 0.5, 0.9, pan=-0.3 + 0.15 * k); wet.add(s, t0 + k * BEAT * 0.5, 0.5)
        s = piano(bnote + 12, BAR, 0.45); dry.add(s, t0, 0.8); wet.add(s, t0, 0.4)
    elif last:
        for k, m in enumerate([bnote, bnote + 12] + vc):
            s = piano(m, 2.4, 0.55); dry.add(s, t0 + k * 0.03, 0.8, pan=-0.4 + 0.12 * k); wet.add(s, t0 + k * 0.03, 0.6)
    else:
        lh = piano(bnote + 12, BAR * 0.95, 0.6)
        dry.add(lh, t0, 0.8, pan=-0.2); wet.add(lh, t0, 0.35)
        pat = [0, 1, 2, 3, 4, 3, 2, 1]
        for k in range(8):
            m = vc[pat[k]]
            vel = 0.5 + (0.12 if k % 2 == 0 else 0) + (0.08 if b >= 12 else 0)
            s = piano(m, BEAT * 0.55, vel)
            dry.add(s, t0 + k * BEAT / 2, 0.55, pan=-0.35 + 0.1 * pat[k]); wet.add(s, t0 + k * BEAT / 2, 0.3)
    # --- melody (piano, doubled by bells in the full section)
    phrase = None
    if 4 <= b <= 19:
        phrase = (MOTIF_A if ((b - 4) // 4) % 2 == 0 else MOTIF_B)[(b - 4) % 4]
    elif b in ENDING:
        phrase = ENDING[b]
    if phrase:
        for st, du, m in phrase:
            vel = 0.72 if b < 12 else 0.8
            s = piano(m, du * BEAT * 0.95, vel)
            dry.add(s, t0 + st * BEAT, 0.7, pan=0.15); wet.add(s, t0 + st * BEAT, 0.45)
            if 12 <= b <= 21:
                bl = bell(m + 12, 0.55)
                dry.add(bl, t0 + st * BEAT, 0.35, pan=0.3); wet.add(bl, t0 + st * BEAT, 0.6)
    # --- bass
    if 2 <= b <= 22:
        if b < 12:
            s = bass(bnote, BAR * 0.96); dry.add(s, t0, 0.85)
        else:
            for k in range(8):
                s = bass(bnote, BEAT * 0.42); dry.add(s, t0 + k * BEAT / 2, 0.7 if k % 2 else 0.85)
    if last:
        s = bass(bnote, 2.4); dry.add(s, t0, 0.8)
    # --- drums
    if 4 <= b <= 21:
        for k in range(8):
            s = shaker(); dry.add(s, t0 + k * BEAT / 2 + 0.008, 0.5 if k % 2 else 0.32, pan=0.35)
    if 7 <= b <= 21:
        kicks = [0, 2] if b < 12 else [0, 1.75, 2]
        for kb in kicks:
            kt = t0 + kb * BEAT
            dry.add(kick(), kt, 0.75 if b < 12 else 0.9)
            i = int(kt * SR); n = int(0.32 * SR)
            if b >= 12 and i + n < N:
                side[i:i + n] = np.minimum(side[i:i + n], 1 - 0.38 * np.exp(-np.arange(n) / SR / 0.11))
    if 12 <= b <= 21:
        for kb in (1, 3):
            c = clap(); dry.add(c, t0 + kb * BEAT, 0.55, pan=0.05); wet.add(c, t0 + kb * BEAT, 0.45)
        for k in range(16):
            dry.add(hat(), t0 + k * BEAT / 4, 0.28 if k % 2 else 0.18, pan=-0.3)
        dry.add(hat(True), t0 + 3.5 * BEAT, 0.3, pan=-0.3)
    if b == 21:   # gentle fill into the closing
        for k in range(4):
            c = clap(); dry.add(c, t0 + (3 + k * 0.25) * BEAT, 0.18 + 0.08 * k); wet.add(c, t0 + (3 + k * 0.25) * BEAT, 0.3)

# scene-cut swells (quiet), synced to the picture
for cut in (5, 11.25, 17.5, 30, 37.5, 43.75, 50, 55):
    s = swell(); dry.add(s, cut - 0.85, 0.9); wet.add(s, cut - 0.85, 0.8)

# ---------------------------------------------------------------- reverb (stereo convolution)
def make_ir(sec=3.2, rt60=2.4):
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-6.9 * t / rt60)[:, None]
    ir = signal.sosfilt(sos('lowpass', 5200), ir, axis=0)
    dark = signal.sosfilt(sos('lowpass', 1800), ir, axis=0)
    mix = np.clip(t / sec * 1.8, 0, 1)[:, None]
    ir = ir * (1 - mix) + dark * mix
    pre = int(0.022 * SR)
    ir = np.vstack([np.zeros((pre, 2)), ir])
    for d, g in ((0.011, 0.5), (0.019, 0.35), (0.031, 0.28)):
        k = int(d * SR); ir[k, 0] += g; ir[k + 37, 1] += g
    return ir / np.sqrt((ir ** 2).sum() / 2)

ir = make_ir()
wsig = wet.x
rev = np.stack([signal.fftconvolve(wsig[:, c], ir[:, c])[:N] for c in range(2)], axis=1)

# side-chain on everything that is sustained
mix = dry.x * 1.0
mix = mix * side[:, None] ** 0.6 + rev * 0.32
mix = signal.sosfilt(sos('highpass', 32), mix, axis=0)

# master envelope: soft open, gentle tail into silence at 60 s
t = np.arange(N) / SR
master = np.minimum(1, t / 0.35) * np.clip((DUR - t) / 1.6, 0, 1) ** 1.5
mix *= master[:, None]

# glue + limit
peak = np.max(np.abs(mix))
mix = mix / peak * 1.25
mix = np.tanh(mix) / np.tanh(1.25)
mix *= 10 ** (-1.0 / 20)
mix = mix[: int(DUR * SR)]

with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
rms = np.sqrt((mix ** 2).mean())
print(f'music.wav  {len(mix)/SR:.2f}s  rms {20*np.log10(rms):.1f} dBFS')
