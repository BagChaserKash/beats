'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPreviewSources, getUploadUrl, recordUpload, saveWaveform } from '../actions';
import { putFile } from '@/lib/upload';
import styles from '../../../admin.module.css';

const RATE = 44100;
const KBPS = 128;

type Props = {
  beatId: string;
  hasMaster: boolean;
  previewUrl: string | null;
};

async function loadAudio(url: string, ctx: BaseAudioContext) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn’t download audio (code ${res.status}).`);
  return ctx.decodeAudioData(await res.arrayBuffer());
}

function toInt16(samples: Float32Array) {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function waveformPeaks(buffer: AudioBuffer, count = 200) {
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  const size = Math.max(1, Math.floor(left.length / count));
  const peaks: number[] = [];
  let loudest = 0;
  for (let i = 0; i < count; i++) {
    let peak = 0;
    const end = Math.min(left.length, (i + 1) * size);
    for (let j = i * size; j < end; j += 16) {
      const v = Math.max(Math.abs(left[j]), Math.abs(right[j]));
      if (v > peak) peak = v;
    }
    peaks.push(peak);
    if (peak > loudest) loudest = peak;
  }
  return peaks.map((p) => Math.round((loudest ? p / loudest : 0) * 100) / 100);
}

export default function PreviewMaker({ beatId, hasMaster, previewUrl }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const generate = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setError(null);

    try {
      setStatus('Getting your files…');
      const sources = await getPreviewSources(beatId);
      if ('error' in sources) throw new Error(sources.error);
      const { interval_seconds, tag_gain, first_tag_at } = sources.options;

      setStatus('Loading audio…');
      const decoder = new OfflineAudioContext(2, RATE, RATE);
      const [beat, tag] = await Promise.all([
        loadAudio(sources.sourceUrl, decoder),
        loadAudio(sources.tagUrl, decoder),
      ]);

      setStatus('Adding your tag…');
      const ctx = new OfflineAudioContext(2, beat.length, RATE);
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -1;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.25;
      limiter.connect(ctx.destination);

      const beatSource = ctx.createBufferSource();
      beatSource.buffer = beat;
      beatSource.connect(limiter);
      beatSource.start(0);

      const tagGain = ctx.createGain();
      tagGain.gain.value = tag_gain;
      tagGain.connect(limiter);
      const interval = Math.max(10, interval_seconds);
      for (let t = Math.max(0, first_tag_at); t < beat.duration - 1; t += interval) {
        const s = ctx.createBufferSource();
        s.buffer = tag;
        s.connect(tagGain);
        s.start(t);
      }

      const mixed = await ctx.startRendering();

      setStatus('Encoding preview… 0%');
      // @ts-ignore: this library may not ship TypeScript types
      const lame: any = await import('@breezystack/lamejs'); // eslint-disable-line @typescript-eslint/no-explicit-any
      const Encoder = lame.Mp3Encoder ?? lame.default?.Mp3Encoder;
      if (!Encoder) throw new Error('MP3 encoder failed to load.');
      const encoder = new Encoder(2, RATE, KBPS);

      const left = toInt16(mixed.getChannelData(0));
      const right = toInt16(mixed.numberOfChannels > 1 ? mixed.getChannelData(1) : mixed.getChannelData(0));
      const chunks: BlobPart[] = [];
      const block = 1152;
      for (let i = 0; i < left.length; i += block) {
        const out = encoder.encodeBuffer(left.subarray(i, i + block), right.subarray(i, i + block));
        if (out.length > 0) chunks.push(new Uint8Array(out));
        if (i % (block * 500) === 0) {
          setStatus(`Encoding preview… ${Math.round((i / left.length) * 100)}%`);
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      const tail = encoder.flush();
      if (tail.length > 0) chunks.push(new Uint8Array(tail));
      const mp3 = new Blob(chunks, { type: 'audio/mpeg' });

      setStatus('Uploading preview… 0%');
      const ticket = await getUploadUrl(beatId, 'preview_mp3', 'preview.mp3', mp3.size);
      if ('error' in ticket) throw new Error(ticket.error);
      await putFile(ticket.url, mp3, ticket.contentType, (pct) =>
        setStatus(`Uploading preview… ${pct}%`)
      );
      await recordUpload(beatId, 'preview_mp3', ticket.key, mp3.size, null);
      await saveWaveform(beatId, waveformPeaks(mixed));

      setStatus(null);
      router.refresh();
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Preview failed.');
    } finally {
      running.current = false;
    }
  }, [beatId, router]);

  // Build a new preview automatically right after a master upload.
  useEffect(() => {
    function onMaster(e: Event) {
      if ((e as CustomEvent).detail === beatId) generate();
    }
    window.addEventListener('master-uploaded', onMaster);
    return () => window.removeEventListener('master-uploaded', onMaster);
  }, [beatId, generate]);

  return (
    <div className={styles.fileSlot}>
      <div className={styles.fileInfo}>
        <div className={styles.fileLabel}>Tagged preview</div>
        <div className={styles.help}>
          What the public hears. Made automatically from your MP3 or WAV with your producer tag.
        </div>
        {previewUrl ? (
          <audio className={styles.audio} controls preload="none" src={previewUrl} />
        ) : (
          <div className={styles.fileMissing}>
            {hasMaster ? 'Not made yet.' : 'Upload the MP3 or WAV first.'}
          </div>
        )}
        {status && <div className={styles.fileCurrent} aria-live="polite">{status}</div>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      <div>
        <button
          type="button"
          className={styles.ghostButton}
          disabled={!hasMaster || status !== null}
          onClick={generate}
        >
          {status ? 'Working…' : previewUrl ? 'Remake' : 'Make preview'}
        </button>
      </div>
    </div>
  );
}
