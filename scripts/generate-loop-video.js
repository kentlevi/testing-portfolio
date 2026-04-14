#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const defaultInput = path.join(
  projectRoot,
  "assets",
  "video",
  "Abstract_Purple_Wave_Animation_Loop.mp4",
);
const defaultMp4Output = path.join(
  projectRoot,
  "assets",
  "video",
  "abstract-purple-wave-loop.mp4",
);
const defaultWebmOutput = path.join(
  projectRoot,
  "assets",
  "video",
  "abstract-purple-wave-loop.webm",
);
const localFfmpegBin = path.join(projectRoot, "node_modules", "ffmpeg-static", "ffmpeg.exe");
const localFfprobeBin = path.join(
  projectRoot,
  "node_modules",
  "ffprobe-static",
  "bin",
  "win32",
  "x64",
  "ffprobe.exe",
);

function fail(message) {
  console.error(`\n[loop-video] ${message}`);
  process.exit(1);
}

function run(bin, args, options = {}) {
  const result = spawnSync(bin, args, {
    cwd: projectRoot,
    stdio: options.captureOutput ? "pipe" : "inherit",
    encoding: "utf8",
  });

  if (result.error) {
    if (options.allowFailure) {
      return result;
    }

    if (result.error.code === "ENOENT" || result.error.code === "EPERM") {
      fail(
        `Could not execute ${bin}. Install FFmpeg/FFprobe and ensure "${bin}" is on PATH, or set ${bin.toUpperCase()}_BIN.`,
      );
    }

    fail(result.error.message);
  }

  if (result.status !== 0) {
    if (options.allowFailure) {
      return result;
    }

    const details = options.captureOutput
      ? `\n${result.stderr || result.stdout || "Command failed."}`
      : "";
    fail(`${bin} exited with code ${result.status}.${details}`);
  }

  return result.stdout;
}

function parseArgs(argv) {
  const options = {
    input: defaultInput,
    mp4Output: defaultMp4Output,
    webmOutput: defaultWebmOutput,
    noWebm: false,
    trimSeconds: 4,
    crf: 23,
    webmCrf: 32,
    maxWidth: 1920,
    ffmpegBin: process.env.FFMPEG_BIN || (fs.existsSync(localFfmpegBin) ? localFfmpegBin : "ffmpeg"),
    ffprobeBin:
      process.env.FFPROBE_BIN || (fs.existsSync(localFfprobeBin) ? localFfprobeBin : "ffprobe"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--input") {
      options.input = path.resolve(projectRoot, argv[++i]);
    } else if (arg === "--mp4-output") {
      options.mp4Output = path.resolve(projectRoot, argv[++i]);
    } else if (arg === "--webm-output") {
      options.webmOutput = path.resolve(projectRoot, argv[++i]);
    } else if (arg === "--trim") {
      options.trimSeconds = Number(argv[++i]);
    } else if (arg === "--crf") {
      options.crf = Number(argv[++i]);
    } else if (arg === "--webm-crf") {
      options.webmCrf = Number(argv[++i]);
    } else if (arg === "--max-width") {
      options.maxWidth = Number(argv[++i]);
    } else if (arg === "--ffmpeg-bin") {
      options.ffmpegBin = argv[++i];
    } else if (arg === "--ffprobe-bin") {
      options.ffprobeBin = argv[++i];
    } else if (arg === "--no-webm") {
      options.noWebm = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/generate-loop-video.js [options]

Options:
  --input <path>         Source video path
  --mp4-output <path>    MP4 output path
  --webm-output <path>   WebM output path
  --trim <seconds>       Max source duration to use before mirroring (default: 4)
  --crf <number>         MP4 quality (default: 23)
  --webm-crf <number>    WebM quality (default: 32)
  --max-width <number>   Downscale only when wider than this (default: 1920)
  --no-webm              Skip the optional VP9 export
  --ffmpeg-bin <path>    Override the ffmpeg binary
  --ffprobe-bin <path>   Override the ffprobe binary
`);
      process.exit(0);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.trimSeconds) || options.trimSeconds <= 0) {
    fail("--trim must be a positive number.");
  }

  if (!Number.isFinite(options.maxWidth) || options.maxWidth < 1) {
    fail("--max-width must be a positive number.");
  }

  return options;
}

function probeVideo(ffprobeBin, input) {
  const stdout = run(
    ffprobeBin,
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=avg_frame_rate,width,height:format=duration",
      "-of",
      "json",
      input,
    ],
    { captureOutput: true },
  );

  const parsed = JSON.parse(stdout);
  const stream = parsed.streams && parsed.streams[0];
  const duration = Number(parsed.format && parsed.format.duration);

  if (!stream || !Number.isFinite(duration) || duration <= 0) {
    fail("Could not read video metadata from the source clip.");
  }

  const fps = parseFrameRate(stream.avg_frame_rate);
  if (!Number.isFinite(fps) || fps <= 0) {
    fail("Could not determine the source frame rate.");
  }

  return {
    duration,
    fps,
    width: Number(stream.width) || null,
    height: Number(stream.height) || null,
  };
}

function parseFrameRate(value) {
  if (!value) {
    return NaN;
  }

  const [numerator, denominator] = value.split("/").map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return Number(value);
  }

  return numerator / denominator;
}

function makeFilter(segmentDuration, frameDuration, maxWidth) {
  const safeInteriorEnd = segmentDuration - frameDuration;
  if (safeInteriorEnd <= frameDuration) {
    fail("The selected source segment is too short to build a seamless mirrored loop.");
  }

  return [
    `[0:v]trim=start=0:end=${segmentDuration.toFixed(6)},setpts=PTS-STARTPTS,split=2[fwd][revsrc]`,
    `[revsrc]trim=start=${frameDuration.toFixed(6)}:end=${safeInteriorEnd.toFixed(6)},setpts=PTS-STARTPTS,reverse[rev]`,
    `[fwd][rev]concat=n=2:v=1:a=0,scale='if(gt(iw,${maxWidth}),${maxWidth},iw)':-2:flags=lanczos,setsar=1[v]`,
  ].join(";");
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function encodeMp4(options, filter) {
  ensureParentDir(options.mp4Output);
  run(options.ffmpegBin, [
    "-y",
    "-i",
    options.input,
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    String(options.crf),
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    options.mp4Output,
  ]);
}

function encodeWebm(options, filter) {
  ensureParentDir(options.webmOutput);
  const result = spawnSync(
    options.ffmpegBin,
    [
      "-y",
      "-i",
      options.input,
      "-filter_complex",
      filter,
      "-map",
      "[v]",
      "-an",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      String(options.webmCrf),
      "-row-mt",
      "1",
      options.webmOutput,
    ],
    {
      cwd: projectRoot,
      stdio: "inherit",
      encoding: "utf8",
    },
  );

  return !result.error && result.status === 0;
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(options.input)) {
    fail(`Input video not found: ${options.input}`);
  }

  const metadata = probeVideo(options.ffprobeBin, options.input);
  const frameDuration = 1 / metadata.fps;
  const segmentDuration = Math.min(metadata.duration, options.trimSeconds);
  const filter = makeFilter(segmentDuration, frameDuration, options.maxWidth);

  console.log(`[loop-video] Source: ${path.relative(projectRoot, options.input)}`);
  console.log(
    `[loop-video] Using ${segmentDuration.toFixed(2)}s of source at ${metadata.fps.toFixed(3)} fps`,
  );

  encodeMp4(options, filter);
  console.log(`[loop-video] Wrote ${path.relative(projectRoot, options.mp4Output)}`);

  if (!options.noWebm) {
    if (encodeWebm(options, filter)) {
      console.log(`[loop-video] Wrote ${path.relative(projectRoot, options.webmOutput)}`);
    } else {
      console.warn(
        "[loop-video] WebM export was skipped because VP9 encoding is unavailable in this FFmpeg build.",
      );
    }
  }
}

main();
