'use client';
import React from 'react';
import styles from './GlobalControls.module.scss';

const GlobalControls = () => {
    const requestPermissions = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            // Permissions granted, reload to ensure all components pick it up cleanly if needed,
            // or just let the user know. For now, just triggering the prompt is enough.
            alert('Permissions granted! You can now use the tests.');
        } catch (err) {
            console.error('Error requesting permissions:', err);
            alert('Could not get permissions. Please allow access in your browser settings.');
        }
    };

    const refreshPage = () => {
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <button onClick={requestPermissions} className={`${styles.button} ${styles.primary}`}>
                Request Permissions
            </button>
            <button onClick={refreshPage} className={`${styles.button} ${styles.secondary}`}>
                Refresh Page
            </button>
        </div>
    );
};

export default GlobalControls;
