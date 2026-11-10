'use client';

import { useRef, useState } from 'react';
import styles from '../../../admin.module.css';

type Props = {
  title: string;
  meta: string;
  backgroundUrl: string | null;
  previewUrl: string | null;
};

const W = 1920;
const H = 1080;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Couldn’t load the background image.'));
    img.src = url;
  });
}

function pickFormat() {
  const options = [
    { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  return options.find((o) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(o.mime)) ?? null;
}

function drawFrame(ctx: CanvasRenderingContext2D, img: HTMLImageElement, title: string, meta: string, overlay: boolean, tick: number) {
  // Cover-fit the background.
  const scale = Math.max(W / img.width, H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);

  if (overlay) {
    const grad = ctx.createLinearGradient(0, H * 0.55, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 96px Helvetica, Arial, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, 96, H - 190, W - 192);
    ctx.fillStyle = '#c9a54c';
    ctx.font = '700 44px Helvetica, Arial, sans-serif';
    ctx.fillText(meta, 96, H - 120, W - 192);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '600 36px Helvetica, Arial, sans-serif';
    ctx.fillText('bagchaserkash.com/beats', 96, H - 68, W - 192);
  }

  // A nearly invisible pixel that changes each frame keeps the video stream ticking.
  ctx.fillStyle = tick % 2 ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.03)';
  ctx.fillRect(W - 1, H - 1, 1, 1);
}

export default function YouTubeVideoMaker({ title, meta, backgroundUrl, previewUrl }: Props) {
  const [overlay, setOverlay] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  async function make() {
    if (running.current || !backgroundUrl || !previewUrl) return;
    running.current = true;
    setError(null);

    let audioCtx: AudioContext | null = null;
    try {
      const format = pickFormat();
      if (!format) throw new Error('This browser can’t make videos. Try Chrome or Safari on a computer.');

      setStatus('Loading picture and audio…');
      audioCtx = new AudioContext();
      await audioCtx.resume();
      const [img, audioBuffer] = await Promise.all([
        loadImage(backgroundUrl),
        fetch(previewUrl)
          .then((r) => {
            if (!r.ok) throw new Error('Couldn’t download the tagged preview.');
            return r.arrayBuffer();
          })
          .then((buf) => audioCtx!.decodeAudioData(buf)),
      ]);

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Couldn’t start the video canvas.');
      let tick = 0;
      drawFrame(ctx, img, title, meta, overlay, tick);

      const videoStream = canvas.captureStream(2);
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);

      const stream = new MediaStream([...videoStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const recorder = new MediaRecorder(stream, {
        mimeType: format.mime,
        videoBitsPerSecond: 2_500_000,
        audioBitsPerSecond: 256_000,
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const finished = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: format.mime.split(';')[0] }));
      });

      const duration = audioBuffer.duration;
      recorder.start(1000);
      const startedAt = audioCtx.currentTime;
      source.start();

      const timer = window.setInterval(() => {
        tick += 1;
        drawFrame(ctx, img, title, meta, overlay, tick);
        const elapsed = audioCtx ? audioCtx.currentTime - startedAt : 0;
        const pct = Math.min(99, Math.round((elapsed / duration) * 100));
        setStatus(`Making your video… ${pct}% (keep this tab open)`);
      }, 500);

      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
      });
      window.clearInterval(timer);
      await new Promise((r) => setTimeout(r, 400));
      recorder.stop();
      const blob = await finished;

      const safe = title.replace(/[^a-zA-Z0-9 ._()-]+/g, '').trim() || 'Beat';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safe} - YouTube.${format.ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setStatus('Done. Your video downloaded. Upload it to YouTube.');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Couldn’t make the video.');
    } finally {
      running.current = false;
      if (audioCtx) audioCtx.close().catch(() => {});
    }
  }

  const missing = !previewUrl ? 'Make the tagged preview first.' : !backgroundUrl ? 'Upload a background picture (or cover art) first.' : null;

  return (
    <div className={styles.fileSlot}>
      <div className={styles.fileInfo}>
        <div className={styles.fileLabel}>YouTube video</div>
        <div className={styles.help}>
          Combines your background picture with the tagged preview into a 1080p video. It takes about as long as the beat
          plays, so keep this tab open until it downloads.
        </div>
        <label className={styles.inlineCheck}>
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
          Show beat title, BPM, key, and store link on the video
        </label>
        {missing && <div className={styles.fileMissing}>{missing}</div>}
        {status && <div className={styles.fileCurrent} aria-live="polite">{status}</div>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      <div>
        <button
          type="button"
          className={styles.ghostButton}
          disabled={Boolean(missing) || (status !== null && status.startsWith('Making')) || (status !== null && status.startsWith('Loading'))}
          onClick={make}
        >
          Make YouTube video
        </button>
      </div>
    </div>
  );
}
