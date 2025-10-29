"use client";
import React from 'react';
import { X, ExternalLink, GitHub, Book, MessageCircle, Coffee } from 'react-feather';
import styles from './HelpPanel.module.css';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.helpPanelOverlay}>
      <div className={styles.helpPanel}>
        <div className={styles.helpHeader}>
          <h2>Help & Resources</h2>
          <div 
            className={styles.closeButton}
            onClick={onClose}
            role="button"
            tabIndex={0}
            aria-label="Close help panel"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose();
              }
            }}
          >
            <X size={20} />
          </div>
        </div>

        <div className={styles.helpContent}>
          <section className={styles.helpSection}>
            <h3>Getting Started</h3>
            <p>
              This is a Gemini-powered chat application that allows you to interact with Google's Gemini AI model.
              You can ask questions, analyze GitHub repositories, and more.
            </p>
          </section>

          <section className={styles.helpSection}>
            <h3>Key Features</h3>
            <ul className={styles.featureList}>
              <li>
                <span className={styles.featureName}>Chat with Gemini:</span> 
                Ask questions and get AI-powered responses
              </li>
              <li>
                <span className={styles.featureName}>GitHub Analysis:</span> 
                Paste a GitHub repository URL to analyze its code
              </li>
              <li>
                <span className={styles.featureName}>Persistent Memory:</span> 
                Enable to maintain context between sessions
              </li>
              <li>
                <span className={styles.featureName}>Theme Toggle:</span> 
                Switch between light and dark modes
              </li>
            </ul>
          </section>

          <section className={styles.helpSection}>
            <h3>External Resources</h3>
            <div className={styles.resourceLinks}>
              <a 
                href="https://github.com/Inc-Line/gemini-clone-extended-TS" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.resourceLink}
              >
                <GitHub size={18} />
                <span>GitHub Repository</span>
                <ExternalLink size={14} />
              </a>
              
              <a 
                href="https://ai.google.dev/docs/gemini_api_overview" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.resourceLink}
              >
                <Book size={18} />
                <span>Gemini API Documentation</span>
                <ExternalLink size={14} />
              </a>
              
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.resourceLink}
              >
                <MessageCircle size={18} />
                <span>Get Gemini API Key</span>
                <ExternalLink size={14} />
              </a>
              
              <a 
                href="https://github.com/sponsors/Inc-Line" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.resourceLink}
              >
                <Coffee size={18} />
                <span>Support the Project</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;