'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTagUploadUrl, recordTag } from './actions';
import { putFile } from '@/lib/upload';
import styles from '../../admin.module.css';

export default function TagUploader({
  currentName,
  currentUrl,
}: {
  currentName: string | null;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);
    try {
      const ticket = await getTagUploadUrl(file.name, file.size);
      if ('error' in ticket) throw new Error(ticket.error);
      await putFile(ticket.url, file, ticket.contentType, setProgress);
      await recordTag(ticket.key, file.size, file.name);
      setProgress(null);
      router.refresh();
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={styles.fileSlot}>
      <div className={styles.fileInfo}>
        <div className={styles.fileLabel}>Producer tag</div>
        <div className={styles.help}>
          Your voice tag (MP3 or WAV), already mixed to the volume you want. It plays over every preview.
        </div>
        {currentName ? (
          <>
            <div className={styles.fileCurrent}>✓ {currentName}</div>
            {currentUrl && <audio className={styles.audio} controls preload="none" src={currentUrl} />}
          </>
        ) : (
          <div className={styles.fileMissing}>Not uploaded yet</div>
        )}
        {progress !== null && <div className={styles.fileCurrent}>Uploading… {progress}%</div>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          type="button"
          className={styles.ghostButton}
          disabled={progress !== null}
          onClick={() => inputRef.current?.click()}
        >
          {currentName ? 'Replace' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
