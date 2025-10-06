

import React, { useState, useMemo } from 'react';
import { Question, UserAnswer, Bookmark } from '../types';
import { ChevronRight, Bookmark as BookmarkIcon, CheckCircle, XCircle, AlertCircle, Loader, Zap } from 'lucide-react';
import { NEET_SYLLABUS } from '../constants';
import { generatePracticeQuestions } from '../services/geminiService';

interface PracticeScreenProps {
  onSessionComplete: (answers: UserAnswer[], completedQuestions: Question[]) => void;
  bookmarks: Bookmark[];
  onBookmarkToggle: (questionId: string, note: string) => void;
  onQuestionsGenerated: (questions: Question[]) => void;
  seenQuestionTexts: Set<string>;
}

const PracticeScreen: React.FC<PracticeScreenProps> = ({ onSessionComplete, bookmarks, onBookmarkToggle, onQuestionsGenerated, seenQuestionTexts }) => {
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Config state
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Biology'>('Physics');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>('Mixed');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);

  const chaptersForSubject = useMemo(() => {
    return NEET_SYLLABUS[subject].map(c => c.chapter);
  }, [subject]);

  const topicsForChapters = useMemo(() => {
    if (selectedChapters.length === 0) return [];
    const topics = NEET_SYLLABUS[subject]
      .filter(c => selectedChapters.includes(c.chapter))
      .flatMap(c => c.topics);
    return Array.from(new Set(topics));
  }, [selectedChapters, subject]);

  const handleChapterToggle = (chapter: string) => {
    setSelectedChapters(prev => 
      prev.includes(chapter) ? prev.filter(c => c !== chapter) : [...prev, chapter]
    );
    setSelectedTopics([]);
  };

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const startSession = async () => {
    setError(null);
    setIsGenerating(true);
    
    try {
      const generated = await generatePracticeQuestions(
        subject,
        selectedChapters,
        selectedTopics,
        difficulty,
        numQuestions
      );

      const uniqueNewQuestions = generated
        .filter(q => !seenQuestionTexts.has(q.questionText));

      if (uniqueNewQuestions.length < numQuestions) {
         console.warn(`Could only generate ${uniqueNewQuestions.length} unique questions out of ${numQuestions} requested.`);
      }

      const newQuestionsWithIds: Question[] = uniqueNewQuestions.map(q => ({
          ...q,
          id: crypto.randomUUID(),
      }));
      
      if (newQuestionsWithIds.length === 0) {
        setError("Could not generate new, unseen questions for this criteria. Please try different options.");
        setIsGenerating(false);
        return;
      }

      onQuestionsGenerated(newQuestionsWithIds);
      setSessionQuestions(newQuestionsWithIds);
      setCurrentQuestionIndex(0);
      setSessionAnswers([]);
      setSelectedOption(null);
      setIsAnswered(false);
      setSessionStarted(true);
    } catch (e: any) {
      setError(e.message || "Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const currentQuestion = sessionQuestions[currentQuestionIndex];
  const isBookmarked = bookmarks.some(b => b.questionId === currentQuestion?.id);

  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
    setSessionAnswers(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedOptionIndex: optionIndex,
        isCorrect,
        timestamp: Date.now(),
      },
    ]);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      onSessionComplete(sessionAnswers, sessionQuestions);
    }
  };

  if (!sessionStarted) {
    const renderCheckboxes = (items: string[], selectedItems: string[], handler: (item: string) => void) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
        {items.map(item => (
          <label key={item} className="flex items-center space-x-3 p-2 rounded-md bg-[var(--bg-dark-secondary)] bg-opacity-50 hover:bg-opacity-80 cursor-pointer border border-transparent has-[:checked]:border-[var(--glow-cyan)] has-[:checked]:bg-opacity-100 transition-all">
            <input 
              type="checkbox" 
              checked={selectedItems.includes(item)} 
              onChange={() => handler(item)}
              className="appearance-none h-4 w-4 border-2 border-[var(--border-color)] rounded-sm bg-[var(--bg-dark-primary)] checked:bg-[var(--glow-cyan)] checked:border-transparent focus:outline-none"
            />
            <span className="text-base text-[var(--text-primary)]">{item}</span>
          </label>
        ))}
      </div>
    );

    const futuristicSelect = (value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[]) => (
        <select value={value} onChange={onChange} className="w-full p-3 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none text-[var(--text-primary)] appearance-none">
            {options.map(opt => <option key={opt} value={opt.toLowerCase() === 'mixed' ? 'Mixed' : opt}>{opt}</option>)}
        </select>
    );

    const futuristicInput = (value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => (
         <input
            id="num-questions"
            type="number"
            value={value}
            onChange={onChange}
            min="1"
            max="50"
            className="w-full p-3 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none"
        />
    );


    return (
      <div className="glass-card p-6 rounded-2xl animate-fade-in">
        <h2 className="text-3xl font-bold text-white mb-6 border-b border-[var(--border-color)] pb-3 flex items-center">
            <Zap className="text-[var(--glow-cyan)] mr-3" style={{ filter: 'drop-shadow(0 0 5px var(--glow-cyan))' }}/>
            Practice Engine Setup
        </h2>
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">1. Select Subject</label>
              {futuristicSelect(subject, e => {setSubject(e.target.value as any); setSelectedChapters([]); setSelectedTopics([]);}, ['Physics', 'Chemistry', 'Biology'])}
            </div>
            <div>
              <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">2. Select Difficulty</label>
              {futuristicSelect(difficulty, e => setDifficulty(e.target.value), ['Mixed', 'Easy', 'Medium', 'Hard'])}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">3. Select Chapters (optional)</label>
              {chaptersForSubject.length > 0 ? renderCheckboxes(chaptersForSubject, selectedChapters, handleChapterToggle) : <p className="text-base text-[var(--text-secondary)]">Select a subject first.</p>}
            </div>
            <div>
              <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">4. Select Topics (optional)</label>
              {topicsForChapters.length > 0 ? renderCheckboxes(topicsForChapters, selectedTopics, handleTopicToggle) : <p className="text-base text-[var(--text-secondary)]">Select at least one chapter.</p>}
            </div>
          </div>

          <div>
            <label htmlFor="num-questions" className="block text-base font-bold text-[var(--text-secondary)] mb-2">5. Number of Questions</label>
            {futuristicInput(numQuestions, e => setNumQuestions(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1))))}
             <p className="text-sm text-[var(--text-secondary)] mt-1">Maximum 50 questions per session.</p>
          </div>

          {error && <div className="p-3 bg-red-900 bg-opacity-50 text-red-300 border border-red-500 rounded-md text-base flex items-center"><AlertCircle size={16} className="mr-2"/> {error}</div>}
          
          <button 
            onClick={startSession}
            disabled={isGenerating}
            className="w-full bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-all disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg shadow-[0_0_15px_var(--glow-cyan)]"
          >
            {isGenerating ? <><Loader size={20} className="animate-spin" /> <span>Generating Questions...</span></> : <span>Start Session</span>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl animate-fade-in-slow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Practice Session</h2>
          <p className="text-base text-[var(--text-secondary)]">Question {currentQuestionIndex + 1} of {sessionQuestions.length}</p>
        </div>
        <button onClick={() => onBookmarkToggle(currentQuestion.id, '')} className={`p-2 rounded-full transition-colors ${isBookmarked ? 'bg-yellow-500 bg-opacity-30 text-yellow-300' : 'text-gray-400 hover:bg-white/10'}`}>
            <BookmarkIcon size={20} fill={isBookmarked ? 'currentColor' : 'none'}/>
        </button>
      </div>
      
      <div className="mb-6 p-4 bg-black/20 rounded-lg">
        <p className="font-semibold text-xl text-[var(--text-primary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQuestion.questionText.replace(/\^(\d+)/g, '<sup>$1</sup>') }}></p>
      </div>

      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          const isCorrect = index === currentQuestion.correctOptionIndex;
          const isSelected = selectedOption === index;
          
          let optionClass = 'bg-[var(--bg-dark-secondary)] hover:border-[var(--glow-cyan)] border-[var(--border-color)]';
          if (isAnswered) {
            if (isCorrect) {
              optionClass = 'bg-green-900/50 border-green-500';
            } else if (isSelected && !isCorrect) {
              optionClass = 'bg-red-900/50 border-red-500';
            } else {
              optionClass = 'bg-black/20 border-transparent text-[var(--text-secondary)]';
            }
          }

          return (
            <button 
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={isAnswered}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex justify-between items-center ${optionClass}`}
            >
              <span className="font-medium text-[var(--text-primary)]">{option}</span>
              {isAnswered && isCorrect && <CheckCircle className="text-green-400"/>}
              {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-400"/>}
            </button>
          );
        })}
      </div>
      
      {isAnswered && (
        <div className="mt-6 p-4 glass-card rounded-lg animate-fade-in border border-[var(--glow-cyan)] border-opacity-50">
          <h3 className="font-bold text-white mb-2">Explanation</h3>
          <p className="text-[var(--text-secondary)]">{currentQuestion.explanation}</p>
          <button 
            onClick={handleNext} 
            className="w-full mt-4 bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors flex items-center justify-center space-x-2"
          >
            <span>{currentQuestionIndex < sessionQuestions.length - 1 ? 'Next Question' : 'Finish Session'}</span>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeScreen;