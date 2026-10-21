# AFAIC shorts (30 s each, 1920×1080, 60 fps)

| Folder | Style | Video | Message |
|---|---|---|---|
| `kinetic/` | Kinetic typography | `afaic_kinetic_we_support_new_beginnings.mp4` | Manifesto: new country, new beginnings, since 2009, 2,600+ moments of support in 2024–25 |
| `eid/` | Cultural geometric | `afaic_eid_mubarak.mp4` | Eid greeting in Dari, Pashto and English (no year, so it can be reused every Eid) |
| `youth/` | Neo-brutalist | `afaic_youth_leadership_camp.mp4` | Youth Leadership Camp recruitment: last camp 21–23 Feb 2025, 45 young leaders, 90+ alumni |
| `arya/` | Black-and-gold gala motion design | `afaic_arya_awards_2027.mp4` | ARYA Awards 2027 call for nominations: six categories, 40+ honoured each year, 500+ guests; date to be announced |
| `logo/` | Animated logo reveal (6 s) | `afaic_logo_reveal.mp4` | The icon builds itself (trace, lock, bloom, orbit, ignite), then the AFAIC wordmark and tagline reveal into the official lockup, with a sonic logo |

Each folder has `index.html` (the animation; serve `promo/afaic/` over HTTP and open it in Chrome, `?t=12` starts at 12 s) and `music.py` (its original soundtrack).
`engine.js` is the shared keyframe engine, `logo-anim.js` + `logo-geom.js` animate the real AFAIC icon (exact geometry from `assets/logo.svg`, gold or brand colours), `afaic_synth.py` the shared synthesiser, `render.mjs` the frame renderer.

## Rebuild one video

```sh
cd promo/afaic/shorts                    # render.mjs serves the files itself
node render.mjs eid video 30 60          # -> eid/silent.mp4
python3 eid/music.py                     # -> eid/music.wav
ffmpeg -i eid/silent.mp4 -i eid/music.wav -c:v copy -c:a aac -b:a 192k -shortest eid/afaic_eid_mubarak.mp4
```

Fonts: Inter (system), Fraunces and Amiri (SIL OFL 1.1, see `../fonts/`).
