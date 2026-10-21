# AFAIC shorts (30 s each, 1920×1080, 60 fps)

| Folder | Style | Video | Message |
|---|---|---|---|
| `kinetic/` | Kinetic typography | `afaic_kinetic_we_support_new_beginnings.mp4` | Manifesto: new country, new beginnings, since 2009, 2,600+ moments of support in 2024–25 |
| `eid/` | Cultural geometric | `afaic_eid_mubarak.mp4` | Eid greeting in Dari, Pashto and English (no year, so it can be reused every Eid) |
| `youth/` | Neo-brutalist | `afaic_youth_leadership_camp.mp4` | Youth Leadership Camp recruitment: last camp 21–23 Feb 2025, 45 young leaders, 90+ alumni |

Each folder has `index.html` (the animation; serve `promo/afaic/` and open it in Chrome, `?t=12` starts at 12 s) and `music.py` (its original soundtrack).
`engine.js` is the shared keyframe engine, `afaic_synth.py` the shared synthesiser, `render.mjs` the frame renderer.

## Rebuild one video

```sh
cd promo/afaic && python3 -m http.server 8771 &
cd shorts
node render.mjs eid video 30 60          # -> eid/silent.mp4
python3 eid/music.py                     # -> eid/music.wav
ffmpeg -i eid/silent.mp4 -i eid/music.wav -c:v copy -c:a aac -b:a 192k -shortest eid/afaic_eid_mubarak.mp4
```

Fonts: Inter (system), Fraunces and Amiri (SIL OFL 1.1, see `../fonts/`).
