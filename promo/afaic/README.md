# AFAIC Annual Report 2024–25 video

60-second video (1920×1080, 60 fps) summarising Afghan Fajar Association Inc.'s 2024–25 year.

- `afaic_annual_report_2024-25.mp4`: the final video
- `index.html`: the animation. Serve this folder and open it in Chrome to preview (`?t=30` starts at 30 s).
- `render.mjs`: renders every frame to `silent.mp4` (Playwright + ffmpeg; update the Playwright import path for your machine)
- `music.py`: generates the original soundtrack `music.wav` (numpy + scipy)

## Rebuild

```sh
python3 -m http.server 8766 &
node render.mjs video 60
python3 music.py
ffmpeg -i silent.mp4 -i music.wav -c:v copy -c:a aac -b:a 192k -shortest afaic_annual_report_2024-25.mp4
```

## Sources

- Figures: the Afghan Fajar Association section of the 2024–25 SETS Activity Work Plan report
- Organisation details, logo and photos: afaic.org.au
- Fraunces typeface: SIL Open Font License 1.1 (`fonts/OFL.txt`)
