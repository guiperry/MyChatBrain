import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Target, User, Lightbulb } from 'lucide-react';

interface InterestItem {
  name: string;
  level: 'High' | 'Medium' | 'Growing';
}

interface Goal {
  title: string;
  status: string;
  progress: number;
}

interface PersonalityTrait {
  trait: string;
  level: 'High' | 'Medium' | 'Low';
}

interface RecentIdea {
  title: string;
  timestamp: string;
}

interface PersonaAnalyticsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PersonaData {
  sentiment?: {
    polarity: number;
    score: number;
    averagePolarity?: number;
    averageScore?: number;
  };
  interests?: Array<{
    topic: string;
    weight: number;
  }>;
  goals?: Array<{
    description: string;
    status: string;
    confidence: number;
  }>;
  personality?: Array<{
    trait: string;
    percentile: number;
  }>;
  ideas?: Array<{
    title: string;
    status: string;
    updatedAt?: string;
    createdAt?: string;
  }>;
}

const PersonaAnalyticsSidebar: React.FC<PersonaAnalyticsSidebarProps> = ({ isOpen, onClose }) => {
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch persona data when sidebar opens
  useEffect(() => {
    if (isOpen && !personaData && !loading) {
      fetchPersonaData();
    }
  }, [isOpen, personaData, loading]);

  const fetchPersonaData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/persona');
      if (!response.ok) {
        throw new Error('Failed to fetch persona data');
      }
      const data = await response.json();
      if (data.success && data.persona) {
        setPersonaData(data.persona);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching persona data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to transform data
  const getSentimentScore = (): number => {
    if (!personaData?.sentiment) return 0;
    return Math.round((personaData.sentiment.averagePolarity || personaData.sentiment.polarity || 0) * 100);
  };

  const getInterests = (): InterestItem[] => {
    if (!personaData?.interests) return [];
    return personaData.interests.slice(0, 5).map(interest => ({
      name: interest.topic,
      level: interest.weight > 0.7 ? 'High' : interest.weight > 0.4 ? 'Medium' : 'Growing' as 'High' | 'Medium' | 'Growing'
    }));
  };

  const getGoals = (): Goal[] => {
    if (!personaData?.goals) return [];
    return personaData.goals.slice(0, 3).map(goal => ({
      title: goal.description,
      status: goal.status === 'active' ? 'Progress' : goal.status,
      progress: Math.round(goal.confidence * 100)
    }));
  };

  const getPersonalityTraits = (): PersonalityTrait[] => {
    if (!personaData?.personality) return [];
    return personaData.personality.slice(0, 5).map(trait => ({
      trait: trait.trait,
      level: trait.percentile > 70 ? 'High' : trait.percentile > 40 ? 'Medium' : 'Low' as 'High' | 'Medium' | 'Low'
    }));
  };

  const getRecentIdeas = (): RecentIdea[] => {
    if (!personaData?.ideas) return [];
    return personaData.ideas.slice(0, 5).map(idea => ({
      title: idea.title,
      timestamp: idea.updatedAt ? new Date(idea.updatedAt).toLocaleString() : 'Recently'
    }));
  };

  const sentimentScore = getSentimentScore();
  const interests = getInterests();
  const goals = getGoals();
  const personalityTraits = getPersonalityTraits();
  const recentIdeas = getRecentIdeas();

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Growing':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 z-50 w-80 bg-white border-l border-gray-200 h-screen overflow-y-auto shadow-lg transform transition-transform duration-300 ease-in-out">
      {/* Header with close button */}
      <div className="mb-6 p-6 pb-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Persona Analytics</h2>
            <p className="text-xs text-gray-500 mt-1">Real-time insights and knowledge mapping</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close persona analytics"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8 px-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Loading analytics...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mx-6">
          <p className="text-sm text-red-700">Failed to load persona data: {error}</p>
          <button
            onClick={fetchPersonaData}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Sentiment Analysis */}
          <div className="mb-6 px-6">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
              <h3 className="text-sm font-semibold text-gray-900">Sentiment Analysis</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Positive</span>
                <span className="text-xs font-semibold text-green-600">{sentimentScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${sentimentScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interest Profile */}
          <div className="mb-6 px-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900">Interest Profile</h3>
            </div>
            <div className="space-y-2">
              {interests.map((interest, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-xs text-gray-700">{interest.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getLevelColor(interest.level)}`}>
                    {interest.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Goals */}
          <div className="mb-6 px-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-gray-900">Active Goals</h3>
            </div>
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-medium text-gray-900">{goal.title}</h4>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{goal.status}</span>
                      <span className="text-xs text-gray-700">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personality Insights */}
          <div className="mb-6 px-6">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-900">Personality Insights</h3>
            </div>
            <div className="space-y-3">
              {personalityTraits.map((trait, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-700">{trait.trait}</span>
                    <span className="text-xs font-semibold text-gray-900">{trait.level}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: trait.level === 'High' ? '85%' : trait.level === 'Medium' ? '55%' : '30%'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Ideas */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm font-semibold text-gray-900">Recent Ideas</h3>
            </div>
            <div className="space-y-3">
              {recentIdeas.map((idea, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-900 mb-1">{idea.title}</p>
                  <p className="text-xs text-gray-400">{idea.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PersonaAnalyticsSidebar;
