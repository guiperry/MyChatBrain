"use client";
import React, { useState, useEffect } from 'react';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const INTEREST_OPTIONS = [
  'Machine Learning', 'Web Development', 'Data Science',
  'Creative Writing', 'Software Architecture', 'DevOps',
  'Mobile Development', 'Game Design', 'Blockchain',
  'Cybersecurity', 'UI/UX Design', 'Open Source'
];

export default function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName || undefined,
          interests: selectedInterests,
          experience: experience || undefined
        })
      });
      onComplete();
    } catch {
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bgPrimary)', borderRadius: '16px',
        padding: '40px', maxWidth: '500px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        color: 'var(--textColor)'
      }}>
        {step === 1 && (
          <>
            <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Welcome to MyChatBrain!</h2>
            <p style={{ color: 'var(--softTextColor)', marginBottom: '24px' }}>
              Let&apos;s personalize your experience. What should I call you?
            </p>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name (optional)"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                border: '1px solid var(--borderColor)', background: 'var(--bgSecondary)',
                color: 'var(--textColor)', fontSize: '1rem', marginBottom: '24px'
              }}
              onKeyDown={e => e.key === 'Enter' && setStep(2)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: 'var(--accentColor)', color: '#fff',
                  cursor: 'pointer', fontWeight: 600
                }}
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>What are you interested in?</h2>
            <p style={{ color: 'var(--softTextColor)', marginBottom: '16px' }}>
              Pick topics you&apos;d like help with. I&apos;ll tailor responses to your interests.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  style={{
                    padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--borderColor)',
                    background: selectedInterests.includes(interest) ? 'var(--accentColor)' : 'transparent',
                    color: selectedInterests.includes(interest) ? '#fff' : 'var(--textColor)',
                    cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s'
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--borderColor)',
                  background: 'transparent', color: 'var(--textColor)', cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: 'var(--accentColor)', color: '#fff',
                  cursor: 'pointer', fontWeight: 600
                }}
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Almost there!</h2>
            <p style={{ color: 'var(--softTextColor)', marginBottom: '16px' }}>
              How would you describe your experience level?
            </p>
            {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
              <button
                key={level}
                onClick={() => setExperience(level)}
                style={{
                  display: 'block', width: '100%', padding: '12px 16px', marginBottom: '8px',
                  borderRadius: '8px', border: `2px solid ${experience === level ? 'var(--accentColor)' : 'var(--borderColor)'}`,
                  background: experience === level ? 'var(--accentColorTransparent)' : 'var(--bgSecondary)',
                  color: 'var(--textColor)', cursor: 'pointer', fontSize: '1rem',
                  textAlign: 'left', fontWeight: experience === level ? 600 : 400
                }}
              >
                {level === 'beginner' ? '🌟 Beginner' : level === 'intermediate' ? '🚀 Intermediate' : '⚡ Advanced'}
              </button>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--borderColor)',
                  background: 'transparent', color: 'var(--textColor)', cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: 'var(--accentColor)', color: '#fff',
                  cursor: 'pointer', fontWeight: 600,
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Get Started'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
