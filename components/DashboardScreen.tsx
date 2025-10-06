
import React, { useMemo } from 'react';
import { UserAnswer, Bookmark, Question, TopicAnalytics, PlannerTask } from '../types';
import { Beaker, Atom, Dna, ArrowRight } from 'lucide-react';
import SubjectDashboard from './SubjectDashboard';

interface DashboardScreenProps {
  userAnswers: UserAnswer[];
  bookmarks: Bookmark[];
  allQuestions: Question[];
  topicAnalytics: TopicAnalytics;
  tasks: PlannerTask[];
  selectedSubject: 'Physics' | 'Chemistry' | 'Biology' | null;
  onSubjectSelect: (subject: 'Physics' | 'Chemistry' | 'Biology') => void;
  onBack: () => void;
  onBookmarkToggle: (questionId: string, note: string) => void;
  solvedIncorrectIds: Set<string>;
  onMarkAsSolved: (questionId: string) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
    userAnswers, 
    bookmarks, 
    allQuestions, 
    topicAnalytics,
    tasks,
    selectedSubject,
    onSubjectSelect,
    onBack,
    onBookmarkToggle,
    solvedIncorrectIds,
    onMarkAsSolved,
}) => {
    
    if (selectedSubject) {
        return (
            <SubjectDashboard 
                subject={selectedSubject}
                userAnswers={userAnswers}
                bookmarks={bookmarks}
                allQuestions={allQuestions}
                topicAnalytics={topicAnalytics}
                tasks={tasks}
                onBack={onBack}
                onBookmarkToggle={onBookmarkToggle}
                solvedIncorrectIds={solvedIncorrectIds}
                onMarkAsSolved={onMarkAsSolved}
            />
        );
    }
    
    const getCombinedSubjectStats = useMemo(() => (subject: 'Physics' | 'Chemistry' | 'Biology') => {
        // 1. Get stats from Planner
        let plannerPracticed = 0;
        let plannerIncorrect = 0;
        // FIX: Replaced Object.entries with a for...in loop to correctly infer the type of `data` from `topicAnalytics`.
        for (const key in topicAnalytics) {
            if (Object.prototype.hasOwnProperty.call(topicAnalytics, key) && key.startsWith(subject)) {
                const data = topicAnalytics[key];
                plannerPracticed += data.totalQuestionsPracticed;
                plannerIncorrect += data.totalQuestionsIncorrect;
            }
        }

        // 2. Get stats from Practice sessions
        const practiceAnswers = userAnswers.filter(a => {
            const q = allQuestions.find(q => q.id === a.questionId);
            return q?.subject === subject;
        });
        const practiceAttempted = practiceAnswers.length;
        const practiceIncorrectCount = practiceAnswers.filter(a => !a.isCorrect).length;

        // 3. Combine
        const totalAttempted = plannerPracticed + practiceAttempted;
        const totalIncorrect = plannerIncorrect + practiceIncorrectCount;
        const totalCorrect = totalAttempted - totalIncorrect;
        const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

        return { accuracy, totalAttempted };
    }, [userAnswers, topicAnalytics, allQuestions]);


    const SubjectCard = ({ subject, icon, color, shadowColor }: {
        subject: 'Physics' | 'Chemistry' | 'Biology',
        icon: React.ReactNode,
        color: string,
        shadowColor: string
    }) => {
        const { accuracy, totalAttempted } = getCombinedSubjectStats(subject);

        return (
             <div 
                className="glass-card p-6 rounded-2xl flex flex-col transition-all duration-300 transform hover:-translate-y-2 glass-card-hover"
                style={{
                    borderTop: `4px solid ${color}`,
                    boxShadow: `0 0 20px ${shadowColor}`
                }}
            >
                <div className="flex items-center space-x-4">
                    {icon}
                    <h3 className="text-2xl font-bold text-white">{subject}</h3>
                </div>
                <div className="my-4 flex-grow space-y-4">
                    <div>
                        <span className="text-base font-medium text-[var(--text-secondary)]">Universal Accuracy</span>
                        <p className="text-4xl font-bold text-white">{totalAttempted > 0 ? `${accuracy}%` : 'N/A'}</p>
                    </div>
                     <div>
                        <span className="text-base font-medium text-[var(--text-secondary)]">Total Attempted</span>
                        <p className="text-4xl font-bold text-white">{totalAttempted}</p>
                    </div>
                </div>
                <button 
                    onClick={() => onSubjectSelect(subject)}
                    className="mt-auto ml-auto bg-[var(--glow-cyan)] bg-opacity-20 text-[var(--glow-cyan)] font-semibold py-2 px-4 rounded-lg hover:bg-opacity-30 transition-all duration-300 flex items-center space-x-2 border border-[var(--glow-cyan)] border-opacity-30 hover:border-opacity-80 text-base"
                >
                    <span>View Details</span>
                    <ArrowRight size={16} />
                </button>
            </div>
        );
    };

    return (
        <div className="animate-fade-in space-y-6">
            <h2 className="text-4xl font-bold text-white text-center tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 242, 255, 0.5)' }}>Performance Matrix</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SubjectCard subject="Physics" icon={<Atom size={28} className="text-blue-400" />} color="#3b82f6" shadowColor="rgba(59, 130, 246, 0.2)" />
                <SubjectCard subject="Chemistry" icon={<Beaker size={28} className="text-green-400" />} color="#22c55e" shadowColor="rgba(34, 197, 94, 0.2)" />
                <SubjectCard subject="Biology" icon={<Dna size={28} className="text-pink-400" />} color="#ec4899" shadowColor="rgba(236, 72, 153, 0.2)" />
            </div>
        </div>
    );
};

export default DashboardScreen;