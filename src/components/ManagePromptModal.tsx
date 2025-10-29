"use client";
import React, { useState, useEffect } from "react";
import { X, Save, Bookmark } from "react-feather";
import styles from './LeftSidebar.module.css';

interface ManagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  promptId?: number; // Add promptId parameter for editing existing prompts
  onSavePrompt: (editedPrompt: string, saveToCollection: boolean, promptId?: number) => void;
}

const ManagePromptModal: React.FC<ManagePromptModalProps> = ({
  isOpen,
  onClose,
  prompt,
  promptId,
  onSavePrompt
}) => {
  const [editedPrompt, setEditedPrompt] = useState<string>(prompt);
  const [saveToCollection, setSaveToCollection] = useState<boolean>(false);

  // Update the edited prompt when the input prompt changes
  useEffect(() => {
    setEditedPrompt(prompt);
    // If we're editing an existing saved prompt, no need to save to collection again
    if (promptId) {
      setSaveToCollection(false);
    }
  }, [prompt, promptId]);

  const handleSave = () => {
    if (editedPrompt.trim()) {
      onSavePrompt(editedPrompt.trim(), saveToCollection, promptId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Manage Prompt</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.promptEditor}>
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className={styles.promptTextarea}
            placeholder="Edit your prompt..."
            rows={8}
          />
        </div>

        <div className={styles.saveOptions}>
          {!promptId && (
            <label className={styles.saveOptionLabel}>
              <input
                type="checkbox"
                checked={saveToCollection}
                onChange={() => setSaveToCollection(!saveToCollection)}
                className={styles.saveOptionCheckbox}
              />
              <Bookmark size={16} />
              <span>Save to Saved Prompts collection</span>
            </label>
          )}
          {promptId && (
            <div className={styles.editingPromptInfo}>
              <Bookmark size={16} />
              <span>Editing saved prompt (ID: {promptId})</span>
            </div>
          )}
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

export default ManagePromptModal;