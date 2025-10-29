"use client";
import React, { useState, useEffect } from "react";
import { X, Trash2, Edit, Copy } from "react-feather";
import styles from './LeftSidebar.module.css';

interface SavedPromptsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedPrompts: {id: number, content: string, title: string | null}[];
  onDeletePrompt: (index: number) => void;
  onEditPrompt: (prompt: {id: number, content: string}, index: number) => void;
  onUsePrompt: (prompt: {id: number, content: string}) => void;
}

const SavedPromptsPanel: React.FC<SavedPromptsPanelProps> = ({ 
  isOpen, 
  onClose,
  savedPrompts,
  onDeletePrompt,
  onEditPrompt,
  onUsePrompt
}) => {
  if (!isOpen) return null;

  return (
    <div className={`${styles.settingsPanel} ${isOpen ? styles.settingsOpen : styles.settingsClosed}`}>
      <div className={styles.settingsContent}>
        <div className={styles.settingsHeader}>
          <div className={styles.settingsHeaderContent}>
            <h2>Saved Prompts</h2>
            <div
              className={styles.closeButton}
              onClick={onClose}
              role="button"
              tabIndex={0}
              aria-label="Close saved prompts"
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
        </div>
        
        <div className={styles.savedPromptsContainer}>
          {savedPrompts.length === 0 ? (
            <div className={styles.noSavedPrompts}>
              <p>You don't have any saved prompts yet.</p>
              <p>Edit a recent prompt and check "Save to Saved Prompts collection" to add one.</p>
            </div>
          ) : (
            <div className={styles.savedPromptsList}>
              {savedPrompts.map((prompt, index) => (
                <div key={prompt.id} className={styles.savedPromptItem}>
                  <div className={styles.savedPromptText}>
                    {prompt.title && <div className={styles.savedPromptTitle}>{prompt.title}</div>}
                    {prompt.content.length > 100 ? `${prompt.content.slice(0, 100)}...` : prompt.content}
                  </div>
                  <div className={styles.savedPromptActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => onUsePrompt(prompt)}
                      aria-label="Use prompt"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => onEditPrompt(prompt, index)}
                      aria-label="Edit prompt"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => onDeletePrompt(index)}
                      aria-label="Delete prompt"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPromptsPanel;