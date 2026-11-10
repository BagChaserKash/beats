import styles from './page.module.css';

export default function BeatsHome() {
  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <h1 className={styles.wordmark}>
          <span>BAGCHASER</span>
          <span className={styles.kash}>KASH</span>
        </h1>
        <div className={styles.rule} aria-hidden="true" />
        <p className={styles.lead}>The beat store is being built.</p>
        <p className={styles.sub}>
          Original instrumentals, licensed directly from the producer. MP3, WAV,
          and trackout licenses open soon.
        </p>
        <a className={styles.back} href="https://bagchaserkash.com">
          Back to bagchaserkash.com
        </a>
      </div>
    </main>
  );
}
