'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUploadUrl, recordUpload } from '../actions';
import { formatBytes, type FileKind } from '@/lib/beats';
import { putFile } from '@/lib/upload';
import styles from '../../../admin.module.css';

type Props = {
  beatId: string;
  kind: FileKind;
  label: string;
  hint: string;
  accept: string;
  currentName: string | null;
  currentSize: number | null;
  previewUrl?: string | null;
};

function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(file);
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

export default function FileSlot(props: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);
    try {
      const ticket = await getUploadUrl(props.beatId, props.kind, file.name, file.size);
      if ('error' in ticket) throw new Error(ticket.error);

      const duration =
        props.kind === 'master_mp3' || props.kind === 'master_wav' ? await readDuration(file) : null;

      await putFile(ticket.url, file, ticket.contentType, setProgress);
      await recordUpload(props.beatId, props.kind, ticket.key, file.size, duration);
      setProgress(null);
      router.refresh();
      if (props.kind === 'master_mp3' || props.kind === 'master_wav') {
        // Tell the preview maker to build a fresh tagged preview.
        window.dispatchEvent(new CustomEvent('master-uploaded', { detail: props.beatId }));
      }
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const uploading = progress !== null;

  return (
    <div className={styles.fileSlot}>
      {(props.kind === 'artwork' || props.kind === 'youtube_bg') && props.previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.previewUrl} alt="Current cover artwork" className={styles.artThumb} />
      )}
      <div className={styles.fileInfo}>
        <div className={styles.fileLabel}>{props.label}</div>
        <div className={styles.help}>{props.hint}</div>
        {props.currentName ? (
          <div className={styles.fileCurrent}>
            ✓ {props.currentName} {props.currentSize ? `(${formatBytes(props.currentSize)})` : ''}
          </div>
        ) : (
          <div className={styles.fileMissing}>Not uploaded yet</div>
        )}
        {uploading && (
          <div className={styles.progress} role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            <span className={styles.progressText}>{progress}%</span>
          </div>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={props.accept}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          type="button"
          className={styles.ghostButton}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : props.currentName ? 'Replace' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
