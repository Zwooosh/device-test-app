'use client';
import React, { useState, useRef, useEffect, createContext, useContext, ReactNode } from 'react';
import styles from './MicrophoneTest.module.scss';

interface MicrophoneContextType {
    isRecording: boolean;
    audioURL: string | null;
    error: string | null;
    deviceId: string;
    devices: MediaDeviceInfo[];
    setDeviceId: (id: string) => void;
    echoCancellation: boolean;
    setEchoCancellation: (val: boolean) => void;
    noiseSuppression: boolean;
    setNoiseSuppression: (val: boolean) => void;
    autoGainControl: boolean;
    setAutoGainControl: (val: boolean) => void;
    startRecording: () => void;
    stopRecording: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(undefined);

const useMicrophone = () => {
    const context = useContext(MicrophoneContext);
    if (!context) {
        throw new Error('useMicrophone must be used within a MicrophoneTest.Root');
    }
    return context;
};

const Root = ({ children, className }: { children: ReactNode; className?: string }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string>('');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    const [echoCancellation, setEchoCancellation] = useState(true);
    const [noiseSuppression, setNoiseSuppression] = useState(true);
    const [autoGainControl, setAutoGainControl] = useState(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioDevices = devices.filter(device => device.kind === 'audioinput');
                setDevices(audioDevices);
                if (audioDevices.length > 0 && !deviceId) {
                    setDeviceId(audioDevices[0].deviceId);
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

    const startRecording = async () => {
        try {
            const constraints = {
                audio: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    echoCancellation: echoCancellation,
                    noiseSuppression: noiseSuppression,
                    autoGainControl: autoGainControl
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Setup Recording
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);

                // Cleanup AudioContext and Stream
                if (sourceRef.current) {
                    sourceRef.current.disconnect();
                    sourceRef.current = null;
                }
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                    animationRef.current = null;
                }
                stream.getTracks().forEach(track => track.stop());

                // Clear canvas
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError(null);
            setAudioURL(null);

            // Setup Visualization
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            visualize();

        } catch (err) {
            setError('Could not access microphone. Please check permissions.');
            console.error(err);
        }
    };

    const visualize = () => {
        if (!analyserRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isRecording && !analyserRef.current) return; // Stop if not recording

            animationRef.current = requestAnimationFrame(draw);

            if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#d946ef');
                gradient.addColorStop(1, '#8b5cf6');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        }
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    return (
        <MicrophoneContext.Provider value={{
            isRecording, audioURL, error, deviceId, devices, setDeviceId,
            echoCancellation, setEchoCancellation,
            noiseSuppression, setNoiseSuppression,
            autoGainControl, setAutoGainControl,
            startRecording, stopRecording, canvasRef
        }}>
            <div className={`${styles.container} ${className || ''}`}>
                {children}
            </div>
        </MicrophoneContext.Provider>
    );
};

const DeviceSelect = () => {
    const { deviceId, setDeviceId, devices, isRecording } = useMicrophone();
    return (
        <div className={styles.selectWrapper}>
            <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className={styles.select}
                disabled={isRecording}
            >
                {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${devices.indexOf(device) + 1}`}
                    </option>
                ))}
            </select>
        </div>
    );
};

const Toggles = () => {
    const {
        echoCancellation, setEchoCancellation,
        noiseSuppression, setNoiseSuppression,
        autoGainControl, setAutoGainControl,
        isRecording
    } = useMicrophone();

    return (
        <div className={styles.toggles}>
            <label className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    checked={echoCancellation}
                    onChange={(e) => setEchoCancellation(e.target.checked)}
                    disabled={isRecording}
                    className={styles.checkbox}
                />
                Echo Cancellation
            </label>
            <label className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    checked={noiseSuppression}
                    onChange={(e) => setNoiseSuppression(e.target.checked)}
                    disabled={isRecording}
                    className={styles.checkbox}
                />
                Noise Suppression
            </label>
            <label className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    checked={autoGainControl}
                    onChange={(e) => setAutoGainControl(e.target.checked)}
                    disabled={isRecording}
                    className={styles.checkbox}
                />
                Auto Gain Control
            </label>
        </div>
    );
};

const Visualizer = () => {
    const { canvasRef } = useMicrophone();
    return (
        <div className={styles.visualizerContainer}>
            <canvas ref={canvasRef} width="300" height="60" className={styles.canvas}></canvas>
        </div>
    );
};

const Controls = () => {
    const { isRecording, startRecording, stopRecording } = useMicrophone();
    return (
        <div className={styles.controls}>
            {!isRecording ? (
                <button onClick={startRecording} className={styles.button}>Record</button>
            ) : (
                <button onClick={stopRecording} className={`${styles.button} ${styles.stop}`}>Stop</button>
            )}
        </div>
    );
};

const Playback = () => {
    const { audioURL } = useMicrophone();
    if (!audioURL) return null;
    return (
        <div className={styles.playback}>
            <audio controls src={audioURL} className={styles.audio} />
        </div>
    );
};

const ErrorMessage = () => {
    const { error } = useMicrophone();
    if (!error) return null;
    return <p className={styles.error}>{error}</p>;
};

const MicrophoneTest = Root as typeof Root & {
    DeviceSelect: typeof DeviceSelect;
    Toggles: typeof Toggles;
    Visualizer: typeof Visualizer;
    Controls: typeof Controls;
    Playback: typeof Playback;
    Error: typeof ErrorMessage;
};

MicrophoneTest.DeviceSelect = DeviceSelect;
MicrophoneTest.Toggles = Toggles;
MicrophoneTest.Visualizer = Visualizer;
MicrophoneTest.Controls = Controls;
MicrophoneTest.Playback = Playback;
MicrophoneTest.Error = ErrorMessage;

export { DeviceSelect, Toggles, Visualizer, Controls, Playback, ErrorMessage as Error };
export default MicrophoneTest;
