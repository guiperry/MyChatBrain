"use client";
import React, { useContext, useState, useEffect, useRef } from "react";
import {
  Warning,
  Lightbulb,
  PencilLine,
  Code,
  ArrowLeft,
  DownloadSimple,
  PaperPlaneRight,
  Robot,
  CodeBlock
} from "@phosphor-icons/react";
import { User as UserIcon } from "@phosphor-icons/react/dist/ssr";
import { Context } from "@/context/ContextProvider";
import styles from "./ChatBody.module.css";
import rightSidebarStyles from "./RightSideBar.module.css";
import modelSelectStyles from "./ModelSelect.module.css";
import { Settings as SettingsIcon } from "react-feather";
import SettingsPanel from "./SettingsPanel";
import RightSideBar from "./RightSideBar";
import ChatLoadingIndicator from "./ChatLoadingIndicator";
import LLM from "@themaximalist/llm.js";

/**
 * Interface for LLM configuration options
 */
interface LLMConfig {
  model: string;
  service: "openai" | "anthropic" | "deepseek" | "gemini";
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, unknown>;
  systemPrompt?: string;
}

/**
 * Interface for chat message following OpenAI format
 */
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

interface AIBodyProps {}

const AIBody: React.FC<AIBodyProps> = () => {
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
  const [currentModel, setCurrentModel] = useState<'gemini' | 'modeldeployer'>('modeldeployer');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [waitingForResponse, setWaitingForResponse] = useState<boolean>(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    model: "deepseek",
    service: "deepseek",
    temperature: 0.7,
    maxTokens: 2000
  });
  const [streamContent, setStreamContent] = useState<string>("");
  const tokenCountRef = useRef<number>(0);
  const llmInstanceRef = useRef<LLM | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);



  /**
   * Initialize LLM instance with configuration
   */
  const initLLM = () => {
    if (!llmInstanceRef.current) {
      llmInstanceRef.current = new LLM({
        apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
        service: llmConfig.service,
        model: llmConfig.model,
        temperature: llmConfig.temperature,
        maxTokens: llmConfig.maxTokens
      });
    }
    return llmInstanceRef.current;
  };

  /**
   * Clean up streaming resources
   */
  const cleanupStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamContent("");
  };

  /**
   * Handle model configuration changes and notify parent component
   */
  const handleModelChange = (model: 'gemini' | 'modeldeployer') => {
    cleanupStreaming();
    setCurrentModel(model);

    // Update LLM config
    setLlmConfig(prev => ({
      ...prev,
      service: model === 'gemini' ? 'gemini' : 'deepseek',
      model: model === 'gemini' ? 'gemini-pro' : 'deepseek'
    }));

    // Dispatch a custom event to notify the parent component about the model change
    const event = new CustomEvent('model-change', {
      detail: { model }
    });
    window.dispatchEvent(event);
  };

  /**
   * Check if API key is available and set up event listeners
   */
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      setApiKeyMissing(true);
    } else {
      setApiKeyMissing(false);
    }

    // Add event listener for opening the settings panel
    const handleOpenSettings = () => setSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);

    return () => {
      cleanupStreaming();
      window.removeEventListener('open-settings', handleOpenSettings);
    };
  }, []);

  /**
   * Convert chat history to LLM.js message format
   */
  const convertToLLMMessages = (history: Array<{text: string, type: string}>): ChatMessage[] => {
    return history.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  /**
   * Handle streaming response chunks
   */
  const handleStreamChunk = (chunk: string) => {
    setStreamContent(prev => prev + chunk);
    setResult(prev => prev + chunk);
  };

  /**
   * Process stream completion
   */
  const handleStreamComplete = (finalContent: string) => {
    setChatHistory(prev => [
      ...prev,
      { text: finalContent, type: 'bot' }
    ]);
    setResult(finalContent);
    setFormattedResult(finalContent);
    setStreamContent("");
    setIsStreaming(false);
  };

  /**
   * Make one-off LLM request without chat history
   * @param prompt The user prompt
   * @param schema Optional JSON schema for structured response
   */
  const makeOneOffRequest = async (prompt: string, schema?: Record<string, unknown>): Promise<string> => {
    const llm = initLLM();
    try {
      const response = await llm.complete(prompt, {
        jsonSchema: schema,
        systemPrompt: llmConfig.systemPrompt
      });
      return typeof response === 'string' ? response : JSON.stringify(response);
    } catch (error) {
      console.error("Error in makeOneOffRequest:", error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  /**
   * Make streaming LLM request with chat history
   * @param prompt The user prompt
   * @param schema Optional JSON schema for structured response
   */
  const makeStreamingRequest = async (prompt: string, schema?: Record<string, unknown>) => {
    const llm = initLLM();
    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setStreamContent("");

    try {
      const messages: ChatMessage[] = [
        ...convertToLLMMessages(chatHistory),
        { role: 'user', content: prompt }
      ];

      await llm.chat(messages, {
        jsonSchema: schema,
        systemPrompt: llmConfig.systemPrompt,
        stream: true,
        stream_handler: handleStreamChunk,
        signal: abortControllerRef.current.signal
      });

      handleStreamComplete(streamContent);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error in makeStreamingRequest:", error);
        setResult(prev => prev + `\n\nError: ${error.message}`);
      }
      setIsStreaming(false);
    }
  };

  /**
   * Main function to process chat requests
   */
  const runChat = async (prompt: string): Promise<void> => {
    setLoading(true);
    setWaitingForResponse(true);
    setRecentPrompts(prompt);
    setDisplayResult(true);

    try {
      // Add user message to chat history immediately
      setChatHistory(prev => [...prev, { text: prompt, type: 'user' }]);

      if (shouldCreateNewSession && !currentChatId) {
        console.log("Creating new chat session");
      } else {
        setShouldCreateNewSession(false);
      }

      // Choose between one-off or streaming based on config
      if (llmConfig.jsonSchema) {
        // For structured responses, use one-off with schema
        const response = await makeOneOffRequest(prompt, llmConfig.jsonSchema);
        setChatHistory(prev => [...prev, { text: response, type: 'bot' }]);
        setResult(response);
        setFormattedResult(response);
      } else {
        // For normal chat, use streaming
        await makeStreamingRequest(prompt);
      }

    } catch (error: any) {
      console.error("Error in runChat:", error);
      setResult(prev => prev + `\n\nError: ${error.message}`);
      setChatHistory(prev => [
        ...prev,
        { text: `Error: ${error.message}`, type: 'bot' }
      ]);
    } finally {
      setLoading(false);
      setWaitingForResponse(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!input.trim()) return;

    submit(input);
    await runChat(input);
    setInput("");
  };

  const handleDownload = async (type: string): Promise<void> => {
    if (!result) return;

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: result,
          type: type
        })
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${await response.text()}`);
      }
    } catch (error: any) {
      console.error("Download error:", error);
      setResult(prev => prev + "\n\nError downloading file: " + error.message);
    }
  };

  return (
    <div key="aiBody" className={styles.aiContainer}>
      <div className={`${styles.container} ${rightSidebarStyles.withSidebar}`} style={{ zIndex: 30, maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>My-Chat-Brain</h1>
        <div className={styles.headerActions}>
          <select
            value={currentModel}
            onChange={(e) => handleModelChange(e.target.value as 'gemini' | 'modeldeployer')}
            className={modelSelectStyles.modelSelect}
          >
            <option value="gemini">Gemini (Free)</option>
            <option value="modeldeployer">ModelDeployer (Pro)</option>
          </select>
          <button
            className={styles.settingsButton}
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      <div className={styles.chatContainer} style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
        {apiKeyMissing && (
          <div className={styles.apiKeyWarning}>
            <Warning size={24} />
            <p>API key not configured. Please set your DeepSeek API key in settings.</p>
          </div>
        )}

        {!displayResult ? (
          <div className={styles.welcomeContainer}>
            <div className={styles.welcomeHeader}>
              <h2>Welcome to My-Chat-Brain AI</h2>
              <p>Your AI-powered conversational assistant</p>
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
                    startNewChat();
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
                    startNewChat();
                    const prompt = "Write a Python function to find prime numbers";
                    setInput(prompt);
                    submit(prompt);
                    runChat(prompt);
                  }}
                >
                  <Code size={20} />
                  <p>Write a Python function to find prime numbers</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.resultContainer} style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className={styles.chatMessages}>
              {chatHistory.map((message, index) => (
                <div 
                  key={index} 
                  className={`${styles.chatMessage} ${
                    message.type === 'user' ? styles.userMessage : styles.botMessage
                  }`}
                >
                  <div className={styles.messageAvatar}>
                    {message.type === 'user' ? (
                      <UserIcon size={24} />
                    ) : (
                      <Robot size={24} />
                    )}
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className={styles.chatMessage}>
                  <div className={styles.messageAvatar}>
                    <Robot size={24} />
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>
                      {streamContent}
                      <span className={styles.streamingCursor}>|</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Show loading indicator when waiting for response but not streaming */}
              {(loading || waitingForResponse) && !isStreaming && (
                <ChatLoadingIndicator message="Waiting for response..." />
              )}
            </div>

            {result && (
              <div className={styles.downloadOptions}>
                <button 
                  className={styles.downloadButton}
                  onClick={() => handleDownload('markdown')}
                  aria-label="Download as Markdown"
                >
                  <DownloadSimple size={16} />
                  <span>MD</span>
                </button>
                <button 
                  className={styles.downloadButton}
                  onClick={() => handleDownload('text')}
                  aria-label="Download as Text"
                >
                  <DownloadSimple size={16} />
                  <span>TXT</span>
                </button>
                <button 
                  className={styles.downloadButton}
                  onClick={() => handleDownload('json')}
                  aria-label="Download as JSON"
                  disabled={!llmConfig.jsonSchema}
                >
                  <DownloadSimple size={16} />
                  <span>JSON</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <form className={styles.inputForm} onSubmit={handleSubmit}>
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
            disabled={isStreaming}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={loading || !input.trim() || isStreaming}
            aria-label="Send message"
          >
            {isStreaming ? (
              <div className={styles.spinner}></div>
            ) : (
              <PaperPlaneRight size={20} />
            )}
          </button>
          {isStreaming && (
            <button
              type="button"
              className={styles.stopButton}
              onClick={cleanupStreaming}
              aria-label="Stop generation"
            >
              Stop
            </button>
          )}
        </div>
      </form>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
    </div>
  );
};

export default AIBody;
