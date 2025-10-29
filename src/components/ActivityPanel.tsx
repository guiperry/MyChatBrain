"use client";
import React, { useState, useEffect } from "react";
import { X } from "react-feather";
import styles from './ActivityPanel.module.css';

interface ActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ isOpen, onClose }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadActivities();
    }
  }, [isOpen]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // This would be a real API call in a production app
      // For now, we'll simulate some activity data
      const mockActivities: ActivityItem[] = [
        {
          id: 1,
          type: 'chat',
          description: 'Started a new chat',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
        },
        {
          id: 2,
          type: 'settings',
          description: 'Updated API key',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: 3,
          type: 'chat',
          description: 'Saved chat "Quantum Computing Explained"',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        }
      ];
      
      setActivities(mockActivities);
      setError(null);
    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.activityPanel}>
      <div className={styles.activityContent}>
        <div className={styles.activityHeader}>
          <h2>Recent Activity</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close activity panel"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.activityList}>
          {loading ? (
            <div className={styles.loading}>Loading activities...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : activities.length === 0 ? (
            <div className={styles.empty}>No recent activity</div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityType}>{activity.type}</div>
                <div className={styles.activityDescription}>{activity.description}</div>
                <div className={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPanel;