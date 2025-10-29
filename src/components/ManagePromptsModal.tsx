"use client";
import React, { useState } from "react";
import { X, Save, Trash2 } from "react-feather";
import styles from './LeftSidebar.module.css';

interface ManagePromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: string[];
  onSavePrompts: (prompts: string[]) => void;
}

const ManagePromptsModal: React.FC<ManagePromptsModalProps> = ({ 
  isOpen, 
  onClose,
  prompts,
  onSavePrompts
}) => {
  const [editedPrompts, setEditedPrompts] = useState<string[]>(prompts);
  const [newPrompt, setNewPrompt] = useState("");

  const handleAddPrompt = () => {
    if (newPrompt.trim()) {
      setEditedPrompts([...editedPrompts, newPrompt.trim()]);
      setNewPrompt("");
    }
  };

  const handleRemovePrompt = (index: number) => {
    setEditedPrompts(editedPrompts.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSavePrompts(editedPrompts);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Manage Recent Prompts</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.promptList}>
          {editedPrompts.map((prompt, index) => (
            <div key={index} className={styles.promptItem}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  const updated = [...editedPrompts];
                  updated[index] = e.target.value;
                  setEditedPrompts(updated);
                }}
                className={styles.promptInput}
              />
              <button
                className={styles.deletePromptButton}
                onClick={() => handleRemovePrompt(index)}
                aria-label="Delete prompt"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.addPromptContainer}>
          <input
            type="text"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Add new prompt..."
            className={styles.promptInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddPrompt();
            }}
          />
          <button
            className={styles.addPromptButton}
            onClick={handleAddPrompt}
            aria-label="Add prompt"
          >
            Add
          </button>
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagePromptsModal;