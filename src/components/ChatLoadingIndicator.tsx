import React from 'react';
import styles from './LoadingIndicator.module.css';

interface ChatLoadingIndicatorProps {
  message?: string;
}

const ChatLoadingIndicator: React.FC<ChatLoadingIndicatorProps> = ({ 
  message = "Thinking..." 
}) => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <div className={styles.loadingText}>{message}</div>
    </div>
  );
};

export default ChatLoadingIndicator;