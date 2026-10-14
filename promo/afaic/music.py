import numpy as np, wave
SR=44100; DUR=60.0; N=int(SR*DUR); out=np.zeros((N,2))
rng=np.random.default_rng(7)
beat=0.5
def add(sig,t,gain=1.0,pan=0.0):
    i=int(t*SR); 
    if i>=N: return
    s=sig[:N-i]*gain
    out[i:i+len(s),0]+=s*(1-pan)/1; out[i:i+len(s),1]+=s*(1+pan)/1
def env(n,a=0.005,d=0.3):
    t=np.arange(n)/SR; e=np.minimum(1,t/a)*np.exp(-t/d); return e
def kick():
    n=int(.35*SR); t=np.arange(n)/SR; f=50+110*np.exp(-t*30); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*9)
def clap():
    n=int(.25*SR); t=np.arange(n)/SR; x=rng.standard_normal(n)
    e=np.exp(-t*25)+.6*np.exp(-np.maximum(t-.012,0)*25)*(t>.012)
    # bandpass-ish via diff
    x=np.diff(np.concatenate([[0],x])); return x*e*.5
def hat(open_=False):
    n=int((.18 if open_ else .05)*SR); x=np.diff(np.concatenate([[0],rng.standard_normal(n)]))
    return x*np.exp(-np.arange(n)/SR*(12 if open_ else 60))*.25
def note(freq,dur,kind='pluck'):
    n=int(dur*SR); t=np.arange(n)/SR
    if kind=='pluck':
        s=np.sin(2*np.pi*freq*t)+.5*np.sin(2*np.pi*2*freq*t)+.25*np.sign(np.sin(2*np.pi*freq*t))*.3
        return s*env(n,.003,.18)
    if kind=='bass':
        s=np.sin(2*np.pi*freq*t)+.3*np.sin(2*np.pi*2*freq*t); return s*env(n,.005,.25)
    if kind=='pad':
        s=sum(np.sin(2*np.pi*freq*(1+d)*t) for d in (-.004,0,.004))/3
        a=np.minimum(1,t/.3)*np.minimum(1,(dur-t)/.4); return s*a
    if kind=='bell':
        s=np.sin(2*np.pi*freq*t)+.4*np.sin(2*np.pi*3.01*freq*t)*np.exp(-t*6); return s*env(n,.002,.5)
mid=lambda m:440*2**((m-69)/12)
# D A Bm G
chords=[[62,66,69],[57,61,64],[59,62,66],[55,59,62]]
roots=[38,33,35,31]
melody=[74,76,78,76, 73,76,73,71, 74,71,74,78, 79,78,76,74]  # 4 notes per bar (quarters)
for bar in range(30):
    t0=bar*2.0; c=chords[bar%4]; r=roots[bar%4]
    last = bar==29
    full = 1 <= bar < 29
    # pad
    add(note(0,1)[:0],0)
    for m in c: add(note(mid(m-12),2.0,'pad'),t0,.06)
    if last:
        for m in [62,66,69,74]: add(note(mid(m),2.0,'bell'),t0,.18)
        add(note(mid(38),2.0,'bass'),t0,.35); add(kick(),t0,.9); continue
    # arpeggio 8ths
    for k in range(8):
        m=c[[0,1,2,1,0,2,1,2][k]]+12
        add(note(mid(m),.3,'pluck'),t0+k*.25,.10,pan=(.3 if k%2 else -.3))
    if bar>=2 and not (15<=bar<16):
        for k in range(4):
            add(note(mid(melody[(bar%4)*4+k]),.45,'bell'),t0+k*.5,.09)
    if full:
        for k in range(4):
            add(kick(),t0+k*.5,.8)
            add(note(mid(r),.22,'bass'),t0+k*.5+.25,.32); add(note(mid(r),.2,'bass'),t0+k*.5,.25)
            if k in (1,3): add(clap(),t0+k*.5,.7)
            add(hat(),t0+k*.5+.25,.8,pan=.2); add(hat(),t0+k*.5,.4,pan=-.2)
        add(hat(True),t0+1.75,.5)
# intro riser 0-2
n=int(2*SR); t=np.arange(n)/SR; x=rng.standard_normal(n); x=np.diff(np.concatenate([[0],x]))
add(x*(t/2)**2*.12,0)
# whooshes at transitions
for T in [6,12,19,31,40.5,47,54]:
    n=int(.8*SR); t=np.arange(n)/SR; x=rng.standard_normal(n)
    x=np.convolve(x,np.ones(8)/8,'same'); e=np.exp(-((t-.4)/.15)**2)
    add(x*e*.35,T-.4)
    add(note(mid(86),.3,'bell'),T,.08)
out[:, :]*=1.0
# fade
fade=np.ones(N); fs=int(1.5*SR); fade[-fs:]=np.linspace(1,0,fs); out*=fade[:,None]
out/=np.max(np.abs(out))*1.12
out=np.tanh(out*1.3)/np.tanh(1.3)*.9
w=wave.open('music.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((out*32767).astype('<i2').tobytes()); w.close(); print('done')
