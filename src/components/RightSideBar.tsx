"use client";
import React, { useState, useEffect } from "react";
import { Note, DownloadSimple, X, FileText, Brain, Sparkle } from "@phosphor-icons/react";
import { Settings as SettingsIcon } from "react-feather";
import styles from "./RightSideBar.module.css";
import "./ScrollStyles.css";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface RightSideBarProps {
  onOpenObsidian: () => void;
  onOpenMemory: () => void;
  onOpenPersonaAnalytics?: () => void;
  onOpenCreatorAlgorithm?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
  notes?: NoteItem[];
  onNoteSelect?: (note: NoteItem) => void;
  onNotesChange?: (notes: NoteItem[]) => void;
}

const RightSideBar: React.FC<RightSideBarProps> = ({
  onOpenObsidian,
  onOpenMemory,
  onOpenPersonaAnalytics = () => {},
  onOpenCreatorAlgorithm = () => {},
  onClose = () => {},
  isOpen = false,
  notes = [],
  onNoteSelect = () => {},
  onNotesChange = () => {}
}) => {
  console.log('RightSideBar rendering, isOpen:', isOpen);

  // Log notes received from parent
  useEffect(() => {
    console.log('RightSideBar received notes:', notes.length, 'notes');
  }, [notes]);



  const handleNoteClick = (note: NoteItem) => {
    console.log('Note clicked in RightSideBar:', note);
    onNoteSelect(note);
    onOpenObsidian();
  };

  const handleDeleteClick = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation(); // Prevent triggering the note click event

    console.log('RightSideBar handleDeleteClick called with noteId:', noteId);

    if (window.confirm('Are you sure you want to delete this note?')) {
      console.log('User confirmed deletion, making API call...');
      try {
        // Make the API call directly
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'DELETE',
          cache: 'no-cache'
        });

        console.log('Delete API response status:', response.status, 'ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('Delete API response data:', data);

          if (data.success) {
            console.log('Note deleted successfully from API');
            // Update the local notes list
            const updatedNotes = notes.filter(note => note.id !== noteId);
            console.log('Filtered notes:', notes.length, '->', updatedNotes.length);
            console.log('Calling onNotesChange with', updatedNotes.length, 'notes');
            onNotesChange(updatedNotes);
            console.log('Local notes list updated');
          } else {
            console.error('API returned error:', data.error);
            alert('Failed to delete note. Please try again.');
          }
        } else if (response.status === 404) {
          // Note is already deleted from database, treat as success
          console.log('Note not found (404), treating as successful deletion');
          const updatedNotes = notes.filter(note => note.id !== noteId);
          console.log('Filtered notes:', notes.length, '->', updatedNotes.length);
          onNotesChange(updatedNotes);
          console.log('Local notes list updated for already-deleted note');
        } else {
          console.error('HTTP Error:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          alert(`Failed to delete note: HTTP ${response.status} - ${response.statusText}`);
        }
      } catch (error) {
        console.error('Network error deleting note:', error);
        alert('Network error deleting note. Please check your connection.');
      }
    } else {
      console.log('User cancelled deletion');
    }
  };

  return (
    <div className={`${styles.rightSidebar} ${isOpen ? styles.open : ''}`}>
      {/* Mobile header with close button */}
      <div className={styles.mobileHeader}>
        <h3>Notes</h3>
        <button
          className={styles.mobileCloseButton}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.notesSection}>
        <div className={styles.desktopTitle}>
          <h3>Notes</h3>
        </div>
        <button
          className={styles.obsidianButton}
          onClick={() => {
            console.log('New Note button clicked');
            onOpenObsidian();
          }}
          aria-label="Create new note"
        >
          <span className={styles.buttonIcon}>📝</span>
          <span className={styles.buttonText}>New Note</span>
        </button>

        <button
          className={styles.obsidianButton}
          onClick={() => {
            console.log('Memory Graph button clicked');
            onOpenMemory();
          }}
          aria-label="Open memory visualization"
          style={{ marginTop: '8px' }}
        >
          <span className={styles.buttonIcon}><Brain size={16} /></span>
          <span className={styles.buttonText}>Memory Graph</span>
        </button>

        <button
          className={styles.obsidianButton}
          onClick={() => {
            console.log('Persona Analytics button clicked');
            onOpenPersonaAnalytics();
          }}
          aria-label="Open persona analytics"
          style={{ marginTop: '8px' }}
        >
          <span className={styles.buttonIcon}>📊</span>
          <span className={styles.buttonText}>Persona Analytics</span>
        </button>

        <button
          className={styles.obsidianButton}
          onClick={() => {
            console.log('Creator Algorithm button clicked');
            onOpenCreatorAlgorithm();
          }}
          aria-label="Open creator algorithm"
          style={{ marginTop: '8px' }}
        >
          <span className={styles.buttonIcon}><Sparkle size={16} /></span>
          <span className={styles.buttonText}>Creator Algorithm</span>
        </button>

        {notes.length > 0 ? (
          <div className="notesList">
            {/* Use a unique key that includes both id and title to ensure React updates properly */}
            {notes
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((note) => (
              <div
                key={`note-${note.id}`}
                className="noteItem"
                onClick={() => handleNoteClick(note)}
              >
                <div className="noteContent">
                  <FileText size={16} weight="fill" />
                  <span className="noteTitle">{note.title}</span>
                </div>
                <button
                  className="deleteNoteButton"
                  onClick={(e) => handleDeleteClick(e, note.id)}
                  aria-label="Delete note"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyNotes}>
            No saved notes yet
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSideBar;
