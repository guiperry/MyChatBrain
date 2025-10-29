"use client";
import React, { useContext, useState, useEffect } from "react";
import {
  Plus,
  ChatCircle,
  Compass,
  Lightbulb,
  Code,
  GithubLogo,
} from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";
import { Context } from "@/context/ContextProvider";
import LangfuseUI from "./LangfuseUI";
import HelpPanel from "./HelpPanel";
import ChatList from "./ChatList";
import ActivityPanel from "./ActivityPanel";
import ManagePromptsModal from "./ManagePromptsModal";
import ManagePromptModal from "./ManagePromptModal";
import SavedPromptsPanel from "./SavedPromptsPanel";
import styles from './LeftSidebar.module.css';
import { RiUser3Fill } from "@react-icons/all-files/ri/RiUser3Fill";
import { Menu, HelpCircle, Activity, X, Bookmark } from "react-feather";

interface LeftSidebarProps {}

const LeftSidebar: React.FC<LeftSidebarProps> = () => {
  const [isOpen, setIsOpen] = useState(true);
  const {
    setDisplayResult,
    setInput,
    prevPrompts,
    setPrevPrompts,
    setRecentPrompts,
    submit,
    startNewChat,
    setChatHistory,
    setLoading,
    setResult,
    setFormattedResult
  } = useContext(Context);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [savedPromptsOpen, setSavedPromptsOpen] = useState(false);
  const [port, setPort] = useState<string>("");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");
  const [weaviateURL, setWeaviateURL] = useState<string>("");
  const [weaviateKey, setWeaviateKey] = useState<string>("");
  const [serverHost, setServerHost] = useState<string>("");
  const [langfuseSecret, setLangfuseSecret] = useState<string>("");
  const [langfusePublic, setLangfusePublic] = useState<string>("");
  const [langfuseBaseURL, setLangfuseBaseURL] = useState<string>("");
  const [langfuseHost, setLangfuseHost] = useState<string>("");
  const [pineconeKey, setPineconeKey] = useState<string>("");
  const [pineconeEnvironment, setPineconeEnvironment] = useState<string>("");
  const [pineconeIndex, setPineconeIndex] = useState<string>("");
  const [showKeys, setShowKeys] = useState<boolean>(false);

  const toggleShowKeys = () => {
    setShowKeys(!showKeys);
  };

  const maskString = (value: string | undefined) => {
    if (!showKeys && typeof value === 'string') {
      if (value.length > 7) {
        return value.slice(0, 3) + "..." + value.slice(-3);
      }
    }
    return value;
  };

  useEffect(() => {
    // Initialize state from env variables
    setPort(process.env.PORT || "");
    setGeminiKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "");
    setModelName(process.env.NEXT_PUBLIC_MODEL_NAME || "");
    setWeaviateURL(process.env.NEXT_PUBLIC_WEAVIATE_URL || "");
    setWeaviateKey(process.env.NEXT_PUBLIC_WEAVIATE_API_KEY || "");
    setServerHost(process.env.NEXT_PUBLIC_SERVER_HOST || "");
    setLangfuseSecret(process.env.LANGFUSE_SECRET_KEY || "");
    setLangfusePublic(process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY || "");
    setLangfuseBaseURL(process.env.NEXT_PUBLIC_LANGFUSE_BASEURL || "");
    setLangfuseHost(process.env.NEXT_PUBLIC_LANGFUSE_HOST || "");
    setPineconeKey(process.env.NEXT_PUBLIC_PINECONE_API_KEY || "");
    setPineconeEnvironment(process.env.NEXT_PUBLIC_PINECONE_ENVIRONMENT || "");
    setPineconeIndex(process.env.NEXT_PUBLIC_PINECONE_INDEX || "");

    // Then try to fetch from database
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/getenv');

      if (response.ok) {
        const settings = await response.json();

        // Update state with settings from database
        if (settings.port) setPort(settings.port);
        if (settings.geminiKey) setGeminiKey(settings.geminiKey);
        if (settings.modelName) setModelName(settings.modelName);
        if (settings.weaviateURL) setWeaviateURL(settings.weaviateURL);
        if (settings.weaviateKey) setWeaviateKey(settings.weaviateKey);
        if (settings.serverHost) setServerHost(settings.serverHost);
        if (settings.langfuseSecret) setLangfuseSecret(settings.langfuseSecret);
        if (settings.langfusePublic) setLangfusePublic(settings.langfusePublic);
        if (settings.langfuseBaseURL) setLangfuseBaseURL(settings.langfuseBaseURL);
        if (settings.langfuseHost) setLangfuseHost(settings.langfuseHost);
        if (settings.pineconeKey) setPineconeKey(settings.pineconeKey);
        if (settings.pineconeEnvironment) setPineconeEnvironment(settings.pineconeEnvironment);
        if (settings.pineconeIndex) setPineconeIndex(settings.pineconeIndex);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const [managePromptsOpen, setManagePromptsOpen] = useState(false);
  // Initialize prompts with prevPrompts from context
  const [prompts, setPrompts] = useState<string[]>(prevPrompts || []);

  // Update prompts when prevPrompts changes
  useEffect(() => {
    setPrompts(prevPrompts || []);
  }, [prevPrompts]);

  // State for saved prompts
  const [savedPrompts, setSavedPrompts] = useState<{id: number, content: string, title: string | null}[]>([]);

  // Load saved prompts from database on component mount
  useEffect(() => {
    fetchSavedPrompts();
  }, []);

  // Function to fetch saved prompts from the database
  const fetchSavedPrompts = async () => {
    try {
      console.log('Fetching saved prompts...');
      const response = await fetch('/api/prompts');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched prompts:', data.prompts);
        setSavedPrompts(data.prompts || []);
      } else {
        console.error('Failed to fetch saved prompts:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching saved prompts:', error);
    }
  };
  const [saveStatus, setSaveStatus] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false
  });

  const setEnvVariables = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus({
      message: 'Saving settings...',
      type: 'success',
      visible: true
    });

    try {
      const response = await fetch('/api/setenv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          port,
          geminiKey,
          modelName,
          weaviateURL,
          weaviateKey,
          serverHost,
          langfuseSecret,
          langfusePublic,
          langfuseBaseURL,
          langfuseHost,
          pineconeKey,
          pineconeEnvironment,
          pineconeIndex
        })
      });

      if (response.ok) {
        setSaveStatus({
          message: 'Settings saved successfully!',
          type: 'success',
          visible: true
        });

        // Update environment variables in the browser
        if (geminiKey) {
          (window as any).process = {
            ...(window as any).process,
            env: {
              ...(window as any).process?.env,
              NEXT_PUBLIC_GOOGLE_API_KEY: geminiKey,
              NEXT_PUBLIC_MODEL_NAME: modelName,
              NEXT_PUBLIC_WEAVIATE_URL: weaviateURL,
              NEXT_PUBLIC_WEAVIATE_API_KEY: weaviateKey,
              NEXT_PUBLIC_SERVER_HOST: serverHost,
              NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY: langfusePublic,
              NEXT_PUBLIC_LANGFUSE_BASEURL: langfuseBaseURL,
              NEXT_PUBLIC_LANGFUSE_HOST: langfuseHost,
              NEXT_PUBLIC_PINECONE_API_KEY: pineconeKey,
              NEXT_PUBLIC_PINECONE_ENVIRONMENT: pineconeEnvironment,
              NEXT_PUBLIC_PINECONE_INDEX: pineconeIndex
            }
          };
        }

        // Hide the message after 3 seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, visible: false }));
        }, 3000);
      } else {
        const errorData = await response.json();
        setSaveStatus({
          message: errorData.error || 'Failed to save settings',
          type: 'error',
          visible: true
        });
      }
    } catch (error) {
      console.error("Error setting Env Variables:", error);
      setSaveStatus({
        message: 'Error saving settings. Please try again.',
        type: 'error',
        visible: true
      });
    }
  };



  // State to track the currently selected prompt for editing
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");

  // State to track the ID of the prompt being edited (for saved prompts)
  const [editingPromptId, setEditingPromptId] = useState<number | undefined>(undefined);

  // Modified to open the ManagePromptsModal with the selected prompt
  const loadPrompt = (prompt: string) => {
    // Set the selected prompt and open the manage prompt modal
    setSelectedPrompt(prompt);
    setEditingPromptId(undefined); // Clear any existing promptId since this is a recent prompt
    setManagePromptsOpen(true);
  };

  const showSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  const createNewChat = () => {
    startNewChat();
  };

  // Function to handle saving a prompt
  const handleSavePrompt = async (editedPrompt: string, saveToCollection: boolean, promptId?: number) => {
    console.log('handleSavePrompt called with:', {
      editedPromptLength: editedPrompt?.length,
      saveToCollection,
      promptId
    });

    // If we're editing a recent prompt (not a saved prompt)
    if (!promptId) {
      // Update the selected prompt in the recent prompts list
      const updatedPrompts = prevPrompts.map(p =>
        p === selectedPrompt ? editedPrompt : p
      );

      // Update the context
      setPrevPrompts(updatedPrompts);
    }

    // If we're editing an existing saved prompt
    if (promptId) {
      console.log('Updating existing prompt with ID:', promptId);
      try {
        // Update the prompt in the database
        const requestBody = {
          content: editedPrompt,
          title: editedPrompt.substring(0, 50) // Use first 50 chars as title
        };

        console.log('Sending request to update prompt:', requestBody);

        const response = await fetch(`/api/prompts/${promptId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Prompt updated successfully:', data);
          // Refresh the saved prompts list
          fetchSavedPrompts();
        } else {
          const errorText = await response.text();
          console.error('Failed to update prompt in database:', errorText);
        }
      } catch (error) {
        console.error('Error updating prompt:', error);
      }
    }
    // If we're creating a new saved prompt
    else if (saveToCollection) {
      console.log('Saving new prompt to collection...');
      try {
        // Save to database
        const requestBody = {
          content: editedPrompt,
          title: editedPrompt.substring(0, 50) // Use first 50 chars as title
        };

        console.log('Sending request to save new prompt:', requestBody);

        const response = await fetch('/api/prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('New prompt saved successfully:', data);
          // Refresh the saved prompts list
          fetchSavedPrompts();
        } else {
          const errorText = await response.text();
          console.error('Failed to save new prompt to database:', errorText);
        }
      } catch (error) {
        console.error('Error saving new prompt:', error);
      }
    } else {
      console.log('Not saving to collection, just updating recent prompts');
    }
  };

  // Function to delete a saved prompt
  const handleDeleteSavedPrompt = async (index: number) => {
    const promptToDelete = savedPrompts[index];

    try {
      const response = await fetch(`/api/prompts/${promptToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the saved prompts list
        fetchSavedPrompts();
      } else {
        console.error('Failed to delete prompt from database');
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  // Function to edit a saved prompt
  const handleEditSavedPrompt = (prompt: {id: number, content: string}, index: number) => {
    console.log('Editing saved prompt:', prompt);
    setSelectedPrompt(prompt.content);
    // Store the prompt ID in state so we can pass it to the ManagePromptModal
    setEditingPromptId(prompt.id);
    setManagePromptsOpen(true);
    setSavedPromptsOpen(false);
  };

  // Function to use a saved prompt
  const handleUseSavedPrompt = (prompt: {id: number, content: string}) => {
    // Set the input field to the prompt content
    setInput(prompt.content);

    // Add to chat history directly instead of using submit
    setChatHistory(prev => [
      ...prev,
      { text: prompt.content, type: "user" }
    ]);

    // Set loading state to true to indicate we're processing
    setLoading(true);

    // Close the saved prompts panel
    setSavedPromptsOpen(false);

    // Make the API call to get a response
    fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt.content }),
    })
      .then(response => response.json())
      .then(data => {
        // Add the bot response to chat history
        setChatHistory(prev => [
          ...prev,
          { text: data.response, type: "bot" }
        ]);

        // Update the result state
        setResult(data.response);
        setFormattedResult(data.response);

        // Show the result and set loading to false
        setDisplayResult(true);
        setLoading(false);

        // Add to previous prompts for history
        setPrevPrompts(prev => [...prev, prompt.content]);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);

        // Add an error message to chat history
        setChatHistory(prev => [
          ...prev,
          { text: "Sorry, there was an error processing your request.", type: "bot" }
        ]);
      });
  };

  return (
    <>
      <div className={`${styles.leftSidebar} ${isOpen ? styles.expanded : styles.collapsed}`}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <div
              className={styles.menuButton}
              onClick={() => setIsOpen(!isOpen)}
              role="button"
              tabIndex={0}
              aria-label="Toggle sidebar"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsOpen(!isOpen);
                }
              }}
            >
              <Menu size={20} />
            </div>
            {isOpen && <h1 className={styles.sidebarTitle}>My-Chat-Brain AI</h1>}
          </div>

          <div className={styles.sidebarSection}>
            <div
              className={styles.newChatButton}
              onClick={createNewChat}
              role="button"
              tabIndex={0}
              aria-label="New chat"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  createNewChat();
                }
              }}
            >
              <Plus size={20} />
              {isOpen && <span>New chat</span>}
            </div>

            {isOpen && (
              <div className={styles.recentPrompts}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Recent Prompts</h2>
                  {/* Removed "Manage" button as clicking on any prompt now opens the management modal */}
                </div>
                <div className={`${styles.chatList} ${styles.scrollable}`}>
                  {prevPrompts?.map((item, index) => (
                    <div
                      key={index}
                      className={styles.chatItem}
                      onClick={() => loadPrompt(item)}
                      role="button"
                      tabIndex={0}
                      aria-label="Manage recent prompts"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          loadPrompt(item);
                        }
                      }}
                    >
                      <ChatCircle size={18} />
                      <span className={styles.chatItemText}>
                        {item.length > 25 ? `${item.slice(0, 25)}...` : item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isOpen && (
              <div className={styles.savedChats}>
                <ChatList />
              </div>
            )}
          </div>

          <div className={styles.sidebarFooter}>
            {isOpen && <LangfuseUI />}

            <div
              className={styles.footerItem}
              onClick={() => setSavedPromptsOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Saved Prompts"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSavedPromptsOpen(true);
                }
              }}
            >
              <Bookmark size={18} />
              {isOpen && <span>Saved Prompts</span>}
            </div>

            <div
              className={styles.footerItem}
              onClick={() => setHelpOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Help"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setHelpOpen(true);
                }
              }}
            >
              <HelpCircle size={18} />
              {isOpen && <span>Help</span>}
            </div>

            <div
              className={styles.footerItem}
              onClick={() => setActivityOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Activity"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActivityOpen(true);
                }
              }}
            >
              <Activity size={18} />
              {isOpen && <span>Activity</span>}
            </div>
            
            <div className={styles.footerSection}>
              <div
                className={styles.footerItem}
                onClick={showSettings}
                role="button"
                tabIndex={0}
                aria-label="Settings"
              >
                <RiUser3Fill size={18} />
                {isOpen && <span>Settings</span>}
              </div>

              {isOpen && (
                <div className={styles.footerItem}>
                  <ThemeToggle />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className={`${styles.settingsPanel} ${settingsOpen ? styles.settingsOpen : styles.settingsClosed}`}>
        {settingsOpen && (
          <div className={styles.settingsContent}>
            <div className={styles.settingsHeader}>
              <div className={styles.settingsHeaderContent}>
                <h2><RiUser3Fill size={20}/> Settings</h2>
                <div
                  className={styles.closeButton}
                  onClick={showSettings}
                  role="button"
                  tabIndex={0}
                  aria-label="Close settings"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      showSettings();
                    }
                  }}
                >
                  <X size={20} />
                </div>
              </div>
            </div>
            <div className={styles.settingsForm}>
              <form onSubmit={setEnvVariables}>
                <div className={styles.formGroup}>
                  <label htmlFor="port">Port:</label>
                  <input type="text" id="port" value={maskString(port)} onChange={(e) => setPort(e.target.value)} placeholder='3000'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="geminiKey">Gemini API Key:</label>
                  <input type="text" id="geminiKey" value={maskString(geminiKey)} onChange={(e) => setGeminiKey(e.target.value)} placeholder='AIzaSyDloUIgoJ3j7svjfKw9vHGQaMBfJRZgzS8'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="modelName">Model Name:</label>
                  <select
                    id="modelName"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className={styles.selectInput}
                  >
                    <option value="">Select a model</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (fastest)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (most capable)</option>
                    <option value="gemini-pro">gemini-pro (legacy)</option>
                    <option value="gemini-1.5-pro-vision">gemini-1.5-pro-vision (for images)</option>
                    <option value="gemini-pro-vision">gemini-pro-vision (legacy vision)</option>
                  </select>
                  <div className={styles.formHint}>
                    Select the model that best fits your needs
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="weaviateURL">Weaviate URL:</label>
                  <input type="text" id="weaviateURL" value={maskString(weaviateURL)} onChange={(e) => setWeaviateURL(e.target.value)} placeholder='http://localhost:8080'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="weaviateKey">Weaviate API Key:</label>
                  <input type="text" id="weaviateKey" value={maskString(weaviateKey)} onChange={(e) => setWeaviateKey(e.target.value)} placeholder='...apikey...'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="serverHost">Server Host:</label>
                  <input type="text" id="serverHost" value={maskString(serverHost)} onChange={(e) => setServerHost(e.target.value)} placeholder='http://localhost:8080'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="langfuseSecret">Langfuse Secret:</label>
                  <input type={showKeys ? "text" : "password"} id="langfuseSecret" value={maskString(langfuseSecret)} onChange={(e) => setLangfuseSecret(e.target.value)} placeholder="sk-lf-..."/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="langfusePublic">Langfuse Public:</label>
                  <input type={showKeys ? "text" : "password"} id="langfusePublic" value={maskString(langfusePublic)} onChange={(e) => setLangfusePublic(e.target.value)} placeholder='pk-lf-...'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="langfuseBaseURL">Langfuse BaseURL:</label>
                  <input type="text" id="langfuseBaseURL" value={maskString(langfuseBaseURL)} onChange={(e) => setLangfuseBaseURL(e.target.value)} placeholder='https://us.cloud.langfuse.com'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="langfuseHost">Langfuse Host:</label>
                  <input type="text" id="langfuseHost" value={maskString(langfuseHost)} onChange={(e) => setLangfuseHost(e.target.value)} placeholder='us.cloud.langfuse.com'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="pineconeKey">Pinecone API Key:</label>
                  <input type={showKeys ? "text" : "password"} id="pineconeKey" value={maskString(pineconeKey)} onChange={(e) => setPineconeKey(e.target.value)} placeholder='...'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="pineconeEnvironment">Pinecone Environment:</label>
                  <input type="text" id="pineconeEnvironment" value={maskString(pineconeEnvironment)} onChange={(e) => setPineconeEnvironment(e.target.value)} placeholder='us-west1-gcp'/>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="pineconeIndex">Pinecone Index:</label>
                  <input type="text" id="pineconeIndex" value={maskString(pineconeIndex)} onChange={(e) => setPineconeIndex(e.target.value)} placeholder='gemini-clone'/>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    className={styles.toggleKeysButton}
                    onClick={toggleShowKeys}
                  >
                    {showKeys ? 'Hide Keys' : 'Show Keys'}
                  </button>
                  <button type="submit" className={styles.saveButton}>
                    Save Settings
                  </button>
                </div>

                {saveStatus.visible && (
                  <div className={`${styles.saveStatus} ${styles[saveStatus.type]}`}>
                    {saveStatus.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Help Panel */}
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Activity Panel */}
      <ActivityPanel isOpen={activityOpen} onClose={() => setActivityOpen(false)} />

      {/* Manage Prompt Modal */}
      <ManagePromptModal
        isOpen={managePromptsOpen}
        onClose={() => {
          setManagePromptsOpen(false);
          setEditingPromptId(undefined); // Clear the editing prompt ID when closing
        }}
        prompt={selectedPrompt}
        promptId={editingPromptId}
        onSavePrompt={handleSavePrompt}
      />

      {/* Saved Prompts Panel */}
      <SavedPromptsPanel
        isOpen={savedPromptsOpen}
        onClose={() => setSavedPromptsOpen(false)}
        savedPrompts={savedPrompts}
        onDeletePrompt={handleDeleteSavedPrompt}
        onEditPrompt={handleEditSavedPrompt}
        onUsePrompt={handleUseSavedPrompt}
      />
    </>
  );
};

export default LeftSidebar;