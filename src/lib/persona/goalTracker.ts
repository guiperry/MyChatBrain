import { collections } from '@/database/nebuladb';
import type { GoalMetrics } from '@/db/schema';

/**
 * Goal analysis result
 */
export interface GoalResult {
  description: string;
  confidence: number; // 0-1 confidence score
  status: 'active' | 'completed' | 'cancelled';
}

/**
 * Goal tracker that identifies and tracks user goals from conversations
 * Uses pattern matching and state transitions
 */
export class GoalTracker {
  // Goal-related keywords and patterns
  private static readonly GOAL_INDICATORS = [
    'want to', 'need to', 'plan to', 'going to', 'will', 'should', 'must',
    'goal', 'objective', 'target', 'aim', 'purpose', 'intention', ' aspiration',
    'wish', 'hope', 'dream', 'desire', 'ambition', 'mission'
  ];

  private static readonly COMPLETION_INDICATORS = [
    'done', 'finished', 'completed', 'achieved', 'accomplished', 'succeeded',
    'finished', 'complete', 'ready', 'got it', 'figured it out', 'solved'
  ];

  private static readonly CANCELLATION_INDICATORS = [
    'cancel', 'stop', 'quit', 'give up', 'abandon', 'forget', 'never mind',
    'changed my mind', 'not anymore', 'won\'t', 'can\'t'
  ];

  /**
   * Analyze text for potential goals
   */
  static analyze(text: string): GoalResult[] {
    const lowerText = text.toLowerCase();
    const sentences = lowerText.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const goals: GoalResult[] = [];

    for (const sentence of sentences) {
      // Check if sentence contains goal indicators
      const hasGoalIndicator = this.GOAL_INDICATORS.some(indicator =>
        sentence.includes(indicator)
      );

      if (hasGoalIndicator) {
        // Extract potential goal description
        const goalText = sentence.trim();

        // Calculate confidence based on clarity and specificity
        let confidence = 0.5; // Base confidence

        // Increase confidence for more specific goals
        if (goalText.length > 20) confidence += 0.2;
        if (goalText.split(' ').length > 5) confidence += 0.1;
        if (/\d+/.test(goalText)) confidence += 0.1; // Contains numbers
        if (goalText.includes('by ') || goalText.includes('within')) confidence += 0.1; // Time-bound

        confidence = Math.min(1.0, confidence);

        goals.push({
          description: goalText,
          confidence,
          status: 'active'
        });
      }
    }

    return goals;
  }

  /**
   * Update goals for a user based on new message content
   */
  static async updateGoals(userId: number, text: string): Promise<GoalMetrics[]> {
    try {
      const newGoals = this.analyze(text);
      const lowerText = text.toLowerCase();

      // Check for goal completions or cancellations
      const existingGoals = await this.getActiveGoals(userId);
      const updatedGoals: GoalMetrics[] = [];

      // Process existing goals for status changes
      for (const goal of existingGoals) {
        let newStatus = goal.status;

        // Check for completion indicators
        if (this.COMPLETION_INDICATORS.some(indicator =>
          lowerText.includes(indicator) &&
          this.isRelatedToGoal(lowerText, goal.description)
        )) {
          newStatus = 'completed';
        }
        // Check for cancellation indicators
        else if (this.CANCELLATION_INDICATORS.some(indicator =>
          lowerText.includes(indicator) &&
          this.isRelatedToGoal(lowerText, goal.description)
        )) {
          newStatus = 'cancelled';
        }

        if (newStatus !== goal.status) {
          await collections.goal_metrics.update(
            { id: goal.id },
            { status: newStatus, updated_at: new Date().toISOString() }
          );
          goal.status = newStatus;
          goal.updated_at = new Date().toISOString();
        }

        updatedGoals.push(goal);
      }

      // Add new goals
      for (const newGoal of newGoals) {
        const goalDoc = {
          _id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          description: newGoal.description,
          status: newGoal.status,
          confidence: newGoal.confidence,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const inserted = await collections.goal_metrics.insert(goalDoc);
        updatedGoals.push(inserted as GoalMetrics);
      }

      return updatedGoals;
    } catch (error) {
      console.error('Error updating goals:', error);
      return [];
    }
  }

  /**
   * Get active goals for a user
   */
  static async getActiveGoals(userId: number): Promise<GoalMetrics[]> {
    try {
      // NebulaDB doesn't have a find method for multiple documents
      // We need to implement a different approach or use a different database
      console.warn('getActiveGoals not implemented for NebulaDB');
      return [];
    } catch (error) {
      console.error('Error getting active goals:', error);
      return [];
    }
  }

  /**
   * Get all goals for a user
   */
  static async getAllGoals(userId: number): Promise<GoalMetrics[]> {
    try {
      // NebulaDB doesn't have a find method for multiple documents
      // We need to implement a different approach or use a different database
      console.warn('getAllGoals not implemented for NebulaDB');
      return [];
    } catch (error) {
      console.error('Error getting all goals:', error);
      return [];
    }
  }

  /**
   * Mark a goal as completed
   */
  static async completeGoal(goalId: number, userId: number): Promise<boolean> {
    try {
      await collections.goal_metrics.update(
        { id: goalId, user_id: userId },
        { status: 'completed', updated_at: new Date().toISOString() }
      );
      return true;
    } catch (error) {
      console.error('Error completing goal:', error);
      return false;
    }
  }

  /**
   * Check if text is related to a specific goal
   */
  private static isRelatedToGoal(text: string, goalDescription: string): boolean {
    const textWords = text.toLowerCase().split(/\s+/);
    const goalWords = goalDescription.toLowerCase().split(/\s+/);

    // Simple word overlap check
    const overlap = goalWords.filter(word =>
      word.length > 3 && textWords.includes(word)
    ).length;

    return overlap >= Math.min(2, goalWords.length * 0.3);
  }
}
