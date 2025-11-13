import { db, collections } from '@/database/nebuladb';
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
      const errorEvent = {
        session_id: sessionId,
        type: error.type,
        severity: error.severity,
        details: error.details,
        resolution_state: 'open' as const,
        created_at: new Date().toISOString()
      };

      const inserted = await collections.error_events.insert(errorEvent);
      return inserted as ErrorEvents;
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
      const errors = await collections.error_events.findOne({ session_id: sessionId });
      return errors ? [errors] : [];
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
      // NebulaDB doesn't have a direct equivalent to LIMIT, so we'll get all and slice
      const allErrors = await collections.error_events.findOne({});
      const errors = allErrors ? [allErrors] : [];
      // Sort by created_at descending and limit
      return errors
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
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
      const result = await collections.error_events.update(
        { _id: errorId },
        { resolution_state: status }
      );
      return !!result;
    } catch (error) {
      console.error('Error updating error status:', error);
      return false;
    }
  }
}
