"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '../components/LeftSidebar';
import GeminiBody from '../components/GeminiBody';
import AIBody from '../components/AIBody';
import RightSideBar from '../components/RightSideBar';
import ObsidianPanel from '../components/ObsidianPanel';
import MemoryPanel from '../components/MemoryPanel';
import styles from './page.module.css';

export default function Home() {
  // State to track if the app is ready
  const [isAppReady, setIsAppReady] = useState(false);

  // Check if the app is ready and hide the initial loader when it is
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    console.log('Home component mounted');

    // Set up global error handler
    window.onerror = function(message, source, lineno, colno, error) {
      console.error('Global error caught:', { message, source, lineno, colno, error });
      return false;
    };

    const initializeApp = async (attempt = 1) => {
      try {
        console.log(`Initialization attempt ${attempt}`);

        // Check authentication
        console.log('Checking authentication...');
        const authResponse = await fetch('/api/auth/me');
        if (!authResponse.ok) {
          console.log('Authentication check failed, redirecting to login');
          router.push('/login');
          return;
        }
        console.log('Authentication check passed');

        // Check app health
        console.log('Checking app health...');
        const healthResponse = await fetch('/api/health');
        if (!healthResponse.ok) {
          console.log(`Health check failed (attempt ${attempt}), retrying...`);
          setTimeout(() => initializeApp(attempt + 1), 1000);
          return;
        }
        console.log('Health check passed');

        // App is ready
        console.log('App initialization complete');
        if (isMounted) {
          setIsAppReady(true);
          const loader = document.getElementById('initial-loader');
          if (loader) {
            console.log('Found initial loader, hiding it');
            loader.classList.add('hidden');
            setTimeout(() => {
              loader.style.display = 'none';
              console.log('Initial loader hidden');
            }, 300);
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setTimeout(() => initializeApp(attempt + 1), 1000);
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      isMounted = false;
      window.onerror = null;
    };
  }, []);

  const [isObsidianOpen, setIsObsidianOpen] = useState(false);
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'modeldeployer'>('gemini');
  const [notes, setNotes] = useState<Array<{id: string; title: string; content: string; createdAt: Date}>>([]);

  // Custom setNotes with logging
  const setNotesWithLogging = useCallback((newNotes: Array<{id: string; title: string; content: string; createdAt: Date}> | ((prevNotes: Array<{id: string; title: string; content: string; createdAt: Date}>) => Array<{id: string; title: string; content: string; createdAt: Date}>)) => {
    console.log('setNotes called with:', typeof newNotes === 'function' ? 'function' : `${newNotes.length} notes`);
    setNotes(newNotes);
  }, []);
  const [currentNote, setCurrentNote] = useState<{id: string; title: string; content: string; createdAt: Date} | null>(null);

  // Function to load notes from the database
  const loadNotes = async () => {
    try {
      console.log('Loading notes from database...');
      const response = await fetch('/api/notes/load', { cache: 'no-cache' });
      console.log('Load response status:', response.status, 'ok:', response.ok);
      if (!response.ok) {
        throw new Error(`Failed to load notes: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Load response data:', data);
      if (data.success && Array.isArray(data.notes)) {
        // Define the note type
        interface DbNote {
          id: number;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
          user_id?: number;
        }

        // Convert database notes to the format expected by the UI
        let formattedNotes: Array<{id: string; title: string; content: string; createdAt: Date}> = [];
        try {
          formattedNotes = data.notes.map((note: DbNote) => {
            console.log('Processing note:', note.id, note.title);
            return {
              id: note.id.toString(),
              title: note.title || 'Untitled',
              content: note.content || '',
              createdAt: new Date(note.created_at)
            };
          });
          console.log(`Mapped ${formattedNotes.length} notes`);
        } catch (mapError) {
          console.error('Error mapping notes:', mapError);
          throw mapError;
        }

        console.log(`Loaded ${formattedNotes.length} notes from database`);

        // Remove duplicates by ID
        const uniqueNotes = Array.from(
          new Map(formattedNotes.map((note: {id: string; title: string; content: string; createdAt: Date}) => [note.id, note])).values()
        ) as Array<{id: string; title: string; content: string; createdAt: Date}>;

        if (uniqueNotes.length !== formattedNotes.length) {
          console.log(`Filtered out ${formattedNotes.length - uniqueNotes.length} duplicate notes`);
        }

        console.log('Setting notes state with', uniqueNotes.length, 'notes');
        // Set the notes state
        setNotes(uniqueNotes);
        return uniqueNotes;
      } else {
        console.error('Invalid response data:', data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
    return [];
  };

  // Listen for model change events from child components
  useEffect(() => {
    const handleModelChange = (event: CustomEvent) => {
      if (event.detail && event.detail.model) {
        setSelectedModel(event.detail.model);
      }
    };

    window.addEventListener('model-change', handleModelChange as EventListener);

    return () => {
      window.removeEventListener('model-change', handleModelChange as EventListener);
    };
  }, []);

  // Load notes from the database on component mount
  useEffect(() => {
    const initialLoad = async () => {
      console.log('Initial notes load');
      await loadNotes();
    };

    initialLoad();

    // Disable periodic refresh to avoid overriding manual state updates
    // const refreshInterval = setInterval(() => {
    //   console.log('Refreshing notes list');
    //   loadNotes();
    // }, 30000); // Refresh every 30 seconds

    // return () => {
    //   clearInterval(refreshInterval);
    // };
  }, []);



  return (
    <div className={styles.container}>
      <LeftSidebar />
      <div className={styles.mainContent}>
        {selectedModel === 'gemini' ? (
          <GeminiBody currentModel={selectedModel} />
        ) : (
          <AIBody />
        )}
      </div>
      <RightSideBar
        onOpenObsidian={() => {
          setCurrentNote(null);
          setIsObsidianOpen(true);
        }}
        onOpenMemory={() => {
          setIsMemoryPanelOpen(true);
        }}
        notes={notes}
        onNoteSelect={async (note) => {
          console.log('Note selected:', {
            id: note.id,
            title: note.title,
            contentLength: note.content?.length,
            contentPreview: note.content?.substring(0, 100)
          });

          try {
            // Fetch the full note content from the API to ensure we have the latest version
            const response = await fetch(`/api/notes/${note.id}`);

            if (response.ok) {
              const data = await response.json();

              if (data.success && data.note) {
                console.log('Fetched full note content:', {
                  id: data.note.id,
                  title: data.note.title,
                  contentLength: data.note.content?.length,
                  contentPreview: data.note.content?.substring(0, 100)
                });

                // Create a fresh note object with the fetched data
                const freshNote = {
                  id: data.note.id.toString(),
                  title: data.note.title,
                  content: data.note.content,
                  createdAt: new Date(data.note.created_at)
                };

                // Set the current note and open the panel
                setCurrentNote(freshNote);
                setIsObsidianOpen(true);
              } else {
                console.error('Failed to fetch note content:', data.error);
                alert('Failed to load note content. Please try again.');
              }
            } else {
              console.error('Failed to fetch note, status:', response.status);
              alert('Failed to load note. Please try again.');
            }
          } catch (error) {
            console.error('Error fetching note:', error);
            alert('An error occurred while loading the note. Please try again.');
          }
        }}
        onNotesChange={setNotesWithLogging}
      />
      {/* Debug logging removed */}
      
      <ObsidianPanel
        isOpen={isObsidianOpen}
        onClose={() => setIsObsidianOpen(false)}
        initialContent={currentNote?.content}
        currentNoteId={currentNote?.id}
        onSave={async (title, content, noteId) => {
          console.log('ObsidianPanel onSave called with:', {
            title,
            noteId,
            contentLength: content?.length,
            contentPreview: content?.substring(0, 100)
          });

          try {
            // Save the note to the database
            console.log('Sending save request to API...');
            const response = await fetch('/api/notes/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ title, content, noteId })
            });

            if (!response.ok) {
              throw new Error(`Failed to save note: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API response data:', data);

            if (data.success) {
              // Get the saved note ID
              const savedNoteId = data.noteId;

              // Create a new note object with the updated data
              const updatedNote = {
                id: savedNoteId.toString(),
                title,
                content,
                createdAt: new Date()
              };

              // Update the current note with the new data
              setCurrentNote(updatedNote);

              // Update the notes list directly
              if (noteId) {
                // Update existing note in the list
                setNotes(prevNotes => {
                  // Check if the note already exists in the list
                  const noteExists = prevNotes.some(note => note.id === noteId);

                  if (noteExists) {
                    // Replace the existing note
                    return prevNotes.map(note =>
                      note.id === noteId ? updatedNote : note
                    );
                  } else {
                    // Add the note to the beginning of the list
                    return [updatedNote, ...prevNotes];
                  }
                });
              } else {
                // Add new note to the beginning of the list
                setNotes(prevNotes => [updatedNote, ...prevNotes]);
              }

              // Return the saved note ID
              return savedNoteId;
            } else {
              throw new Error(data.error || 'Failed to save note');
            }
          } catch (error) {
            console.error('Error saving note:', error);
            alert(`Error saving note: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
          }
        }}
      />

      <MemoryPanel
        isOpen={isMemoryPanelOpen}
        onClose={() => setIsMemoryPanelOpen(false)}
      />
    </div>
  );
}
