
import React from 'react';
import { Question, UserAnswer } from '../types';
import { CheckCircle, XCircle, Trash2, Check } from 'lucide-react';

interface QuestionReviewCardProps {
  question: Question;
  userAnswer?: UserAnswer; // Provided for incorrect questions
  onDeleteBookmark?: () => void;
  onMarkAsSolved?: (questionId: string) => void;
}

const QuestionReviewCard: React.FC<QuestionReviewCardProps> = ({ question, userAnswer, onDeleteBookmark, onMarkAsSolved }) => {
  
  const getOptionClassName = (index: number) => {
    const isCorrect = index === question.correctOptionIndex;
    const isUserChoice = userAnswer && index === userAnswer.selectedOptionIndex;

    if (isCorrect) return 'bg-green-900/50 border-green-500 text-green-300';
    if (isUserChoice && !isCorrect) return 'bg-red-900/50 border-red-500 text-red-300';
    return 'bg-[var(--bg-dark-secondary)] border-[var(--border-color)]';
  };

  return (
    <div className="glass-card p-4 rounded-lg">
        <p className="font-semibold text-[var(--text-primary)] mb-4">{question.questionText}</p>
        <div className="space-y-2 mb-4">
            {question.options.map((option, index) => (
                <div key={index} className={`p-3 rounded-md border-2 flex items-center justify-between text-base ${getOptionClassName(index)}`}>
                    <span className="font-medium text-[var(--text-primary)]">{option}</span>
                    {index === question.correctOptionIndex && <CheckCircle className="text-green-400" size={18} />}
                    {userAnswer && index === userAnswer.selectedOptionIndex && index !== question.correctOptionIndex && <XCircle className="text-red-400" size={18} />}
                </div>
            ))}
        </div>
        <div className="p-3 bg-black/30 rounded-md">
            <h4 className="font-bold text-base text-[var(--text-secondary)] mb-1">Explanation:</h4>
            <p className="text-[var(--text-primary)] text-base">{question.explanation}</p>
        </div>
        
        <div className="mt-3 flex justify-end">
            {onMarkAsSolved && userAnswer && (
                <button 
                    onClick={() => onMarkAsSolved(userAnswer.questionId)} 
                    className="flex items-center space-x-1.5 text-sm font-semibold text-green-300 bg-green-500/20 hover:bg-green-500/40 px-3 py-1.5 rounded-md transition-colors"
                >
                    <Check size={14}/>
                    <span>Mark as Solved</span>
                </button>
            )}
            {onDeleteBookmark && (
                 <button 
                    onClick={onDeleteBookmark} 
                    className="flex items-center space-x-1.5 text-sm font-semibold text-red-300 bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded-md transition-colors"
                >
                    <Trash2 size={14}/>
                    <span>Delete Bookmark</span>
                </button>
            )}
        </div>
    </div>
  );
};

export default QuestionReviewCard;