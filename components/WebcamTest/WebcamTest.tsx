'use client';
import React, { useState, useRef, useEffect, createContext, useContext, ReactNode } from 'react';
import styles from './WebcamTest.module.scss';

interface WebcamContextType {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  error: string | null;
  deviceId: string;
  devices: MediaDeviceInfo[];
  setDeviceId: (id: string) => void;
  startCamera: () => void;
  stopCamera: () => void;
}

const WebcamContext = createContext<WebcamContextType | undefined>(undefined);

const useWebcam = () => {
  const context = useContext(WebcamContext);
  if (!context) {
    throw new Error('useWebcam must be used within a WebcamTest.Root');
  }
  return context;
};

const Root = ({ children, className }: { children: ReactNode; className?: string }) => {
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
    <WebcamContext.Provider value={{ videoRef, isActive, error, deviceId, devices, setDeviceId, startCamera, stopCamera }}>
      <div className={`${styles.container} ${className || ''}`}>
        {children}
      </div>
    </WebcamContext.Provider>
  );
};

const DeviceSelect = () => {
  const { deviceId, setDeviceId, devices, isActive } = useWebcam();
  return (
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
  );
};

const Video = () => {
  const { videoRef, isActive } = useWebcam();
  return (
    <div className={styles.videoWrapper}>
      <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
      {!isActive && <div className={styles.placeholder}>Camera Off</div>}
    </div>
  );
};

const Controls = () => {
  const { isActive, startCamera, stopCamera } = useWebcam();
  return (
    <div className={styles.controls}>
      {!isActive ? (
        <button onClick={startCamera} className={styles.button}>Start Camera</button>
      ) : (
        <button onClick={stopCamera} className={`${styles.button} ${styles.stop}`}>Stop Camera</button>
      )}
    </div>
  );
};

const ErrorMessage = () => {
  const { error } = useWebcam();
  if (!error) return null;
  return <p className={styles.error}>{error}</p>;
};

const WebcamTest = Root as typeof Root & {
  DeviceSelect: typeof DeviceSelect;
  Video: typeof Video;
  Controls: typeof Controls;
  Error: typeof ErrorMessage;
};

WebcamTest.DeviceSelect = DeviceSelect;
WebcamTest.Video = Video;
WebcamTest.Controls = Controls;
WebcamTest.Error = ErrorMessage;

export { DeviceSelect, Video, Controls, ErrorMessage as Error };
export default WebcamTest;
