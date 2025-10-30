import { db } from '@/db';
import type { InterestMetrics } from '@/db/schema';

/**
 * Interest analysis result
 */
export interface InterestResult {
  topic: string;
  weight: number; // 0-1 interest strength
  decayFactor: number;
}

/**
 * Interest profiler that tracks user topics of interest
 * Uses topic modeling and maintains decay over time
 */
export class InterestProfiler {
  // Predefined topic categories with associated keywords
  private static readonly TOPIC_CATEGORIES = {
    'technology': ['computer', 'software', 'programming', 'code', 'algorithm', 'ai', 'machine learning', 'data', 'database', 'api', 'web', 'app', 'mobile', 'cloud', 'server', 'network', 'security', 'blockchain', 'crypto'],
    'science': ['physics', 'chemistry', 'biology', 'mathematics', 'research', 'experiment', 'theory', 'quantum', 'genetics', 'neuroscience', 'astronomy', 'climate', 'evolution', 'statistics'],
    'business': ['company', 'startup', 'entrepreneur', 'investment', 'finance', 'marketing', 'sales', 'strategy', 'management', 'leadership', 'profit', 'revenue', 'growth', 'market', 'customer'],
    'health': ['medical', 'doctor', 'hospital', 'disease', 'treatment', 'medicine', 'fitness', 'exercise', 'nutrition', 'mental health', 'therapy', 'wellness', 'diet', 'sleep', 'stress'],
    'education': ['learning', 'teaching', 'school', 'university', 'course', 'study', 'knowledge', 'skill', 'training', 'certification', 'degree', 'academic', 'research', 'student', 'teacher'],
    'entertainment': ['movie', 'music', 'game', 'gaming', 'book', 'reading', 'art', 'film', 'tv', 'show', 'series', 'concert', 'theater', 'comedy', 'humor'],
    'sports': ['football', 'basketball', 'soccer', 'baseball', 'tennis', 'golf', 'running', 'swimming', 'cycling', 'fitness', 'athlete', 'team', 'league', 'championship', 'olympic'],
    'travel': ['vacation', 'trip', 'journey', 'destination', 'hotel', 'flight', 'adventure', 'explore', 'culture', 'tourism', 'backpacking', 'cruise', 'resort', 'beach', 'mountain'],
    'food': ['cooking', 'recipe', 'restaurant', 'cuisine', 'ingredient', 'meal', 'dining', 'chef', 'baking', 'grill', 'diet', 'nutrition', 'taste', 'flavor', 'gourmet'],
    'politics': ['government', 'policy', 'election', 'vote', 'democracy', 'law', 'justice', 'rights', 'freedom', 'economy', 'international', 'diplomacy', 'president', 'congress', 'parliament']
  };

  private static readonly DEFAULT_DECAY_FACTOR = 0.95; // Daily decay rate
  private static readonly MAX_WEIGHT = 1.0;
  private static readonly MIN_WEIGHT = 0.0;

  /**
   * Analyze text for topics of interest
   */
  static analyze(text: string): InterestResult[] {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/).map(word => word.replace(/[^\w]/g, ''));

    const topicScores: Record<string, number> = {};

    // Count topic keyword matches
    for (const [topic, keywords] of Object.entries(this.TOPIC_CATEGORIES)) {
      let score = 0;
      for (const word of words) {
        if (keywords.includes(word)) {
          score += 1;
        }
      }
      if (score > 0) {
        topicScores[topic] = score;
      }
    }

    // Convert to normalized weights
    const results: InterestResult[] = [];
    const maxScore = Math.max(...Object.values(topicScores), 1);

    for (const [topic, score] of Object.entries(topicScores)) {
      const weight = Math.min(this.MAX_WEIGHT, score / maxScore);
      results.push({
        topic,
        weight,
        decayFactor: this.DEFAULT_DECAY_FACTOR
      });
    }

