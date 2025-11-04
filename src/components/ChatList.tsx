import React, { useContext, useState, useEffect } from "react";
import { Context } from "@/context/ContextProvider";
import { ChatCircle, Trash } from "@phosphor-icons/react";
import styles from './ChatList.module.css';
import { ChatSession, ChatMessage } from '@/types';
import { chatMessagesToHistoryItems } from '@/lib/dataTransformers';

const ChatList: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {
    setChatHistory,
    setDisplayResult,
    setCurrentChatId,
    setShouldCreateNewSession,
    setChatModified,
    setResult,
    setFormattedResult
  } = useContext(Context);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      console.log('Fetching chats from API...');
      const response = await fetch('/api/loadChats');
      console.log('API response status:', response.status);

      if (response.status === 401) {
        // User is not authenticated, but we don't want to show an error
        console.log('User not authenticated, showing empty chat list');
        setSessions([]);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to load chats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Loaded ${data.sessions?.length || 0} chat sessions`);

      // Ensure sessions is always an array
      const sessionsArray = Array.isArray(data.sessions) ? data.sessions : [];
      setSessions(sessionsArray);

      // Log the first session if available
      if (sessionsArray.length > 0) {
        console.log('First session:', {
          id: sessionsArray[0].id,
          title: sessionsArray[0].title,
          messageCount: sessionsArray[0].messages?.length || 0
        });
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setError('Failed to load chat history: ' + (error instanceof Error ? error.message : String(error)));
      setSessions([]); // Set empty sessions on error
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the loadChat function

    if (!window.confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.status === 401) {
        alert('You need to be logged in to delete chats');
        return;
      }

      if (response.status === 403) {
        alert('You do not have permission to delete this chat');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Remove the deleted session from the state
      setSessions(sessions.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

  const loadChat = async (session: ChatSession) => {
    try {
      // Validate session data
      if (!session || typeof session.id !== 'number') {
        console.error('Invalid session data:', session);
        throw new Error('Invalid session data');
      }

      // Ensure messages is an array
      const messages = Array.isArray(session.messages) ? session.messages : [];

      console.log(`Loading chat session: ${session.id}, title: ${session.title}, messages: ${messages.length}`);

      // First, clear the current chat state
      setChatHistory([]);
      setDisplayResult(false);
      setResult('');
      setFormattedResult('');

      // Wait for the state to clear
      await new Promise(resolve => setTimeout(resolve, 100));

      // Convert the messages to the format expected by the chat history
      const formattedMessages = chatMessagesToHistoryItems(messages);

      console.log('Formatted messages:', formattedMessages.length);

      // Find the last bot message to set as the result
      const lastBotMessage = [...messages]
        .reverse()
        .find(msg => msg.role === 'bot');

      console.log('Last bot message found:', !!lastBotMessage);

      // Set the session state
      setCurrentChatId(session.id.toString());
      setShouldCreateNewSession(false);
      setChatModified(false);

      // Set the chat history
      if (formattedMessages.length > 0) {
        // Set all messages at once
        setChatHistory(formattedMessages);
        console.log('Chat history set with', formattedMessages.length, 'messages');
      } else {
        setChatHistory([]);
        console.log('No messages to display');
      }

      // Set the result and formatted result if we found a bot message
      if (lastBotMessage && lastBotMessage.content) {
        setResult(lastBotMessage.content);
        setFormattedResult(lastBotMessage.content);
        console.log('Result set to last bot message');
      } else {
        console.log('No bot message found to set as result');
      }

      // Finally, ensure the chat is displayed
      setDisplayResult(true);
      console.log('Display result set to true');

      console.log(`Chat loaded successfully, currentChatId: ${session.id}`);
    } catch (error) {
      console.error('Error loading chat:', error);
      // Reset to a clean state if loading fails
      setCurrentChatId(null);
      setShouldCreateNewSession(true);
      setChatHistory([]);
      setDisplayResult(false);
      alert('Failed to load chat. Please try again.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading chats...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (sessions.length === 0) {
    return <div className={styles.empty}>No saved chats found</div>;
  }

  return (
    <div className={styles.chatListContainer}>
      <h2 className={styles.title}>Saved Chats</h2>
      <div className={styles.list}>
        {sessions.map((session) => (
          <div 
            key={session.id} 
            className={styles.chatItem}
            onClick={() => loadChat(session)}
          >
            <div className={styles.chatIcon}>
              <ChatCircle size={18} />
            </div>
            <div className={styles.chatInfo}>
              <div className={styles.chatTitle}>
                {session.title.length > 30 
                  ? `${session.title.substring(0, 30)}...` 
                  : session.title}
              </div>
              <div className={styles.chatDate}>
                {new Date(session.updated_at).toLocaleDateString()}
              </div>
            </div>
            <button 
              className={styles.deleteButton}
              onClick={(e) => deleteChat(session.id, e)}
              aria-label="Delete chat"
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
