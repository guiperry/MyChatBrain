'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);

  useEffect(() => {
    const testDatabase = async () => {
      try {
        setStatus('Checking database status...');

        // First, check the database status
        const statusResponse = await fetch('/api/dbStatus');
        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        console.log('Database status:', statusData);

        if (statusData.database.error) {
          throw new Error(`Database error: ${statusData.database.error}`);
        }

        setStatus('Database status checked. Initializing RxDB...');

        // Next, initialize RxDB
        const initResponse = await fetch('/api/updateSchema');
        if (!initResponse.ok) {
          throw new Error(`RxDB initialization failed: ${initResponse.statusText}`);
        }

        const initData = await initResponse.json();
        console.log('RxDB initialization result:', initData);

        setStatus('RxDB initialized. Testing session creation...');
        
        // Try to create a test session
        const sessionResponse = await fetch('/api/createSession', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Session ' + new Date().toISOString()
          }),
        });
        
        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          throw new Error(`Session creation failed: ${JSON.stringify(errorData)}`);
        }
        
        const sessionData = await sessionResponse.json();
        console.log('Session creation result:', sessionData);
        
        setStatus('Session created successfully. Testing message addition...');
        
        // Try to add a test message
        const messagesResponse = await fetch('/api/addMessages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            messages: [
              { text: 'Test user message', type: 'user' },
              { text: 'Test bot response', type: 'bot' }
            ]
          }),
        });
        
        if (!messagesResponse.ok) {
          const errorData = await messagesResponse.json();
          throw new Error(`Message addition failed: ${JSON.stringify(errorData)}`);
        }
        
        const messagesData = await messagesResponse.json();
        console.log('Message addition result:', messagesData);
        
        setStatus('All tests passed successfully!');
        setDbInfo({
          status: statusData,
          init: initData,
          session: sessionData,
          messages: messagesData
        });
      } catch (error) {
        console.error('Test error:', error);
        setStatus('Test failed');
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    testDatabase();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Database Test Page</h1>
      
      <div style={{ 
        padding: '1rem', 
        border: '1px solid', 
        borderColor: error ? 'red' : dbInfo ? 'green' : '#ccc',
        borderRadius: '0.5rem',
        marginTop: '1rem'
      }}>
        <h2>Status: {status}</h2>
        
        {error && (
          <div style={{ color: 'red', marginTop: '1rem' }}>
            <h3>Error:</h3>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{error}</pre>
          </div>
        )}
        
        {dbInfo && (
          <div style={{ color: 'green', marginTop: '1rem' }}>
            <h3>Test Results:</h3>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
              {JSON.stringify(dbInfo, null, 2)}
            </pre>

            <h3>Schema Information:</h3>
            <p>The application uses the following schema:</p>
            <ul>
              <li><strong>users</strong> - Stores user information</li>
              <li><strong>settings</strong> - Stores user and global settings</li>
              <li><strong>chat_sessions</strong> - Stores chat sessions</li>
              <li><strong>chat_messages</strong> - Stores messages for each chat session</li>
            </ul>

            <div style={{ marginTop: '1rem' }}>
              <a href="/api/fixDatabase" style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: '#f30070',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.25rem',
                marginRight: '1rem'
              }}>
                Repair Database
              </a>

              <a href="/" style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.25rem'
              }}>
                Return to Home
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
