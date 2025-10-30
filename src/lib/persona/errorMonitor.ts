import { db } from '@/db';
import type { ErrorEvents } from '@/db/schema';

/**
 * Error event result
 */
export interface ErrorResult {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
}

/**
 * Error monitor that tracks and categorizes system errors
 */
export class ErrorMonitor {
  // Error patterns and their categories
  private static readonly ERROR_PATTERNS = {
    'api_error': {
      patterns: ['api error', 'http error', 'connection failed', 'timeout', 'rate limit'],
      severity: 'medium' as const
    },
    'authentication_error': {
      patterns: ['unauthorized', 'forbidden', 'login failed', 'invalid token', 'authentication'],
      severity: 'high' as const
    },
    'validation_error': {
      patterns: ['invalid input', 'validation failed', 'bad request', 'malformed', 'required field'],
      severity: 'low' as const
    },
    'system_error': {
      patterns: ['internal server error', 'database error', 'system failure', 'crash', 'exception'],
      severity: 'critical' as const
    },
    'tool_error': {
      patterns: ['tool failed', 'execution error', 'command failed', 'script error'],
      severity: 'medium' as const
    }
  };

  /**
   * Analyze text for error patterns
   */
  static analyze(text: string): ErrorResult[] {
    const lowerText = text.toLowerCase();
    const errors: ErrorResult[] = [];

    for (const [errorType, config] of Object.entries(this.ERROR_PATTERNS)) {
      for (const pattern of config.patterns) {
        if (lowerText.includes(pattern)) {
          errors.push({
            type: errorType,
            severity: config.severity,
            details: text.length > 100 ? text.substring(0, 97) + '...' : text
          });
          break; // Only add one error per type
        }
      }
    }

    return errors;
  }

  /**
   * Record an error event
   */
  static async recordError(sessionId: number, error: ErrorResult): Promise<ErrorEvents | null> {
    try {
      const insertResult = db.run(
        'INSERT INTO error_events (session_id, type, severity, details) VALUES (?, ?, ?, ?)',
        [sessionId, error.type, error.severity, error.details]
      );

      const inserted = db.get(
        'SELECT * FROM error_events WHERE id = ?',
        [insertResult.lastInsertRowid]
      ) as ErrorEvents;

      return inserted || null;
    } catch (err) {
      console.error('Error recording error event:', err);
      return null;
    }
  }

  /**
   * Get error events for a session
   */
  static async getSessionErrors(sessionId: number): Promise<ErrorEvents[]> {
    try {
      const errors = db.all(
        'SELECT * FROM error_events WHERE session_id = ? ORDER BY created_at DESC',
        [sessionId]
      ) as ErrorEvents[];
      return errors;
    } catch (error) {
      console.error('Error getting session errors:', error);
      return [];
    }
  }

  /**
   * Get recent errors across all sessions
   */
  static async getRecentErrors(limit: number = 50): Promise<ErrorEvents[]> {
    try {
      const errors = db.all(
        'SELECT * FROM error_events ORDER BY created_at DESC LIMIT ?',
        [limit]
      ) as ErrorEvents[];
      return errors;
    } catch (error) {
      console.error('Error getting recent errors:', error);
      return [];
    }
  }

  /**
   * Update error resolution status
   */
  static async updateErrorStatus(errorId: number, status: 'open' | 'resolved' | 'ignored'): Promise<boolean> {
    try {
      const result = db.run(
        'UPDATE error_events SET resolution_state = ? WHERE id = ?',
        [status, errorId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating error status:', error);
      return false;
    }
  }
}
