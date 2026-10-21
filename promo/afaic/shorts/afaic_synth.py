"""Small synthesis toolkit shared by the AFAIC shorts soundtracks (numpy + scipy).

Everything is generated from scratch, so the music carries no licensing questions.
"""
import wave
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(7)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output='sos')


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x, axis=0)


class Bus:
    def __init__(self, seconds):
        self.n = int(SR * seconds)
        self.x = np.zeros((self.n, 2))

    def add(self, sig, t, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i < 0:
            sig, i = sig[-i:], 0
        if i >= self.n or len(sig) == 0:
            return
        sig = sig[: self.n - i] * gain
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
            self.x[i:i + len(sig), 0] += sig * l
            self.x[i:i + len(sig), 1] += sig * r
        else:
            self.x[i:i + len(sig)] += sig


def env_adsr(n, a=0.005, d=0.1, s=0.7, r=0.1, dur=None):
    t = np.arange(n) / SR
    dur = dur if dur is not None else n / SR
    e = np.where(t < a, t / max(a, 1e-6), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6)))
    return e * np.where(t < dur, 1.0, np.exp(-(t - dur) / max(r, 1e-6)))


# ------------------------------------------------------------------ tonal
def saw(f, n, detune=0.0):
    t = np.arange(n) / SR
    ph = (f * (1 + detune) * t + rng.random()) % 1.0
    return 2 * ph - 1


def supersaw(freqs, dur, cutoff=3500, a=0.004, d=0.18, s=0.25, r=0.12, voices=5, spread=0.012):
    n = int((dur + r * 5) * SR)
    out = np.zeros((n, 2))
    for f in freqs:
        for v in range(voices):
            det = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
            x = saw(f, n, det)
            pan = det / spread * 0.7
            out[:, 0] += x * np.cos((pan + 1) * np.pi / 4)
            out[:, 1] += x * np.sin((pan + 1) * np.pi / 4)
    out = filt(out, 'lowpass', cutoff, 2)
    return out * env_adsr(n, a, d, s, r, dur)[:, None] * (0.18 / max(1, len(freqs)) ** 0.5 / voices ** 0.5)


def pluck_saw(m, dur=0.25, cutoff=3000, decay=0.12):
    f = mtof(m)
    n = int((dur + 0.4) * SR)
    t = np.arange(n) / SR
    x = saw(f, n) * 0.6 + saw(f, n, 0.006) * 0.4
    # brightness falls with the envelope
    x = filt(x, 'lowpass', cutoff, 2)
    return x * np.minimum(1, t / 0.002) * np.exp(-t / decay) * 0.35


def pad(ms, dur, bright=0.3, attack=0.8, release=1.4, gain=0.05):
    n = int((dur + release + 0.2) * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for m in ms:
        f = mtof(m)
        for d, pan in ((-0.005, -0.7), (0.0, 0.0), (0.005, 0.7)):
            vib = 1 + 0.0015 * np.sin(2 * np.pi * (4.5 + rng.random()) * t)
            ph = 2 * np.pi * np.cumsum(f * (1 + d) * vib) / SR
            v = sum(np.sin(h * ph) / h * np.exp(-h / (2.5 + 3 * bright)) for h in range(1, 12))
            out[:, 0] += v * np.cos((pan + 1) * np.pi / 4)
            out[:, 1] += v * np.sin((pan + 1) * np.pi / 4)
    e = np.minimum(1, t / attack) ** 2 * np.where(t < dur, 1.0, np.clip(1 - (t - dur) / release, 0, 1)) ** 2
    return filt(out * e[:, None], 'lowpass', 1800 + 3000 * bright) * gain


def piano(m, dur, vel=0.8):
    f = mtof(m)
    n = int((dur + 2.0) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    B = 0.00008 * (f / 261.6) ** 1.5
    T0 = 3.0 * (196.0 / f) ** 0.45
    for h in range(1, 15):
        fh = f * h * np.sqrt(1 + B * h * h)
        if fh > 15000:
            break
        amp = (1.0 / h ** 1.25) * vel ** (0.6 + 0.12 * h)
        ph = rng.random() * 6.28
        out += amp * np.exp(-t / (T0 / (1 + 0.42 * (h - 1)))) * (np.sin(2 * np.pi * fh * t + ph) + 0.5 * np.sin(2 * np.pi * fh * 1.0007 * t))
    out *= np.minimum(1, t / 0.003) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.25))
    return filt(out, 'lowpass', 2600 + 5200 * vel) * 0.22


def ks_pluck(freq, dur=1.6, bright=0.5, damp=0.996):
    """Karplus-Strong plucked string (rubab / santur-like), block-vectorised."""
    N = max(2, int(round(SR / freq - 0.5)))   # the averaging filter adds half a sample of delay
    n = int(dur * SR)
    burst = rng.uniform(-1, 1, N)
    burst = filt(burst, 'lowpass', 1500 + 7000 * bright)
    y = np.zeros(n + N + 1)
    y[:N] = burst
    i = N
    while i < n:
        j = min(i + N, n)
        y[i:j] = damp * 0.5 * (y[i - N:j - N] + y[i - N - 1:j - N - 1] if i - N - 1 >= 0 else y[i - N:j - N] * 2)
        i = j
    y = y[:n]
    y += 0.4 * filt(y, 'bandpass', [freq * 1.9, min(freq * 6, 15000)])   # body brightness
    t = np.arange(n) / SR
    return y * np.minimum(1, t / 0.001) * np.clip((dur - t) / 0.08, 0, 1) * 0.5


def bell(m, vel=0.7, dur=3.0):
    f = mtof(m)
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t / 1.4) + 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.7)
         + 0.18 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.35) + 0.08 * np.sin(2 * np.pi * f * 5.43 * t) * np.exp(-t / 0.18))
    return s * np.minimum(1, t / 0.002) * vel * 0.3


def bass(m, dur, drive=1.0):
    f = mtof(m)
    n = int((dur + 0.2) * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    s = np.tanh(s * drive) / np.tanh(drive)
    return s * np.minimum(1, t / 0.008) * (0.75 + 0.25 * np.exp(-t / 0.2)) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.05)) * 0.5


def sub808(m, dur=0.9):
    f = mtof(m)
    n = int((dur + 0.1) * SR)
    t = np.arange(n) / SR
    fr = f * (1 + 1.2 * np.exp(-t / 0.03))
    s = np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(fr) / SR)) * np.exp(-t / (dur * 0.6))
    return s * np.minimum(1, t / 0.002) * 0.6


def drone(ms, dur, gain=0.05):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m in ms:
        f = mtof(m)
        ph = 2 * np.pi * np.cumsum(f * (1 + 0.002 * np.sin(2 * np.pi * 0.2 * t))) / SR
        out += sum(np.sin(h * ph) / h ** 1.4 for h in range(1, 9))
    e = np.minimum(1, t / 2.0) * np.clip((dur - t) / 2.0, 0, 1)
    return filt(out * e, 'lowpass', 1600) * gain


# ------------------------------------------------------------------ drums & fx
def kick(punch=1.0, tail=0.3):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 45 + 85 * punch * np.exp(-t / 0.032)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tail)
    click = filt(rng.standard_normal(n), 'bandpass', [1500, 6000]) * np.exp(-t / 0.004) * 0.15
    return np.tanh((s + click) * 1.4) * 0.8


def clap(tail=0.12):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    x = filt(rng.standard_normal(n), 'bandpass', [900, 3500])
    e = sum(np.where(t >= o, np.exp(-(t - o) / 0.009), 0) for o in (0, 0.011, 0.022)) * 0.6
    e += np.where(t >= 0.03, np.exp(-(t - 0.03) / tail), 0) * 0.5
    return x * e * 0.55


def snare():
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.5
    nz = filt(rng.standard_normal(n), 'bandpass', [1800, 8000]) * np.exp(-t / 0.11)
    return (tone + nz) * 0.5


def hat(open_=False):
    n = int((0.3 if open_ else 0.07) * SR)
    t = np.arange(n) / SR
    x = filt(rng.standard_normal(n), 'highpass', 7500, 4)
    return x * np.exp(-t / (0.1 if open_ else 0.018)) * 0.33


def shaker():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return filt(rng.standard_normal(n), 'bandpass', [4000, 10000]) * np.minimum(1, t / 0.012) * np.exp(-t / 0.035) * 0.35


def daf(kind='dum'):
    """Frame drum: 'dum' (low, open) or 'tak' (edge slap)."""
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    if kind == 'dum':
        s = np.sin(2 * np.pi * (70 + 25 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.28)
        s += filt(rng.standard_normal(n), 'lowpass', 900) * np.exp(-t / 0.03) * 0.3
        return s * 0.7
    s = filt(rng.standard_normal(n), 'bandpass', [1200, 5000]) * np.exp(-t / 0.045)
    jingle = filt(rng.standard_normal(n), 'highpass', 6000) * np.exp(-t / 0.12) * 0.35   # zils on the daf
    return (s + jingle) * 0.45


def crash(dur=2.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = filt(rng.standard_normal((n, 2)), 'highpass', 4000, 2)
    return x * np.exp(-t / (dur / 3))[:, None] * 0.18


def riser(dur=2.0, f0=300, f1=6000, gain=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal((n, 2))
    out = np.zeros_like(x)
    steps = 40
    for k in range(steps):
        a, b = k * n // steps, (k + 1) * n // steps
        fc = f0 * (f1 / f0) ** (k / steps)
        out[a:b] = filt(x[max(0, a - 2000):b], 'bandpass', [fc * 0.7, min(fc * 1.4, 20000)])[-(b - a):]
    tone = np.sin(2 * np.pi * np.cumsum(200 * (8 ** (t / dur))) / SR) * 0.15
    e = (t / dur) ** 2.2
    return (out + tone[:, None]) * e[:, None] * gain


def boom(dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.6)
    return np.tanh(s * 1.5) * 0.7


def whoosh(dur=0.6, peak=0.45, gain=0.08):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = filt(rng.standard_normal((n, 2)), 'bandpass', [600, 7000])
    e = np.where(t < peak, (t / peak) ** 2, np.exp(-(t - peak) / 0.08))
    return x * e[:, None] * gain


def sparkle(m=96):
    return bell(m, 0.35, 1.5) * np.exp(-np.arange(int(1.5 * SR)) / SR / 0.4)


# ------------------------------------------------------------------ mixing
def reverb(x, sec=2.8, rt60=2.2, lp=5000):
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-6.9 * t / rt60)[:, None]
    ir = filt(ir, 'lowpass', lp)
    ir = np.vstack([np.zeros((int(0.02 * SR), 2)), ir])
    ir /= np.sqrt((ir ** 2).sum() / 2)
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)


def master(dry, wet, seconds, wet_gain=0.3, duck=None, fade_in=0.2, fade_out=1.2, drive=1.25, out='music.wav'):
    mix = dry.x * (1 if duck is None else duck[:, None]) + reverb(wet.x) * wet_gain
    mix = filt(mix, 'highpass', 30)
    t = np.arange(len(mix)) / SR
    mix *= (np.minimum(1, t / fade_in) * np.clip((seconds - t) / fade_out, 0, 1) ** 1.3)[:, None]
    mix = mix / np.max(np.abs(mix)) * drive
    mix = np.tanh(mix) / np.tanh(drive) * 10 ** (-1 / 20)
    mix = mix[: int(seconds * SR)]
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
    rms = 20 * np.log10(np.sqrt((mix ** 2).mean()))
    print(f'{out}: {len(mix) / SR:.2f}s, rms {rms:.1f} dBFS')
