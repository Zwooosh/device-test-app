import React from 'react';
import WebcamTest from '@/components/WebcamTest/WebcamTest';
import MicrophoneTest from '@/components/MicrophoneTest/MicrophoneTest';
import SpeedTest from '@/components/SpeedTest/SpeedTest';
import SpeakerTest from '@/components/SpeakerTest/SpeakerTest';
import styles from './page.module.scss';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1>Device Test Lab</h1>
        <p>Test your webcam, microphone, internet speed, and speakers.</p>
      </div>

      <div className={styles.grid}>
        <WebcamTest />
        <MicrophoneTest />
        <SpeedTest />
        <SpeakerTest />
      </div>
    </main>
  );
}
