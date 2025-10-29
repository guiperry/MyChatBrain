// src/components/LangfuseUI.tsx
"use client";
import React, { useState, useEffect, useContext } from 'react';
import { Langfuse } from 'langfuse';
import { Context } from '@/context/ContextProvider';
import { BarChart2 } from 'react-feather';
import styles from './LangfuseUI.module.css';

const LangfuseUI = () => {
  const [langfuseUrl, setLangfuseUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  // No longer using persistentMemory from context

  useEffect(() => {
    setLangfuseUrl(process.env.NEXT_PUBLIC_LANGFUSE_HOST || null);
    const publicKey = process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.NEXT_PUBLIC_LANGFUSE_SECRET_KEY;
    const host = process.env.NEXT_PUBLIC_LANGFUSE_HOST;

    if (publicKey && secretKey && host) {
      try {
        new Langfuse({
          publicKey: publicKey,
          secretKey: secretKey,
        });
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing Langfuse", error);
        setIsInitialized(false);
      }
    } else {
      setIsInitialized(false);
    }
  }, []);

  const openLangfuseTab = () => {
    if (langfuseUrl) {
      window.open(langfuseUrl, '_blank');
    } else {
      alert("Langfuse URL not found. Please check your settings.");
    }
  };

  if (!isInitialized) return null;

  return (
    <div
      onClick={openLangfuseTab}
      className={styles.langfuseButton}
      role="button"
      tabIndex={0}
      aria-label="Open Langfuse Dashboard"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLangfuseTab();
        }
      }}
    >
      <BarChart2 size={18} className={styles.icon} />
      <span className={styles.label}>Langfuse Dashboard</span>
    </div>
  );
};

export default LangfuseUI;