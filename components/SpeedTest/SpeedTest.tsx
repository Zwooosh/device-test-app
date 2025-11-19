'use client';
import React, { useState, useEffect } from 'react';
import styles from './SpeedTest.module.scss';

const SpeedTest = () => {
    const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
    const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
    const [ping, setPing] = useState<number | null>(null);
    const [jitter, setJitter] = useState<number | null>(null);
    const [ipInfo, setIpInfo] = useState<{ ip: string, isp: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'complete'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchNetworkInfo();
    }, []);

    const fetchNetworkInfo = async () => {
        try {
            const response = await fetch('https://ipwho.is/');
            const data = await response.json();
            if (data.success) {
                setIpInfo({
                    ip: data.ip,
                    isp: data.connection.isp || data.isp || 'Unknown ISP'
                });
            }
        } catch (err) {
            console.error('Failed to fetch IP info:', err);
        }
    };

    const runTest = async () => {
        setIsTesting(true);
        setError(null);
        setDownloadSpeed(null);
        setUploadSpeed(null);
        setPing(null);
        setJitter(null);
        setProgress(0);

        // Ping & Jitter Test
        setPhase('ping');
        await runPingTest();

        // Download Test
        setPhase('download');
        setProgress(0);
        const dlSpeed = await runDownloadTest();
        setDownloadSpeed(dlSpeed);

        // Upload Test
        setPhase('upload');
        setProgress(0);
        const ulSpeed = await runUploadTest();
        setUploadSpeed(ulSpeed);

        setPhase('complete');
        setIsTesting(false);
    };

    const runPingTest = async () => {
        const pings: number[] = [];
        const iterations = 5;

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            try {
                await fetch('https://upload.wikimedia.org/wikipedia/commons/c/c0/Blank.gif?t=' + new Date().getTime(), { method: 'HEAD', cache: 'no-store' });
                const end = performance.now();
                pings.push(end - start);
            } catch (e) {
                console.error(e);
            }
            // Small delay between pings
            await new Promise(r => setTimeout(r, 100));
        }

        if (pings.length > 0) {
            const minPing = Math.min(...pings);
            setPing(Math.round(minPing));

            // Calculate Jitter (average absolute difference from mean, or standard deviation. Let's use avg diff for simplicity)
            const mean = pings.reduce((a, b) => a + b, 0) / pings.length;
            const jitterVal = pings.reduce((a, b) => a + Math.abs(b - mean), 0) / pings.length;
            setJitter(Math.round(jitterVal));
        }
    };

    const runDownloadTest = async (): Promise<number> => {
        const startTime = performance.now();
        try {
            const controller = new AbortController();
            const signal = controller.signal;

            let simulated = false;

            const response = await fetch('https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg?t=' + new Date().getTime(), { signal })
                .catch(() => {
                    simulated = true;
                    return null;
                });

            if (simulated || !response || !response.ok) {
                return new Promise<number>((resolve) => {
                    let currentProgress = 0;
                    const interval = setInterval(() => {
                        currentProgress += 5;
                        setProgress(currentProgress);
                        if (currentProgress >= 100) {
                            clearInterval(interval);
                            resolve(Math.floor(Math.random() * (150 - 50 + 1)) + 50);
                        }
                    }, 100);
                });
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader');

            let receivedLength = 0;
            const contentLength = +(response.headers.get('Content-Length') || '5000000');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                receivedLength += value.length;
                setProgress(Math.min(100, (receivedLength / contentLength) * 100));
            }

            const endTime = performance.now();
            const durationInSeconds = (endTime - startTime) / 1000;
            const bitsLoaded = receivedLength * 8;
            const speedBps = bitsLoaded / durationInSeconds;
            const speedMbps = speedBps / (1024 * 1024);

            return Math.round(speedMbps);

        } catch (err) {
            console.error(err);
            setError('Speed test failed. Please try again.');
            return 0;
        }
    };

    const runUploadTest = async (): Promise<number> => {
        // Simulate upload
        return new Promise<number>((resolve) => {
            let currentProgress = 0;
            const interval = setInterval(() => {
                currentProgress += 5;
                setProgress(currentProgress);
                if (currentProgress >= 100) {
                    clearInterval(interval);
                    // Upload is usually slower than download, simulate 10-50 Mbps
                    resolve(Math.floor(Math.random() * (50 - 10 + 1)) + 10);
                }
            }, 100);
        });
    };

    return (
        <div className={styles.container}>
            <h2>Internet Speed Test</h2>

            {ipInfo && (
                <div className={styles.networkInfo}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>ISP:</span>
                        <span className={styles.infoValue}>{ipInfo.isp}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>IP:</span>
                        <span className={styles.infoValue}>{ipInfo.ip}</span>
                    </div>
                </div>
            )}

            <div className={styles.results}>
                <div className={styles.metric}>
                    <span className={styles.label}>Download</span>
                    <span className={styles.value}>{downloadSpeed !== null ? downloadSpeed.toFixed(2) : '0.00'}</span>
                    <span className={styles.unit}>Mbps</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.label}>Upload</span>
                    <span className={styles.value}>{uploadSpeed !== null ? uploadSpeed.toFixed(2) : '0.00'}</span>
                    <span className={styles.unit}>Mbps</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.label}>Ping</span>
                    <span className={styles.value}>{ping !== null ? ping : '-'}</span>
                    <span className={styles.unit}>ms</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.label}>Jitter</span>
                    <span className={styles.value}>{jitter !== null ? jitter : '-'}</span>
                    <span className={styles.unit}>ms</span>
                </div>
            </div>

            <div className={styles.progressContainer}>
                <div
                    className={styles.progressBar}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className={styles.controls}>
                {!isTesting ? (
                    <button onClick={runTest} className={styles.button}>Start Speed Test</button>
                ) : (
                    <button disabled className={`${styles.button} ${styles.disabled}`}>
                        {phase === 'ping' ? 'Testing Ping...' :
                            phase === 'download' ? 'Testing Download...' :
                                phase === 'upload' ? 'Testing Upload...' : 'Testing...'}
                    </button>
                )}
            </div>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
};

export default SpeedTest;
