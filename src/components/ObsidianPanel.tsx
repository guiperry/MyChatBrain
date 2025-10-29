"use client";
import React, { useState, useEffect, useContext, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import { DownloadSimple, FloppyDisk, BookOpen } from "@phosphor-icons/react";
import styles from "./ObsidianPanel.module.css";
import "./ScrollStyles.css";
import { Context } from "../context/ContextProvider";

interface ObsidianPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  currentNoteId?: string;
  onSave?: (title: string, content: string, noteId?: string) => Promise<string | null>;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const ObsidianPanel: React.FC<ObsidianPanelProps> = ({
  isOpen,
  onClose,
  initialContent = '',
  currentNoteId,
  onSave = async () => null
}) => {
  const [markdownContent, setMarkdownContent] = useState(initialContent);
  const [noteId, setNoteId] = useState<string | undefined>(currentNoteId);
  const [obsidianVaultName, setObsidianVaultName] = useState<string>("MyVault");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const { theme } = useContext(Context);
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Load vault name from localStorage on client-side only
  useEffect(() => {
    // This code only runs in the browser, after component mounts
    const savedVaultName = localStorage.getItem('obsidianVaultName');
    if (savedVaultName) {
      setObsidianVaultName(savedVaultName);
    }
  }, []);

  // Function to extract title from markdown content
  const extractTitle = () => {
    const firstLine = markdownContent.split('\n')[0];
    if (firstLine.startsWith('# ')) {
      const title = firstLine.substring(2).trim();
      return title || 'Untitled Note';
    }
    return 'Untitled Note';
  };

  // Function to download the note as a markdown file
  const downloadMarkdown = () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return; // Exit early if not in browser
    }

    try {
      // Get title
      const title = extractTitle();

      // Create a sanitized filename - replace spaces with underscores but keep the case
      const filename = `${title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.md`;

      // Create a blob with the markdown content
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link and trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading markdown:', error);
      alert('Failed to download the note. Please try again.');
    }
  };

  // Helper function to open a URI with a protocol handler
  const openWithProtocolHandler = (uri: string) => {
    // Method 1: Use window.location (works in most browsers)
    try {
      window.location.href = uri;
      return true;
    } catch (error) {
      console.error('Error using window.location:', error);
    }

    // Method 2: Create a hidden iframe (works in some browsers)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      if (iframe.contentWindow) {
        iframe.contentWindow.location.href = uri;
      }
      setTimeout(() => document.body.removeChild(iframe), 1000);
      return true;
    } catch (error) {
      console.error('Error using iframe method:', error);
    }

    // Method 3: Traditional anchor method (may open a new tab)
    try {
      const a = document.createElement('a');
      a.href = uri;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (error) {
      console.error('Error using anchor method:', error);
      return false;
    }
  };

  // Function to save the note to Obsidian
  const saveToObsidian = async () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return; // Exit early if not in browser
    }

    try {
      // Get title
      const title = extractTitle();

      // Use the vault name from state
      if (!obsidianVaultName.trim()) {
        alert('Please set your Obsidian vault name in the settings first.');
        setShowSettings(true);
        return;
      }

      // Call the API to get the Obsidian URI
      const response = await fetch('/api/obsidian/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content: markdownContent,
          vaultName: obsidianVaultName
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to prepare Obsidian save: ${response.statusText}`);
      }

      const data = await response.json();

      console.log('Obsidian API response:', data);

      if (data.success) {
        // Check if we're in a desktop environment (Electron)
        // @ts-ignore - electron will be defined in desktop environment
        if (typeof window.electron !== 'undefined') {
          try {
            // In a desktop app, we would use Electron's shell or similar to open Obsidian directly
            // This is a placeholder for the desktop implementation
            // @ts-ignore - electron will be defined in desktop environment
            window.electron.openObsidian({
              vaultName: obsidianVaultName,
              fileName: data.fileName,
              content: data.content
            });
            alert('Note opened in Obsidian.');
          } catch (desktopError) {
            console.error('Desktop integration error:', desktopError);
            // Fallback to browser method if desktop method fails
            // Use our protocol handler helper
            openWithProtocolHandler(data.uri);

            alert('Note opened in Obsidian. If Obsidian was not already open, you may need to click the link again after Obsidian launches.');
          }
        } else {
          // Web browser environment - use our protocol handler helper
          openWithProtocolHandler(data.uri);

          alert('Note opened in Obsidian. If Obsidian was not already open, you may need to click the link again after Obsidian launches.');
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error saving to Obsidian:', error);
      alert(`Failed to save to Obsidian: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Function to save Obsidian settings
  const saveObsidianSettings = () => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('obsidianVaultName', obsidianVaultName);
      setShowSettings(false);
      alert('Obsidian settings saved!');
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Reset markdown content when initialContent or currentNoteId changes
  useEffect(() => {
    console.log('initialContent or currentNoteId changed:', {
      initialContent: initialContent?.substring(0, 100),
      currentNoteId
    });

    // Always update the markdown content when initialContent changes
    if (initialContent !== undefined) {
      console.log('Setting markdown content from initialContent');
      setMarkdownContent(initialContent);
    } else if (currentNoteId) {
      console.log('No initialContent provided but currentNoteId exists, fetching note content...');

      // Fetch the note content from the API
      const fetchNoteContent = async () => {
        try {
          const response = await fetch(`/api/notes/${currentNoteId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.note) {
              console.log('Fetched note content:', {
                id: data.note.id,
                title: data.note.title,
                contentLength: data.note.content?.length,
                contentPreview: data.note.content?.substring(0, 100)
              });
              setMarkdownContent(data.note.content || '');
            } else {
              console.error('Failed to fetch note content:', data.error);
            }
          } else {
            console.error('Failed to fetch note content, status:', response.status);
          }
        } catch (error) {
          console.error('Error fetching note content:', error);
        }
      };

      fetchNoteContent();
    } else {
      // No initialContent and no currentNoteId, set empty content
      console.log('No initialContent or currentNoteId, setting empty content');
      setMarkdownContent('# New Note\n\nStart writing here...');
    }
  }, [initialContent, currentNoteId]);

  useEffect(() => {
    setNoteId(currentNoteId);
  }, [currentNoteId]);

  // Function to save the note to the database
  const saveNoteContent = async () => {
    // Check if we're in a browser environment for alerts
    const isClient = typeof window !== 'undefined';

    try {
      console.log('Saving note content...');

      // Get title using the extract function
      const title = extractTitle();

      console.log('Extracted title:', title);
      console.log('Current noteId:', noteId);

      // Save the note and get the new ID
      console.log('Calling onSave function with content:', {
        title,
        contentLength: markdownContent.length,
        contentPreview: markdownContent.substring(0, 100),
        noteId
      });
      const savedNoteId = await onSave(title, markdownContent, noteId);
      console.log('Save result - noteId:', savedNoteId);

      // Update the note ID if it's a new note
      if (savedNoteId && (!noteId || noteId !== savedNoteId)) {
        console.log('Updating note ID from', noteId, 'to', savedNoteId);
        setNoteId(savedNoteId);
      }

      // Show success message (only in browser)
      if (isClient) {
        alert('Note saved successfully!');
      }

      return true;
    } catch (error) {
      console.error('Error saving note:', error);
      if (isClient) {
        alert('Failed to save note. See console for details.');
      }
      return false;
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('ObsidianPanel opened with:', {
        currentNoteId,
        initialContent,
        markdownContent
      });
    }
  }, [isOpen, currentNoteId, initialContent, markdownContent]);

  if (!isOpen) return null;

  return (
    <div 
      className={`${styles.modalOverlay} ${theme}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="obsidian-modal-title"
    >
      <div 
        ref={modalRef}
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.modalHeader}>
          <h2 id="obsidian-modal-title">My Notes</h2>
          <div className={styles.headerActions}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={styles.settingsButton}
              aria-label="Toggle Obsidian settings"
            >
              ⚙️
            </button>
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close notes panel"
            >
              &times;
            </button>
          </div>
        </div>

        {showSettings && (
          <div className={styles.settingsPanel}>
            <h3>Obsidian Settings</h3>
            <div className={styles.settingRow}>
              <label htmlFor="obsidianVaultName">Vault Name:</label>
              <input
                id="obsidianVaultName"
                type="text"
                value={obsidianVaultName}
                onChange={(e) => setObsidianVaultName(e.target.value)}
                placeholder="Enter your Obsidian vault name"
              />
            </div>
            <div className={styles.settingActions}>
              <button onClick={saveObsidianSettings}>Save Settings</button>
              <button onClick={() => setShowSettings(false)}>Cancel</button>
            </div>
          </div>
        )}
        <div className={styles.modalBody}>
          <div className={styles.editorContainer}>
            <textarea
              className={`${styles.markdownEditor} scrollablePanel`}
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              aria-label="Markdown editor"
            />
            <div className={`${styles.markdownPreview} scrollablePanel`}>
              <ReactMarkdown
                children={markdownContent}
                components={{
                  code({ node, inline, className, children, ...props }: CodeProps) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={dark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              />
            </div>
          </div>
          <div className={styles.buttonContainer}>
            <button
              className="downloadNoteButton"
              onClick={saveNoteContent}
              aria-label="Save Note"
            >
              <FloppyDisk size={16} />
              <span>Save Note</span>
            </button>
            <button
              className="downloadNoteButton"
              onClick={saveToObsidian}
              aria-label="Save to Obsidian"
            >
              <BookOpen size={16} />
              <span>Save to Obsidian</span>
            </button>
            <button
              className="downloadNoteButton"
              onClick={downloadMarkdown}
              aria-label="Download as Markdown"
            >
              <DownloadSimple size={16} />
              <span>Download as Markdown</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObsidianPanel;
