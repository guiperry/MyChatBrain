import { db, collections } from '@/database/nebuladb';
import type { SentimentMetrics } from '@/db/schema';

/**
 * Sentiment analysis result
 */
export interface SentimentResult {
  polarity: number; // -1 (negative) to 1 (positive)
  score: number; // confidence score 0-1
  modelVersion: string;
}

/**
 * Simple sentiment analyzer using keyword-based approach
 * In production, this would be replaced with a proper ML model
 */
export class SentimentAnalyzer {
  private static readonly POSITIVE_WORDS = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
    'love', 'like', 'happy', 'pleased', 'satisfied', 'perfect', 'brilliant',
    'outstanding', 'superb', 'marvelous', 'delightful', 'joyful', 'cheerful',
    'thrilled', 'excited', 'glad', 'content', 'pleasure', 'enjoy', 'appreciate'
  ];

  private static readonly NEGATIVE_WORDS = [
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry',
    'frustrated', 'annoyed', 'disappointed', 'unhappy', 'miserable', 'depressed',
    'worried', 'anxious', 'upset', 'irritated', 'furious', 'outraged', 'horrified',
    'disgusted', 'regret', 'sorry', 'apologize', 'fail', 'wrong', 'mistake'
  ];

  private static readonly INTENSIFIERS = [
    'very', 'really', 'extremely', 'so', 'too', 'quite', 'absolutely', 'totally',
    'completely', 'utterly', 'highly', 'incredibly', 'amazingly', 'terribly'
  ];

  private static readonly NEGATIONS = [
    'not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere', 'neither',
    'nor', 'cannot', 'cant', 'wont', 'dont', 'doesnt', 'didnt', 'isnt', 'arent',
    'wasnt', 'werent', 'hasnt', 'havent', 'hadnt'
  ];

  /**
   * Analyze sentiment of a text message
   */
  static analyze(text: string): SentimentResult {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    let positiveScore = 0;
    let negativeScore = 0;
    let negationMultiplier = 1;
    let intensifierMultiplier = 1;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const cleanWord = word.replace(/[^\w]/g, '');

      // Check for negations (affect next few words)
      if (this.NEGATIONS.includes(cleanWord)) {
        negationMultiplier = -1;
        continue;
      }

      // Check for intensifiers
      if (this.INTENSIFIERS.includes(cleanWord)) {
        intensifierMultiplier = 1.5;
        continue;
      }

      // Check for sentiment words
      if (this.POSITIVE_WORDS.includes(cleanWord)) {
        positiveScore += 1 * intensifierMultiplier * negationMultiplier;
      } else if (this.NEGATIVE_WORDS.includes(cleanWord)) {
        negativeScore += 1 * intensifierMultiplier * negationMultiplier;
      }

      // Reset multipliers after use
      negationMultiplier = 1;
      intensifierMultiplier = 1;
    }

    // Calculate polarity (-1 to 1)
    const totalSentiment = positiveScore - negativeScore;
    const maxPossible = Math.max(words.length * 0.5, 1); // Rough normalization
    const polarity = Math.max(-1, Math.min(1, totalSentiment / maxPossible));

    // Calculate confidence based on sentiment strength and word count
    const sentimentStrength = Math.abs(totalSentiment);
    const confidence = Math.min(1, sentimentStrength / Math.max(words.length * 0.3, 1));

    return {
      polarity,
      score: confidence,
      modelVersion: 'keyword-v1.0'
    };
  }

  /**
   * Analyze sentiment and store the result in the database
   */
  static async analyzeAndStore(messageId: number, text: string): Promise<SentimentMetrics | null> {
    try {
      const result = this.analyze(text);

      const sentimentMetric = {
        message_id: messageId,
        polarity: result.polarity,
        score: result.score,
        model_version: result.modelVersion,
        created_at: new Date().toISOString()
      };

      const inserted = await collections.sentiment_metrics.insert(sentimentMetric);
      return inserted as SentimentMetrics;
    } catch (error) {
      console.error('Error analyzing and storing sentiment:', error);
      return null;
    }
  }

  /**
   * Get sentiment metrics for a message
   */
  static async getSentimentForMessage(messageId: number): Promise<SentimentMetrics | null> {
    try {
      const result = db.get(
        'SELECT * FROM sentiment_metrics WHERE message_id = ? ORDER BY created_at DESC LIMIT 1',
        [messageId]
      ) as SentimentMetrics | undefined;
      return result || null;
    } catch (error) {
      console.error('Error getting sentiment for message:', error);
      return null;
    }
  }

  /**
   * Get sentiment history for a session
   */
  static async getSentimentHistory(sessionId: number): Promise<SentimentMetrics[]> {
    try {
      const results = db.all(
        `SELECT sm.* FROM sentiment_metrics sm
         JOIN persona_messages pm ON sm.message_id = pm.id
         WHERE pm.session_id = ?
         ORDER BY pm.timestamp ASC`,
        [sessionId]
      ) as SentimentMetrics[];
      return results;
    } catch (error) {
      console.error('Error getting sentiment history:', error);
      return [];
    }
  }
}
