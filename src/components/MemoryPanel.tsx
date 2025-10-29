"use client";

import React, { useState } from 'react';
import styles from './MemoryPanel.module.css';
import dynamic from 'next/dynamic';

// Import with dynamic import to avoid TypeScript error
const MemoryGraph = dynamic(() => import('./MemoryGraph').then(mod => mod.default || mod), {
  ssr: false,
  loading: () => <div>Loading graph...</div>
});

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'stats'>('graph');

  return (
    <div className={`${styles.container} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Memory Visualization</h2>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>
      <div className={styles.content}>
        <div className={styles.tabs}>
          <div
            className={`${styles.tab} ${activeTab === 'graph' ? styles.active : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            Graph View
          </div>
          <div
            className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </div>
        </div>
        <div className={styles.graphContainer}>
          {activeTab === 'graph' && <MemoryGraph />}
          {activeTab === 'stats' && (
            <div style={{ padding: '20px' }}>
              <h3>Memory Statistics</h3>
              <p>Coming soon: Statistics about your memory graph</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryPanel;