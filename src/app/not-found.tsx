"use client";
import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function NotFound() {
  return (
    <div className={styles.notFoundContainer || 'not-found-container'}>
      <div className={styles.notFoundContent || 'not-found-content'}>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link href="/">
          <button className={styles.backButton || 'back-button'}>
            Go back to home
          </button>
        </Link>
      </div>
    </div>
  );
}