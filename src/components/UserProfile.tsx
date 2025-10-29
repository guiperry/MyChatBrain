"use client";
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, LogOut, Save, Eye, EyeOff } from 'react-feather';
import styles from './UserProfile.module.css';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  id: number;
  username: string;
  email: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.profilePanel}>
        <div className={styles.header}>
          <h2>User Profile</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close profile"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.content}>
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
                  <div className={styles.field}>
                    <User size={16} />
                    <span>{user.username}</span>
                  </div>
                  <div className={styles.field}>
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.section}>
                <h3>Change Password</h3>
                {message && (
                  <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                  </div>
                )}
                <form onSubmit={handleChangePassword}>
                  <div className={styles.formGroup}>
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className={styles.passwordInput}>
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
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
                    />
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
      </div>
    </div>
  );
};

export default UserProfile;