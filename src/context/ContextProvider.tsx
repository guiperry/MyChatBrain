"use client";
import React, { createContext, useState, useRef, Dispatch, SetStateAction, useEffect } from "react";
import { ChatHistoryItem } from "@/types";

interface ContextProps {
  theme: "light" | "dark";
  toggle: () => void;
  submit: (e: string) => void;
  setInput: Dispatch<SetStateAction<string>>;
  input: string;
  result: string;
  loading: boolean;
  displayResult: boolean;
  chatHistory: ChatHistoryItem[];
  setChatHistory: Dispatch<SetStateAction<ChatHistoryItem[]>>;
  recentPrompts: string;
  setRecentPrompts: Dispatch<SetStateAction<string>>;
  setPrevPrompts: React.Dispatch<React.SetStateAction<string[]>>;
  prevPrompts: string[];
  formattedResult: string;
  setFormattedResult: React.Dispatch<React.SetStateAction<string>>;
  setResult: React.Dispatch<React.SetStateAction<string>>;
  setDisplayResult: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  saveChat: () => Promise<void>;
  startNewChat: () => void;
  currentChatId: string | null;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
  shouldCreateNewSession: boolean;
  setShouldCreateNewSession: React.Dispatch<React.SetStateAction<boolean>>;
  chatModified: boolean;
  setChatModified: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Context = createContext<ContextProps>({} as ContextProps);

interface ProviderProps {
  children: React.ReactNode;
}

export const ContextProvider: React.FC<ProviderProps> = ({ children }: ProviderProps) => {
  console.log('ContextProvider initializing');

  const [input, setInput] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [recentPrompts, setRecentPrompts] = useState<string>("");
  const [displayResult, setDisplayResult] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const tokenCountRef = useRef<number>(0);
  const [prevPrompts, setPrevPrompts] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [formattedResult, setFormattedResult] = useState<string>("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Log when the provider is mounted
  useEffect(() => {
    console.log('ContextProvider mounted');

    return () => {
      console.log('ContextProvider unmounted');
    };
  }, []);

  const toggle = (): void => {
    setTheme(theme === "light" ? "dark" : "light");
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', (theme === 'light' ? 'dark' : 'light'))
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
        setTheme(storedTheme as "light" | "dark");
      }
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.className = theme;
    }
  }, [theme]);

  // Track if the chat has been modified since the last save
  const [chatModified, setChatModified] = useState<boolean>(false);

  // Flag to control whether we should create a new session or update an existing one
  const [shouldCreateNewSession, setShouldCreateNewSession] = useState<boolean>(true);

  // Update the chatModified flag when chat history changes
  useEffect(() => {
    console.log(`Chat history updated (${chatHistory.length} messages), currentChatId: ${currentChatId}`);
    console.log('Chat history content:', JSON.stringify(chatHistory));

    if (chatHistory.length > 0) {
      setChatModified(true);
    }
  }, [chatHistory, currentChatId]);

  // Auto-save chat when needed
  useEffect(() => {
    // Only save if there are messages and the chat has been modified
    if (chatHistory.length > 0 && chatModified) {
      console.log(`Scheduling save (${chatHistory.length} messages), currentChatId: ${currentChatId}`);

      // Use a debounce to avoid too many save requests
      const saveTimeout = setTimeout(() => {
        console.log(`Executing scheduled save, currentChatId: ${currentChatId}`);
        saveChat();
        // Reset the modified flag after saving
        setChatModified(false);
      }, 2000); // Wait 2 seconds after changes before saving

      // Clean up the timeout if the component unmounts or chatHistory changes again
      return () => clearTimeout(saveTimeout);
    }
  }, [chatModified, chatHistory, currentChatId]);

  const saveChat = async (): Promise<void> => {
    console.log('saveChat called', {
      chatHistoryLength: chatHistory.length,
      currentChatId,
      shouldCreateNewSession
    });

    if (chatHistory.length === 0) {
      console.log('No chat history to save, returning early');
      return;
    }

    try {
      // Create a title from the first message, or use 'New Chat' if no messages
      const chatTitle = chatHistory[0]?.text
        ? (chatHistory[0].text.length > 50
            ? chatHistory[0].text.substring(0, 47) + '...'
            : chatHistory[0].text)
        : 'New Chat';

      console.log('Using chat title:', chatTitle);

      // Two-step process: First create/ensure session exists, then add messages
      let sessionId: number;

      // Step 1: Create a new session or use existing one
      if (!currentChatId || shouldCreateNewSession) {
        console.log(`Creating new session with title: ${chatTitle}`);

        try {
          // Create a new session
          const createResponse = await fetch('/api/createSession', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: chatTitle
            }),
          });

          if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error('Session creation failed:', errorData);
            throw new Error(`Failed to create session: ${errorData.error || createResponse.statusText}`);
          }

          const createData = await createResponse.json();
          sessionId = createData.sessionId;

          // Update state with the new session ID
          setCurrentChatId(sessionId.toString());
          setShouldCreateNewSession(false);

          console.log(`New session created with ID: ${sessionId}`);
        } catch (error) {
          console.error('Error creating session:', error);
          // Try again with a delay
          setTimeout(() => {
            setChatModified(true);
          }, 2000);
          return; // Exit early
        }
      } else {
        // Use existing session
        sessionId = parseInt(currentChatId);
        console.log(`Using existing session with ID: ${sessionId}`);
      }

      // Step 2: Add messages to the session
      console.log(`Adding ${chatHistory.length} messages to session ${sessionId}`);

      try {
        const messagesResponse = await fetch('/api/addMessages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId,
            messages: chatHistory
          }),
        });

        if (!messagesResponse.ok) {
          const errorData = await messagesResponse.json();
          console.error('Message addition failed:', errorData);
          throw new Error(`Failed to add messages: ${errorData.error || messagesResponse.statusText}`);
        }

        const messageData = await messagesResponse.json();
        console.log(`Successfully saved ${messageData.count} messages to session ${sessionId}`);

        // Reset the modified flag since we've successfully saved
        setChatModified(false);
      } catch (error) {
        console.error('Error adding messages:', error);
        // If there was an error adding messages, try again later
        setTimeout(() => {
          setChatModified(true);
        }, 2000);
      }

    } catch (error) {
      console.error('Failed to save chat:', error);

      // If there was an error, try creating a new session next time
      setCurrentChatId(null);
      setShouldCreateNewSession(true);

      // Mark as modified so we'll try again
      setTimeout(() => {
        console.log('Will retry save with new session...');
        setChatModified(true);
      }, 1000);
    }
  };

  const startNewChat = (): void => {
    console.log("Starting new chat");
    setChatHistory([]);
    setResult("");
    setFormattedResult("");
    setInput("");
    setDisplayResult(false);
    // Reset the chat modified flag
    setChatModified(false);
    // Set currentChatId to null to indicate this is a new chat
    setCurrentChatId(null);
    // Set flag to create a new session on next save
    setShouldCreateNewSession(true);

    console.log("New chat started, shouldCreateNewSession set to true");
  };

  const submit = async (prompt: string) => {
    if (prompt) {
      setPrevPrompts((prev) => [...prev, prompt]);
    }
  };

  const contextValue: ContextProps = {
    theme,
    toggle,
    submit,
    setInput,
    input,
    result,
    loading,
    displayResult,
    chatHistory,
    setChatHistory,
    recentPrompts,
    setRecentPrompts,
    setPrevPrompts,
    prevPrompts,
    formattedResult,
    setFormattedResult,
    setResult,
    setDisplayResult,
    setLoading,
    saveChat,
    startNewChat,
    currentChatId,
    setCurrentChatId,
    shouldCreateNewSession,
    setShouldCreateNewSession,
    chatModified,
    setChatModified
  };

  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;
