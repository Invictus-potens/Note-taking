'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getLocalStorage, setLocalStorage, addEventListener, removeEventListener } from '../../lib/clientUtils';

interface AIInteraction {
  id: string;
  question: string;
  response: string;
  timestamp: string;
}

interface AIAssistantProps {
  onAddToNote?: (content: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onAddToNote }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load interactions from localStorage on mount
  useEffect(() => {
    const saved = getLocalStorage('ai-interactions');
    if (saved) {
      try {
        setInteractions(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading AI interactions:', e);
      }
    }
  }, []);

  // Save interactions to localStorage
  const saveInteraction = (newInteraction: AIInteraction) => {
    const updated = [newInteraction, ...interactions.slice(0, 4)]; // Keep last 5
    setInteractions(updated);
    setLocalStorage('ai-interactions', JSON.stringify(updated));
  };

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      addEventListener(document, 'mousedown', handleClickOutside);
    }

    return () => {
      removeEventListener(document, 'mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setResponse(data.response);
      
      // Save interaction
      const newInteraction: AIInteraction = {
        id: Date.now().toString(),
        question: question.trim(),
        response: data.response,
        timestamp: data.timestamp,
      };
      saveInteraction(newInteraction);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToNote = () => {
    if (response && onAddToNote) {
      onAddToNote(response);
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <button
        className="ai-assistant-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
      >
        <i className="ri-robot-line"></i>
      </button>

      {/* AI Assistant Modal */}
      {isOpen && (
        <div className="ai-modal-overlay">
          <div className="ai-modal" ref={modalRef}>
            <div className="ai-modal-header">
              <div className="ai-modal-title">
                <i className="ri-robot-line"></i>
                AI Assistant
              </div>
              <div className="ai-modal-actions">
                <button
                  className="ai-history-btn"
                  onClick={() => setShowHistory(!showHistory)}
                  aria-label="Toggle history"
                >
                  <i className="ri-history-line"></i>
                </button>
                <button
                  className="ai-modal-close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close modal"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
            </div>

            <div className="ai-modal-content">
              {showHistory && interactions.length > 0 && (
                <div className="ai-history">
                  <h4>Recent Interactions</h4>
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="ai-history-item">
                      <div className="ai-history-question">
                        <strong>Q:</strong> {interaction.question}
                      </div>
                      <div className="ai-history-response">
                        <strong>A:</strong> {interaction.response.substring(0, 100)}...
                      </div>
                      <div className="ai-history-timestamp">
                        {new Date(interaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="ai-form">
                <div className="ai-input-container">
                  <textarea
                    ref={inputRef}
                    className="ai-input"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything... (Cmd/Ctrl + Enter to send)"
                    rows={3}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="ai-send-btn"
                    disabled={isLoading || !question.trim()}
                  >
                    {isLoading ? (
                      <i className="ri-loader-4-line ai-spinner"></i>
                    ) : (
                      <i className="ri-send-plane-line"></i>
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="ai-error">
                  <i className="ri-error-warning-line"></i>
                  {error}
                </div>
              )}

              {response && (
                <div className="ai-response">
                  <div className="ai-response-header">
                    <span>Response</span>
                    {onAddToNote && (
                      <button
                        className="ai-add-to-note-btn"
                        onClick={handleAddToNote}
                        aria-label="Add to note"
                      >
                        <i className="ri-add-line"></i>
                        Add to Note
                      </button>
                    )}
                  </div>
                  <div className="ai-response-content">
                    {response}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant; 