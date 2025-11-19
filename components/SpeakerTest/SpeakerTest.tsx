'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from './SpeakerTest.module.scss';

const SpeakerTest = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [deviceId, setDeviceId] = useState<string>('');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    useEffect(() => {
        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
                setDevices(audioOutputDevices);
                if (audioOutputDevices.length > 0 && !deviceId) {
                    setDeviceId(audioOutputDevices[0].deviceId);
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

    useEffect(() => {
        return () => {
            stopSound();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const initAudio = async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioContextRef.current && deviceId) {
            // Try to set sink ID if supported
            try {
                // @ts-ignore - setSinkId is experimental
                if (typeof audioContextRef.current.setSinkId === 'function') {
                    // @ts-ignore
                    await audioContextRef.current.setSinkId(deviceId);
                }
            } catch (err) {
                console.warn("Error setting sink ID:", err);
            }
        }
    };

    const startSound = async () => {
        await initAudio();
        if (audioContextRef.current) {
            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4

            gainNode.gain.setValueAtTime(volume, ctx.currentTime);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start();

            oscillatorRef.current = oscillator;
            gainNodeRef.current = gainNode;
            setIsPlaying(true);
        }
    };

    const stopSound = () => {
        if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
            oscillatorRef.current = null;
        }
        if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
            gainNodeRef.current = null;
        }
        setIsPlaying(false);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (gainNodeRef.current && audioContextRef.current) {
            gainNodeRef.current.gain.setValueAtTime(newVolume, audioContextRef.current.currentTime);
        }
    };

    return (
        <div className={styles.container}>
            <h2>Speaker Test</h2>

            <div className={styles.selectWrapper}>
                <select
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className={styles.select}
                    disabled={isPlaying}
                >
                    {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Speaker ${devices.indexOf(device) + 1}`}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.iconWrapper}>
                <svg className={`${styles.icon} ${isPlaying ? styles.playing : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" className={styles.waves}></path>
                </svg>
            </div>
            <div className={styles.controls}>
                <button onClick={isPlaying ? stopSound : startSound} className={styles.button}>
                    {isPlaying ? 'Stop Sound' : 'Play Test Sound'}
                </button>
                <div className={styles.volumeControl}>
                    <label htmlFor="volume">Volume</label>
                    <div className={styles.sliderWrapper}>
                        <input
                            type="range"
                            id="volume"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className={styles.slider}
                        />
                        <span className={styles.volumeValue}>{Math.round(volume * 100)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeakerTest;
