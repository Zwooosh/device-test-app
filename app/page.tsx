import React from 'react';
import WebcamTest, {
  DeviceSelect as WebcamDeviceSelect,
  Video as WebcamVideo,
  Controls as WebcamControls,
  Error as WebcamError
} from '@/components/WebcamTest/WebcamTest';
import MicrophoneTest, {
  DeviceSelect as MicDeviceSelect,
  Toggles as MicToggles,
  Visualizer as MicVisualizer,
  Controls as MicControls,
  Playback as MicPlayback,
  Error as MicError
} from '@/components/MicrophoneTest/MicrophoneTest';
import SpeedTest, {
  NetworkInfo as SpeedNetworkInfo,
  Results as SpeedResults,
  Progress as SpeedProgress,
  Controls as SpeedControls,
  Error as SpeedError
} from '@/components/SpeedTest/SpeedTest';
import SpeakerTest, {
  DeviceSelect as SpeakerDeviceSelect,
  Visualizer as SpeakerVisualizer,
  Controls as SpeakerControls,
  Volume as SpeakerVolume
} from '@/components/SpeakerTest/SpeakerTest';
import styles from './page.module.scss';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1>Device Test Lab</h1>
        <p>Test your webcam, microphone, internet speed, and speakers.</p>
      </div>

      <div className={styles.grid}>
        <WebcamTest>
          <h2>Webcam Test</h2>
          <WebcamDeviceSelect />
          <WebcamVideo />
          <WebcamControls />
          <WebcamError />
        </WebcamTest>
        <MicrophoneTest>
          <h2>Microphone Test</h2>
          <div style={{ width: '100%', maxWidth: '300px', marginBottom: '1rem' }}>
            <MicDeviceSelect />
            <MicToggles />
          </div>
          <MicVisualizer />
          <MicControls />
          <MicPlayback />
          <MicError />
        </MicrophoneTest>
        <SpeedTest>
          <h2>Internet Speed Test</h2>
          <SpeedNetworkInfo />
          <SpeedResults />
          <SpeedProgress />
          <SpeedControls />
          <SpeedError />
        </SpeedTest>
        <SpeakerTest>
          <h2>Speaker Test</h2>
          <SpeakerDeviceSelect />
          <SpeakerVisualizer />
          <div className={styles.controls}>
            <SpeakerControls />
            <SpeakerVolume />
          </div>
        </SpeakerTest>
      </div>
    </main>
  );
}
