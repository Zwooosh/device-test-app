'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from './WebcamTest.module.scss';

const WebcamTest = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !deviceId) {
          setDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };

    getDevices();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, [deviceId]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setError(null);
      }
    } catch (err) {
      setError('Could not access camera. Please check permissions.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className={styles.container}>
      <h2>Webcam Test</h2>

      <div className={styles.selectWrapper}>
        <select
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className={styles.select}
          disabled={isActive}
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${devices.indexOf(device) + 1}`}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.videoWrapper}>
        <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
        {!isActive && <div className={styles.placeholder}>Camera Off</div>}
      </div>
      <div className={styles.controls}>
        {!isActive ? (
          <button onClick={startCamera} className={styles.button}>Start Camera</button>
        ) : (
          <button onClick={stopCamera} className={`${styles.button} ${styles.stop}`}>Stop Camera</button>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default WebcamTest;
