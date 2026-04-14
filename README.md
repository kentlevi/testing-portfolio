# Test Portfolio

## Loop Video Utility

This project includes a tiny FFmpeg-based utility that turns the source hero motion clip into a seamless mirrored loop for website backgrounds.

Source input:

- `assets/video/Abstract_Purple_Wave_Animation_Loop.mp4`

Generated outputs:

- `assets/video/abstract-purple-wave-loop.mp4`
- `assets/video/abstract-purple-wave-loop.webm` (optional)

### Requirements

- Node.js 22+ (already available in this environment)

This project now includes local `ffmpeg-static` and `ffprobe-static` dependencies, so the default command works without a separate system FFmpeg install.

If you want to override the binaries, you can still point the script at custom paths with environment variables:

```powershell
$env:FFMPEG_BIN="C:\path\to\ffmpeg.exe"
$env:FFPROBE_BIN="C:\path\to\ffprobe.exe"
npm.cmd run generate:loop-video
```

### Usage

Generate the default MP4 and optional WebM outputs:

```powershell
npm.cmd run generate:loop-video
```

Generate only the MP4:

```powershell
node scripts/generate-loop-video.js --no-webm
```

Use a different source duration before the forward + reverse stitch:

```powershell
node scripts/generate-loop-video.js --trim 3.5
```

### Hero Video Path

Use `assets/video/abstract-purple-wave-loop.mp4` as the hero background source in the site. If you serve multiple formats, prefer:

```html
<video autoplay muted loop playsinline>
  <source src="/assets/video/abstract-purple-wave-loop.webm" type="video/webm" />
  <source src="/assets/video/abstract-purple-wave-loop.mp4" type="video/mp4" />
</video>
```

The utility builds the loop by taking a trimmed forward segment, removing the boundary frames from the mirrored half, and concatenating the two passes so the loop wraps cleanly without a visible hitch.