    return results.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Update interest metrics for a user based on new message content
   */
  static async updateInterests(userId: number, text: string): Promise<InterestMetrics[]> {
    try {
      const newInterests = this.analyze(text);
      const updatedMetrics: InterestMetrics[] = [];

      for (const interest of newInterests) {
        // Check if interest already exists
        const existing = db.get(
          'SELECT * FROM interest_metrics WHERE user_id = ? AND topic = ?',
          [userId, interest.topic]
        ) as InterestMetrics | undefined;

        let newWeight: number;
        let decayFactor: number;

        if (existing) {
          // Update existing interest with decay and new input
          const daysSinceUpdate = this.getDaysSince(existing.last_updated);
          const decayedWeight = existing.weight * Math.pow(existing.decay_factor, daysSinceUpdate);
          newWeight = Math.min(this.MAX_WEIGHT, decayedWeight + interest.weight * 0.3); // Blend old and new
          decayFactor = existing.decay_factor;
        } else {
          // Create new interest
          newWeight = interest.weight;
          decayFactor = interest.decayFactor;
        }

        // Upsert the interest
        db.run(
          `INSERT OR REPLACE INTO interest_metrics (id, user_id, topic, weight, decay_factor, last_updated, created_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, COALESCE((SELECT created_at FROM interest_metrics WHERE id = ?), CURRENT_TIMESTAMP))`,
          [existing?.id, userId, interest.topic, newWeight, decayFactor, existing?.id]
        );

        updatedMetrics.push({
          id: existing?.id,
          user_id: userId,
          topic: interest.topic,
          weight: newWeight,
          decay_factor: decayFactor,
          last_updated: new Date().toISOString(),
          created_at: existing?.created_at || new Date().toISOString()
        } as InterestMetrics);
      }

      return updatedMetrics;
    } catch (error) {
      console.error('Error updating interests:', error);
      return [];
    }
  }

  /**
   * Get current interests for a user (with decay applied)
   */
  static async getCurrentInterests(userId: number): Promise<InterestMetrics[]> {
    try {
      const interests = db.all(
        'SELECT * FROM interest_metrics WHERE user_id = ?',
        [userId]
      ) as InterestMetrics[];

      // Apply decay to all interests
      const now = new Date();
      const updatedInterests: InterestMetrics[] = [];

      for (const interest of interests) {
        const daysSinceUpdate = this.getDaysSince(interest.last_updated);
        const decayedWeight = interest.weight * Math.pow(interest.decay_factor, daysSinceUpdate);
        const newWeight = Math.max(this.MIN_WEIGHT, decayedWeight);

        // Update in database if significant decay occurred
        if (Math.abs(newWeight - interest.weight) > 0.01) {
          db.run(
            'UPDATE interest_metrics SET weight = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
            [newWeight, interest.id]
          );
        }

        updatedInterests.push({
          ...interest,
          weight: newWeight,
          last_updated: now.toISOString()
        });
      }

      return updatedInterests.sort((a, b) => b.weight - a.weight);
    } catch (error) {
      console.error('Error getting current interests:', error);
      return [];
    }
  }

  /**
   * Get top interests for a user
   */
  static async getTopInterests(userId: number, limit: number = 5): Promise<InterestMetrics[]> {
    const interests = await this.getCurrentInterests(userId);
    return interests.slice(0, limit);
  }

  /**
   * Calculate days since a given timestamp
   */
  private static getDaysSince(timestamp: string): number {
    const then = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - then.getTime();
    return diffMs / (1000 * 60 * 60 * 24);
  }

  /**
   * Decay all interests for a user (maintenance function)
   */
  static async decayAllInterests(userId: number): Promise<void> {
    try {
      const interests = db.all(
        'SELECT * FROM interest_metrics WHERE user_id = ?',
        [userId]
      ) as InterestMetrics[];

      for (const interest of interests) {
        const daysSinceUpdate = this.getDaysSince(interest.last_updated);
        const decayedWeight = interest.weight * Math.pow(interest.decay_factor, daysSinceUpdate);

        if (decayedWeight < 0.01) {
          // Remove very weak interests
          db.run('DELETE FROM interest_metrics WHERE id = ?', [interest.id]);
        } else {
          // Update decayed weight
          db.run(
            'UPDATE interest_metrics SET weight = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
            [decayedWeight, interest.id]
          );
        }
      }
    } catch (error) {
      console.error('Error decaying interests:', error);
    }
  }
}
