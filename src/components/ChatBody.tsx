"use client";
import React, { useContext, useState, useEffect, useRef } from "react";
import {
  Warning,
  Lightbulb,
  PencilLine,
  Code,
  ArrowLeft,
  PaperPlaneRight,
  Robot,
  CodeBlock,
  Note
} from "@phosphor-icons/react";
import { User as UserIcon } from "@phosphor-icons/react/dist/ssr";
import { Context } from "@/context/ContextProvider";
import styles from "./ChatBody.module.css";
import { Settings as SettingsIcon } from "react-feather";
import RightSideBar from "./RightSideBar";
import rightSidebarStyles from "./RightSideBar.module.css";
import modelSelectStyles from "./ModelSelect.module.css";
import ObsidianPanel from "./ObsidianPanel";
import MemoryPanel from "./MemoryPanel";
import ChatLoadingIndicator from "./ChatLoadingIndicator";
import SettingsPanel from "./SettingsPanel";
import "./CustomStyles.css";

interface ChatBodyProps {
  currentModel?: 'gemini' | 'modeldeployer';
}

const MODEL_NAME = process.env.NEXT_PUBLIC_MODEL_NAME || "@cf/openai/gpt-oss-120b";

interface ChatResponse {
  response: string;
}

const ChatBody: React.FC<ChatBodyProps> = ({ currentModel: externalModel }) => {
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const {
    submit,
    setDisplayResult,
    displayResult,
    recentPrompts,
    setRecentPrompts,
    formattedResult,
    setFormattedResult,
    result,
    setResult,
    input,
    setInput,
    loading,
    setLoading,
    chatHistory,
    setChatHistory,
    startNewChat,
    currentChatId,
    setCurrentChatId,
    shouldCreateNewSession,
    setShouldCreateNewSession
  } = useContext(Context);

  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [currentModel, setCurrentModel] = useState<'gemini' | 'modeldeployer'>(externalModel || 'gemini');
  const [obsidianOpen, setObsidianOpen] = useState<boolean>(false);
  const [memoryOpen, setMemoryOpen] = useState<boolean>(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState<boolean>(false);
  const [noteContent, setNoteContent] = useState<string>('');
  const [notes, setNotes] = useState<Array<{id: string; title: string; content: string; createdAt: Date}>>([]);
  const [waitingForResponse, setWaitingForResponse] = useState<boolean>(false);
  const tokenCountRef = useRef<number>(0);

  // Update currentModel when externalModel changes
  useEffect(() => {
    if (externalModel) {
      setCurrentModel(externalModel);
    }
  }, [externalModel]);

  // Debug effect to log chat history changes
  useEffect(() => {
    console.log('GeminiBody: Chat history changed', chatHistory.length, 'messages');
    console.log('GeminiBody: displayResult =', displayResult);
    if (chatHistory.length > 0) {
      console.log('GeminiBody: First message:', chatHistory[0]);
      console.log('GeminiBody: Last message:', chatHistory[chatHistory.length - 1]);
    }
  }, [chatHistory, displayResult]);

  // Load saved notes from the database
  const loadNotes = async () => {
    try {
      const response = await fetch('/api/notes/load');
      if (!response.ok) {
        throw new Error(`Failed to load notes: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.notes)) {
        // Convert database notes to the format expected by the UI
        const formattedNotes = data.notes.map((note: any) => ({
          id: note.id.toString(),
          title: note.title,
          content: note.content,
          createdAt: new Date(note.created_at)
        }));

        setNotes(formattedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Function to save a note to the database
  const saveNote = async (title: string, content: string, noteId?: string) => {
    try {
      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          noteId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save note: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        // Reload notes to get the updated list
        loadNotes();
        return data.noteId;
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
    return null;
  };

  // Function to handle adding content to notes
  const handleNotate = async (content: string) => {
    // Extract first line or first 50 characters for title
    const titleLine = content.split('\n')[0];
    const title = titleLine.length > 50 ? titleLine.substring(0, 47) + '...' : titleLine;

    // Format the note with a title
    const formattedNote = `# ${title}\n\n${content}`;

    // Save the note to the database
    await saveNote(title, formattedNote);

    // Open the note in the editor
    setNoteContent(formattedNote);
    setObsidianOpen(true);
  };

  // Function to handle selecting a note
  const handleNoteSelect = (note: {id: string; title: string; content: string; createdAt: Date}) => {
    setNoteContent(note.content);
    setObsidianOpen(true);
  };

  // Function to handle opening/closing the Obsidian panel
  const toggleObsidianPanel = () => {
    setObsidianOpen(!obsidianOpen);
    // When opening with no content, create a new empty note
    if (!obsidianOpen && !noteContent) {
      setNoteContent('# New Note\n\nStart writing here...');
    }
  };

  // Function to handle opening/closing the Memory panel
  const toggleMemoryPanel = () => {
    setMemoryOpen(!memoryOpen);
  };

  const handleModelChange = (model: 'gemini' | 'modeldeployer') => {
    setCurrentModel(model);

    // Dispatch a custom event to notify the parent component about the model change
    const event = new CustomEvent('model-change', {
      detail: { model }
    });
    window.dispatchEvent(event);
  };

  // Check if API key is available
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const modelName = process.env.NEXT_PUBLIC_MODEL_NAME;

    if (!apiKey || apiKey.trim() === '' || !modelName || modelName.trim() === '') {
      setApiKeyMissing(true);
    } else {
      setApiKeyMissing(false);
    }

    // Add event listener for opening the settings panel
    const handleOpenSettings = () => setSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);

    return () => {
      window.removeEventListener('open-settings', handleOpenSettings);
    };
  }, []);

  // Helper function to get chat response from chat.knirv.com
  const getChatResponse = async (prompt: string): Promise<string> => {
    try {
      const chatResponse: Response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: prompt })
      });

      const chatJson: ChatResponse = await chatResponse.json();

      // Even if the response is not OK, we'll use the response message
      // which contains helpful instructions for the user
      return chatJson.response;
    } catch (error) {
      console.error("Error in getChatResponse:", error);
      return `
# Connection Error

There was a problem connecting to the chat service at chat.knirv.com. Please check:

1. Your internet connection
2. That the chat service is available

Try refreshing the page or updating your settings.
      `;
    }
  };

  // Helper function to get DeepSeek response
  const getDeepSeekResponse = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/deepseek', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      return data.response || data.message || "No response from DeepSeek";
    } catch (error) {
      console.error("Error in getDeepSeekResponse:", error);
      return `
# DeepSeek Connection Error

There was a problem connecting to the DeepSeek API. Please check:
1. Your internet connection
2. That your API key is correctly set in the settings
3. That the DeepSeek API service is available

Try refreshing the page or updating your settings.
      `;
    }
  }

  // Main function to process chat requests
  const runChat = async (prompt: string): Promise<void> => {
    console.log("runChat called with", prompt);
    setLoading(true);
    setWaitingForResponse(true);
    setRecentPrompts(prompt);
    setDisplayResult(true);

    try {
      // Get response from chat service
      const chatResponse = await getChatResponse(prompt);

      // Log the current chat ID and session creation flag
      console.log("Before updating chat history:", {
        currentChatId,
        shouldCreateNewSession,
        chatHistoryLength: chatHistory.length
      });

      // Only create a new session if we explicitly need to (via shouldCreateNewSession)
      // and we don't already have a currentChatId
      if (shouldCreateNewSession && !currentChatId) {
        console.log("Explicitly creating a new session");
      } else {
        // We're adding to an existing chat, make sure we don't create a new session
        console.log("Using existing session - will not create new session");
        setShouldCreateNewSession(false);
      }

      // Add to chat history
      setChatHistory((prev) => [
        ...prev,
        { text: prompt, type: 'user' },
        { text: chatResponse, type: 'bot' }
      ]);

      setResult(chatResponse);
      setFormattedResult(chatResponse);

      // Log after updating
      console.log("After updating chat history:", {
        currentChatId,
        shouldCreateNewSession,
        chatHistoryLength: chatHistory.length + 2 // +2 for the messages we just added
      });

    } catch (error: any) {
      console.error("Error in runChat:", error);

      setResult(`
# Error

There was a problem processing your request:

${error.message}

Please try again or check your settings.
      `);

      // Add to chat history
      setChatHistory((prev) => [
        ...prev,
        { text: prompt, type: 'user' },
        { text: "Error: " + error.message, type: 'bot' }
      ]);
    } finally {
      setLoading(false);
      setWaitingForResponse(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!input.trim()) {
      return; // Don't submit empty input
    }

    // Only create new session if explicitly requested (like via startNewChat)
    if (!currentChatId && !shouldCreateNewSession) {
      console.log("No existing session ID - will use current session if available");
    }

    submit(input);
    await runChat(input);
    setInput(""); // Clear input after submission
  };

  // This function has been replaced by handleNotate

useEffect(() => {
  // This useEffect hook will run whenever chatHistory changes
  console.log('GeminiBody - chatHistory updated:', chatHistory);
  
  // Scroll to bottom when new messages are added
  if (chatMessagesEndRef.current && chatHistory.length > 0) {
    chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}, [chatHistory]);


  // Ensure styles exist before using them (fix for HMR error)
  if (!styles || !rightSidebarStyles) {
    return null; // Return null while styles are loading
  }

  return (
    <div key="aiBody" className={styles?.aiContainer}>
      {/* AI Body content */}
      <div className={`${styles?.container} ${rightSidebarStyles?.withSidebar}`} style={{ zIndex: 30 }}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>My-Chat-Brain</h1>
        </div>

      <div className={styles.chatContainer} style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
        {apiKeyMissing && (
          <div className={styles.apiKeyWarning} style={{ justifyContent: 'center' }}>
            <Warning size={24} />
            <p>
              API key not configured. Please set your Gemini API key in the settings.
            </p>
            <p style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>
              Note: Chat is currently using the default cloudflare service at chat.knirv.com
            </p>
          </div>
        )}

        {!displayResult ? (
          <div className={styles.welcomeContainer}>
            <div className={styles.welcomeHeader}>
              <h2>Welcome to My-Chat-Brain AI</h2>
              <p>Your AI-powered note taking assistant</p>
            </div>

            <div className={styles.examplePrompts}>
              <h3>
                <Lightbulb size={20} />
                Example prompts
              </h3>
              <div className={styles.promptGrid}>
                <div
                  className={styles.promptCard}
                  onClick={() => {
                    // This is a new chat, so we should create a new session
                    startNewChat(); // This will reset chat history and set shouldCreateNewSession to true

                    // Then run the chat with the example prompt
                    const prompt = "Explain quantum computing in simple terms";
                    setInput(prompt);
                    submit(prompt);
                    runChat(prompt);
                  }}
                >
                  <PencilLine size={20} />
                  <p>Explain quantum computing in simple terms</p>
                </div>
                <div
                  className={styles.promptCard}
                  onClick={() => {
                    // This is a new chat, so we should create a new session
                    startNewChat(); // This will reset chat history and set shouldCreateNewSession to true

                    // Then run the chat with the example prompt
                    const prompt = "Write a Python function to find prime numbers";
                    setInput(prompt);
                    submit(prompt);
                    runChat(prompt);
                  }}
                >
                  <Code size={20} />
                  <p>Write a Python function to find prime numbers</p>
                </div>
                <div
                  className={styles.promptCard}
                  onClick={() => {
                    // This is a new chat, so we should create a new session
                    startNewChat(); // This will reset chat history and set shouldCreateNewSession to true

                    // Then run the chat with the example prompt
                    const prompt = "Compare and contrast React, Vue, and Angular";
                    setInput(prompt);
                    submit(prompt);
                    runChat(prompt);
                  }}
                >
                  <CodeBlock size={20} />
                  <p>Compare and contrast React, Vue, and Angular</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.resultContainer} style={{ maxWidth: '1500px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className={styles.chatMessages}>
              {chatHistory.length === 0 ? (
                <div className={styles.noMessages}>
                  <p>No messages to display. This is unusual - please check the console for errors.</p>
                </div>
              ) : (
                chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`${styles.chatMessage} ${
                      message.type === 'user' ? styles.userMessage : styles.botMessage
                    } chatMessageContainer`}
                  >
                    <div className={styles.messageAvatar}>
                      {message.type === 'user' ? (
                        <UserIcon size={24} />
                      ) : (
                        <Robot size={24} />
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>
                      {message.type === 'bot' && (
                        <div className="messageActions">
                          <button
                            className="notateButton"
                            onClick={() => handleNotate(message.text)}
                            aria-label="Save as note"
                            title="Save as note"
                          >
                            <Note size={18} />
                          </button>
                        </div>
                      )}
                    <div className={styles.messageContent}>
                      <div className={styles.messageText}>
                        {message.text}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Show loading indicator when waiting for response */}
              {(loading || waitingForResponse) && (
                <ChatLoadingIndicator message="Waiting for response..." />
              )}
            </div>

            {result && (
              <div className={styles.downloadOptions}>
                <button
                  className={styles.downloadButton}
                  onClick={() => handleNotate(result)}
                  aria-label="Add to Notes"
                >
                  <PencilLine size={16} />
                  <span>Notate</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <form className={styles.inputForm} style={{ zIndex: 40 }} onSubmit={handleSubmit}>
        <div className={styles.inputContainer}>
          <textarea
            className={styles.inputField}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  handleSubmit(e as any);
                }
              }
            }}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <PaperPlaneRight size={20} />
          </button>
        </div>
      </form>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ObsidianPanel
        isOpen={obsidianOpen}
        onClose={() => setObsidianOpen(false)}
        initialContent={noteContent}
        onSave={saveNote}
      />
      <MemoryPanel
        isOpen={memoryOpen}
        onClose={() => setMemoryOpen(false)}
      />
      <SettingsPanel
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
      />
    </div>
    </div>
  );
};

export default ChatBody;
