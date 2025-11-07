import React, { useState } from 'react';
import { ChevronRight, CheckCircle2, AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react';

interface UserContext {
  stage: string;
  problem: string;
  kryptonite: string;
  energy: string;
  timeSuck: string;
}

interface AlgorithmicSystem {
  name: string;
  philosophy: string;
  leverageScore: number;
  cognitiveLoad: 'Low' | 'Medium' | 'High';
  algorithm: string[];
  dailyRitual: string[];
  successMetric: string;
  whenToUse: string;
  warningSigns: string;
}

const CreatorAlgorithmApp: React.FC = () => {
  const [phase, setPhase] = useState<number>(1);
  const [context, setContext] = useState<UserContext>({
    stage: '',
    problem: '',
    kryptonite: '',
    energy: '',
    timeSuck: ''
  });
  const [systems, setSystems] = useState<AlgorithmicSystem[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
  const [constraint, setConstraint] = useState<string>('');

  const analyzeContext = (ctx: UserContext): string => {
    const text = `${ctx.problem} ${ctx.kryptonite} ${ctx.timeSuck}`.toLowerCase();
    
    if (text.includes('focus') || text.includes('distract') || text.includes('meeting')) {
      return 'focus';
    } else if (text.includes('time') || text.includes('overwhelm') || text.includes('busy')) {
      return 'time';
    } else if (text.includes('energy') || text.includes('burn') || text.includes('exhaust')) {
      return 'energy';
    } else {
      return 'clarity';
    }
  };

  const generateSystems = (ctx: UserContext): AlgorithmicSystem[] => {
    const primaryConstraint = analyzeContext(ctx);
    setConstraint(primaryConstraint);
    
    const isEarlyStage = ctx.stage.toLowerCase().includes('pre') || ctx.stage.toLowerCase().includes('seed');
    
    return [
      {
        name: "The Regret Minimization Framework",
        philosophy: "Future-Back Thinking",
        leverageScore: 9,
        cognitiveLoad: 'Low',
        algorithm: [
          "Every morning, ask: 'What decision will I regret NOT making today?'",
          "Identify the 1-3 high-stakes decisions on your plate",
          "Score each on Regret Potential (1-10) and Time Sensitivity (1-10)",
          "Multiply scores - highest number gets done first",
          "Everything else gets delegated, deleted, or deferred to Friday"
        ],
        dailyRitual: [
          "8:00 AM - Write down all pending decisions",
          "8:10 AM - Score each on regret + urgency",
          "8:20 AM - Block 2 hours for top-scoring item",
          "No meetings before noon unless it's THE decision"
        ],
        successMetric: "Make at least one 'scary' decision per week that moves the needle",
        whenToUse: "When you're drowning in options and everything feels urgent",
        warningSigns: "If you're only picking comfortable tasks with low regret scores"
      },
      {
        name: "The Constraint Crusher",
        philosophy: "Theory of Constraints",
        leverageScore: 10,
        cognitiveLoad: 'Medium',
        algorithm: [
          "Identify your business's #1 bottleneck right now",
          "Ask: 'Am I the only one who can remove this constraint?'",
          "If YES: Block 4 hours minimum to obliterate it",
          "If NO: Delegate immediately and find the real constraint",
          "Repeat daily until constraint shifts to something else"
        ],
        dailyRitual: [
          "Morning: Revisit current constraint - has it shifted?",
          "Deep work block on constraint removal (no Slack, no phone)",
          "End of day: Measure constraint movement with one metric",
          isEarlyStage ? "Focus on: product-market fit or revenue velocity" : "Focus on: scaling bottleneck or cash runway"
        ],
        successMetric: "Constraint metric improves 20% in 2 weeks",
        whenToUse: "When growth feels stuck or you're constantly firefighting the same issues",
        warningSigns: "Working on 'important' things that aren't actually THE constraint"
      },
      {
        name: "The Energy Economics Method",
        philosophy: "Personal Energy Management",
        leverageScore: 8,
        cognitiveLoad: 'Low',
        algorithm: [
          "Map your day into 4 energy zones: Peak (A), High (B), Medium (C), Low (D)",
          "Bucket all tasks: Strategic (needs A), Execution (needs B), Admin (C or D)",
          "Match work to energy - NEVER do strategic work in D zones",
          ctx.energy.toLowerCase().includes('morning') 
            ? "Protect 8-11 AM for strategic decisions only"
            : "Protect your peak hours (whenever they are) religiously",
          "Use low energy time for email, Slack, easy admin"
        ],
        dailyRitual: [
          "Night before: Plan next day's A-zone activity",
          "Peak hours: Phone off, Slack closed, door closed",
          "Post-peak: Batch all meetings and communications",
          "Track: Did I use peak energy for strategic work?"
        ],
        successMetric: "90% of peak energy time spent on strategic Creator work for 2 weeks",
        whenToUse: "When you feel constantly drained or make bad decisions when tired",
        warningSigns: "Sacrificing sleep or peak hours for urgent-but-not-important tasks"
      },
      {
        name: "The 3x3x3 Filter",
        philosophy: "Asymmetric Impact",
        leverageScore: 9,
        cognitiveLoad: 'Medium',
        algorithm: [
          "Each morning, write 3 things that would 3x your business in 3 months",
          "Cross out anything that's NOT exclusively Creator-level work",
          "Of what remains, which ONE creates cascade effects?",
          "That's your singular focus until it's shipped or decided",
          "Review weekly: Are you actually working on 3x moves or 3% improvements?"
        ],
        dailyRitual: [
          "Morning: Write the 3x3x3 list",
          "Gut check: Would investors care about this work?",
          "Block time: 60%+ of day on THE 3x item",
          "Evening: Did I move the 3x needle or just feel busy?"
        ],
        successMetric: "Ship or decide on at least 2 genuine 3x opportunities per month",
        whenToUse: "When busy-ness is high but meaningful progress is low",
        warningSigns: "Your 3x list starts looking like a normal to-do list"
      },
      {
        name: "The Monk Mode Sprint",
        philosophy: "Deep Work Intensity",
        leverageScore: 10,
        cognitiveLoad: 'High',
        algorithm: [
          "Pick ONE massive needle-mover that terrifies you",
          "Clear your calendar for 3 consecutive days",
          "Go completely dark: No meetings, no Slack, no email",
          "Emerge only when the thing is DONE (shipped, decided, launched)",
          "Use this quarterly for your scariest, most important work"
        ],
        dailyRitual: [
          "Pre-sprint: Prep team, set auto-responders, clear dependencies",
          "Days 1-3: 10-hour deep work days on THE thing",
          "Breaks only for food, walks, sleep",
          "Post-sprint: Full day of catch-up and communication"
        ],
        successMetric: "Complete 1 major strategic initiative that's been lingering for months",
        whenToUse: ctx.kryptonite.toLowerCase().includes('meeting') || ctx.kryptonite.toLowerCase().includes('slack')
          ? "Perfect for you - when you need to escape meeting hell and actually build"
          : "When you have a make-or-break project that needs uninterrupted focus",
        warningSigns: "Using it too often (max once per quarter) or for non-strategic work"
      }
    ];
  };

  const handleInputChange = (field: keyof UserContext, value: string) => {
    setContext(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitContext = () => {
    if (Object.values(context).every(v => v.trim())) {
      const generatedSystems = generateSystems(context);
      setSystems(generatedSystems);
      setPhase(2);
    }
  };

  const renderPhase1 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-l-4 border-purple-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Let's Cut Through the Noise
        </h2>
        <p className="text-gray-700">
          Answer these questions like you're venting to a friend who gets it. No corporate speak.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            1. Stage & Stats
          </label>
          <input
            type="text"
            placeholder='e.g., "Seed stage, 7 people, 10 months runway, B2B SaaS"'
            value={context.stage}
            onChange={(e) => handleInputChange('stage', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            2. The Real Problem
          </label>
          <textarea
            placeholder="What's the ONE thing that if solved would make everything else easier? What keeps you up at night?"
            value={context.problem}
            onChange={(e) => handleInputChange('problem', e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            3. Your Kryptonite
          </label>
          <textarea
            placeholder="What fake work do you do when avoiding real work? (Perfecting decks? Endless meetings? Email zero? Slack addiction?)"
            value={context.kryptonite}
            onChange={(e) => handleInputChange('kryptonite', e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            4. Energy Reality
          </label>
          <input
            type="text"
            placeholder="When do you do your best thinking? Morning person? Night owl?"
            value={context.energy}
            onChange={(e) => handleInputChange('energy', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            5. Current Time Suck
          </label>
          <textarea
            placeholder="What consumed most of your time last week that probably didn't need to?"
            value={context.timeSuck}
            onChange={(e) => handleInputChange('timeSuck', e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        onClick={handleSubmitContext}
        disabled={!Object.values(context).every(v => v.trim())}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        Generate My Algorithmic Systems
        <ChevronRight size={20} />
      </button>
    </div>
  );

  const renderPhase2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Analysis Complete
        </h2>
        <p className="text-gray-700">
          Based on your responses, your primary constraint is: <strong className="text-blue-700 capitalize">{constraint}</strong>
        </p>
        <p className="text-gray-600 mt-2 text-sm">
          I've generated 5 distinct prioritization systems optimized for your situation.
        </p>
      </div>

      <div className="space-y-4">
        {systems.map((system, idx) => (
          <div
            key={idx}
            className={`border-2 rounded-lg p-5 cursor-pointer transition-all ${
              selectedSystem === idx
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            onClick={() => setSelectedSystem(selectedSystem === idx ? null : idx)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{system.name}</h3>
                <p className="text-sm text-gray-600">{system.philosophy}</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded text-xs font-semibold text-green-700">
                  <TrendingUp size={14} />
                  {system.leverageScore}/10
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  system.cognitiveLoad === 'Low' ? 'bg-blue-100 text-blue-700' :
                  system.cognitiveLoad === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {system.cognitiveLoad} Load
                </div>
              </div>
            </div>

            {selectedSystem === idx && (
              <div className="mt-4 space-y-4 animate-fadeIn">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Zap size={16} className="text-purple-600" />
                    The Algorithm
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    {system.algorithm.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-purple-600" />
                    Daily Ritual
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {system.dailyRitual.map((ritual, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{ritual}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">Success Metric</h4>
                    <p className="text-sm text-gray-700">{system.successMetric}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">When to Use</h4>
                    <p className="text-sm text-gray-700">{system.whenToUse}</p>
                  </div>
                </div>

                <div className="bg-red-50 p-3 rounded border-l-2 border-red-300">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-600" />
                    Warning Signs
                  </h4>
                  <p className="text-sm text-gray-700">{system.warningSigns}</p>
                </div>

                <button
                  onClick={() => setPhase(3)}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  I'll Start With This System
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPhase3 = () => {
    const chosen = selectedSystem !== null ? systems[selectedSystem] : systems[0];
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Implementation Guide
          </h2>
          <p className="text-gray-700">
            You've chosen: <strong>{chosen.name}</strong>
          </p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Personal Rotation Schedule</h3>
          <div className="space-y-3 text-gray-700">
            <p><strong>Week 1-2:</strong> Start with {chosen.name} to build momentum and address your {constraint} constraint</p>
            <p><strong>Week 3-4:</strong> Continue if working, or try {systems[(selectedSystem || 0) + 1 < systems.length ? (selectedSystem || 0) + 1 : 0].name} if you need a different approach</p>
            <p><strong>Monthly review:</strong> Assess which system created most leverage and double down</p>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Integration Checklist</h3>
          <div className="space-y-2">
            {[
              "Block tomorrow's calendar for your chosen system",
              "Set up daily ritual triggers (calendar blocks, reminders)",
              "Share your approach with co-founder/team",
              "Track one key metric for 2 weeks",
              "Schedule system rotation reminder in your calendar"
            ].map((item, idx) => (
              <label key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span className="text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
            <AlertCircle size={20} />
            Your Biggest Risk
          </h3>
          <p className="text-gray-700">
            Based on your kryptonite ({context.kryptonite.slice(0, 50)}...), you're most likely to fall back into fake work when the strategic decisions get uncomfortable. The moment you catch yourself doing "{context.kryptonite.split(' ')[0]}" instead of your prioritized work, that's your cue to get back on track.
          </p>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-purple-900 mb-2">The One Thing to Remember</h3>
          <p className="text-gray-700 text-lg">
            The best prioritization system is the one you actually use. Start tomorrow morning. Just one system. Just two weeks. Track the metric. Then decide.
          </p>
        </div>

        <button
          onClick={() => {
            setPhase(1);
            setContext({ stage: '', problem: '', kryptonite: '', energy: '', timeSuck: '' });
            setSystems([]);
            setSelectedSystem(null);
          }}
          className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          Start Over with New Context
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Creator Algorithmic System™
          </h1>
          <p className="text-gray-600 text-lg">
            Cut through productivity theater. Focus on what actually moves the needle.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
          {phase === 1 && renderPhase1()}
          {phase === 2 && renderPhase2()}
          {phase === 3 && renderPhase3()}
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          Phase {phase} of 3 | Inspired by @godofprompt
        </div>
      </div>
    </div>
  );
};

export default CreatorAlgorithmApp;