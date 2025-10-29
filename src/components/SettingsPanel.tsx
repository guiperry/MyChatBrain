"use client";
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, LogOut, Save, Eye, EyeOff, Settings as SettingsIcon } from 'react-feather';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  id: number;
  username: string;
  email: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  
  // User profile state
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // App settings state
  const [port, setPort] = useState<string>("");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");
  const [langfuseSecret, setLangfuseSecret] = useState<string>("");
  const [langfusePublic, setLangfusePublic] = useState<string>("");
  const [langfuseBaseURL, setLangfuseBaseURL] = useState<string>("");
  const [langfuseHost, setLangfuseHost] = useState<string>("");
  const [showKeys, setShowKeys] = useState<boolean>(false);
  
  // Feedback message for user actions
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initialize app settings from env variables and reset to profile tab when opened
  useEffect(() => {
    if (isOpen) {
      // Reset to profile tab when panel is opened
      setActiveTab('profile');

      // Load settings
      setPort(process.env.PORT || "");
      setGeminiKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "");
      setModelName(process.env.NEXT_PUBLIC_MODEL_NAME || "");
      setLangfuseSecret(process.env.LANGFUSE_SECRET_KEY || "");
      setLangfusePublic(process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY || "");
      setLangfuseBaseURL(process.env.NEXT_PUBLIC_LANGFUSE_BASEURL || "");
      setLangfuseHost(process.env.NEXT_PUBLIC_LANGFUSE_HOST || "");

      // Fetch user data
      fetchUserData();
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      setUser(data.user);
      setError(null);
    } catch (err) {
      setError('Failed to load user profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setMessage({ text: 'Password changed successfully', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to change password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Helper function to update a single setting
      const updateSetting = async (key: string, value: string) => {
        await fetch('/api/setenv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, value }),
        });
      };

      // Update each setting individually
      await updateSetting('PORT', port);
      await updateSetting('NEXT_PUBLIC_GOOGLE_API_KEY', geminiKey);
      await updateSetting('NEXT_PUBLIC_MODEL_NAME', modelName);
      await updateSetting('LANGFUSE_SECRET_KEY', langfuseSecret);
      await updateSetting('NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY', langfusePublic);
      await updateSetting('NEXT_PUBLIC_LANGFUSE_BASEURL', langfuseBaseURL);
      await updateSetting('NEXT_PUBLIC_LANGFUSE_HOST', langfuseHost);

      setMessage({ text: 'Settings saved successfully', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error setting settings:", error);
      setMessage({ text: error.message || 'Error updating settings', type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to logout');
      }
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to logout', type: 'error' });
    }
  };

  const maskString = (value: string | undefined) => {
    if (!showKeys && typeof value === 'string') {
      if (value.length > 7) {
        return value.slice(0, 3) + "..." + value.slice(-3);
      }
    }
    return value;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.settingsPanel}>
        <div className={styles.header}>
          <h2>
            {activeTab === 'profile' ? (
              <>
                <User size={18} />
                User Profile
              </>
            ) : (
              <>
                <SettingsIcon size={18} />
                App Settings
              </>
            )}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'profile' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            Profile
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'settings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={16} />
            App Settings
          </button>
        </div>

        <div className={styles.content}>
          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' ? (
            <div className={styles.profileSection}>
              {loading && !user ? (
                <div className={styles.loading}>Loading...</div>
              ) : error ? (
                <div className={styles.error}>{error}</div>
              ) : user ? (
                <>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      <User size={40} />
                    </div>
                    <div className={styles.details}>
                      <h3>{user.username}</h3>
                      <div className={styles.field}>
                        <Mail size={16} />
                        <span>{user.email}</span>
                      </div>
                      <p>Manage your account settings and preferences below</p>
                    </div>
                  </div>
                  
                  <div className={styles.section}>
                    <h3>Change Password</h3>
                    <form onSubmit={handleChangePassword}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label htmlFor="currentPassword">Current Password</label>
                          <div className={styles.passwordInput}>
                            <input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              required
                              className={styles.textInput}
                            />
                            <button
                              type="button"
                              className={styles.togglePassword}
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                            >
                              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label htmlFor="newPassword">New Password</label>
                          <div className={styles.passwordInput}>
                            <input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              className={styles.textInput}
                            />
                            <button
                              type="button"
                              className={styles.togglePassword}
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              aria-label={showNewPassword ? "Hide password" : "Show password"}
                            >
                              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label htmlFor="confirmPassword">Confirm New Password</label>
                          <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className={styles.textInput}
                          />
                        </div>
                      </div>
                      
                      <button 
                        type="submit" 
                        className={styles.saveButton}
                        disabled={loading}
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                    </form>
                  </div>
                  
                  <div className={styles.logoutSection}>
                    <button 
                      className={styles.logoutButton}
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.notLoggedIn}>
                  <p>You are not logged in.</p>
                  <a href="/login" className={styles.loginLink}>Log in</a>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.settingsSection}>
              <h3>Application Settings</h3>
              <form onSubmit={saveAppSettings}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="port">Port</label>
                    <input
                      type="text"
                      id="port"
                      value={maskString(port)}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder="3000"
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="geminiKey">Gemini API Key</label>
                    <input
                      type={showKeys ? "text" : "password"}
                      id="geminiKey"
                      value={maskString(geminiKey)}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSyDloUIgoJ3j7svjfKw9vHGQaMBfJRZgzS8"
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="modelName">Model Name</label>
                    <input
                      type="text"
                      id="modelName"
                      value={maskString(modelName)}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="gemini-1.5-flash"
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="langfuseSecret">Langfuse Secret</label>
                    <input
                      type={showKeys ? "text" : "password"}
                      id="langfuseSecret"
                      value={maskString(langfuseSecret)}
                      onChange={(e) => setLangfuseSecret(e.target.value)}
                      placeholder="sk-lf-..."
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="langfusePublic">Langfuse Public</label>
                    <input
                      type={showKeys ? "text" : "password"}
                      id="langfusePublic"
                      value={maskString(langfusePublic)}
                      onChange={(e) => setLangfusePublic(e.target.value)}
                      placeholder="pk-lf-..."
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="langfuseBaseURL">Langfuse BaseURL</label>
                    <input
                      type="text"
                      id="langfuseBaseURL"
                      value={maskString(langfuseBaseURL)}
                      onChange={(e) => setLangfuseBaseURL(e.target.value)}
                      placeholder="https://us.cloud.langfuse.com"
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="langfuseHost">Langfuse Host</label>
                    <input
                      type="text"
                      id="langfuseHost"
                      value={maskString(langfuseHost)}
                      onChange={(e) => setLangfuseHost(e.target.value)}
                      placeholder="https://us.cloud.langfuse.com"
                      className={styles.textInput}
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={showKeys}
                        onChange={() => setShowKeys(!showKeys)}
                      />
                      Show API Keys
                    </label>
                  </div>
                </div>

                <button type="submit" className={styles.saveButton}>
                  <Save size={16} />
                  Save Settings
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;