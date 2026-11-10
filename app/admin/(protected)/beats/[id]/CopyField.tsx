'use client';

import { useState } from 'react';
import styles from '../../../admin.module.css';

export default function CopyField({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.copyField}>
      <div className={styles.copyHead}>
        <span className={styles.label}>{label}</span>
        <button type="button" className={styles.ghostButton} onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      {multiline ? (
        <textarea className={`${styles.input} ${styles.copyArea}`} readOnly value={value} rows={12} />
      ) : (
        <input className={styles.input} readOnly value={value} />
      )}
    </div>
  );
}
