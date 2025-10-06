
import React, { useState, useMemo, useEffect } from 'react';
import { UserAnswer, Bookmark, Question, TopicAnalytics, PlannerTask } from '../types';
import { BarChart, ArrowLeft, Clock, AlertTriangle, Bookmark as BookmarkIcon, Zap, ShieldCheck } from 'lucide-react';
import { NEET_SYLLABUS } from '../constants';
import QuestionReviewCard from './QuestionReviewCard';

interface SubjectDashboardProps {
  subject: 'Physics' | 'Chemistry' | 'Biology';
  userAnswers: UserAnswer[];
  bookmarks: Bookmark[];
  allQuestions: Question[];
  topicAnalytics: TopicAnalytics;
  tasks: PlannerTask[];
  onBack: () => void;
  onBookmarkToggle: (questionId: string, note: string) => void;
  solvedIncorrectIds: Set<string>;
  onMarkAsSolved: (questionId: string) => void;
}

const SubjectDashboard: React.FC<SubjectDashboardProps> = ({ 
    subject, 
    userAnswers, 
    bookmarks, 
    allQuestions, 
    topicAnalytics,
    tasks,
    onBack, 
    onBookmarkToggle, 
    solvedIncorrectIds, 
    onMarkAsSolved 
}) => {
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'analytics' | 'incorrect' | 'bookmarked'>('analytics');
    const [chapterActiveTab, setChapterActiveTab] = useState<'analytics' | 'incorrect' | 'bookmarked'>('analytics');

    useEffect(() => {
        if (selectedChapter) {
            setChapterActiveTab('analytics');
            setSelectedTopic(null); // Reset topic when chapter changes
        }
    }, [selectedChapter]);

    const subjectAnalytics = useMemo(() => {
        const combinedChapterMap: { [chapter: string]: { topics: any[] } } = {};
        const subjectChapters = NEET_SYLLABUS[subject] || [];

        subjectChapters.forEach(chapterInfo => {
            if (!chapterInfo || !chapterInfo.topics) return;
            chapterInfo.topics.forEach(topicName => {
                const key = `${subject}-${chapterInfo.chapter}-${topicName}`;
                const plannerData = topicAnalytics[key] || { totalTimeSpent: 0, totalQuestionsPracticed: 0, totalQuestionsIncorrect: 0, difficultyRatings: [] };
                const practiceAnswersForTopic = userAnswers.filter(answer => {
                    const question = allQuestions.find(q => q.id === answer.questionId);
                    return question?.subject === subject && question?.chapter === chapterInfo.chapter && question?.topic === topicName;
                });
                const practiceAttempted = practiceAnswersForTopic.length;
                const practiceIncorrect = practiceAnswersForTopic.filter(a => !a.isCorrect).length;

                const totalPracticed = plannerData.totalQuestionsPracticed + practiceAttempted;
                const totalIncorrect = plannerData.totalQuestionsIncorrect + practiceIncorrect;
                const accuracy = totalPracticed > 0 ? ((totalPracticed - totalIncorrect) / totalPracticed) * 100 : -1;
                const avgDifficulty = plannerData.difficultyRatings.length > 0 ? plannerData.difficultyRatings.reduce((a, b) => a + b, 0) / plannerData.difficultyRatings.length : 0;
                
                let performanceScore = null;
                if (totalPracticed >= 5 && plannerData.difficultyRatings.length > 0) {
                    const accuracyScore = accuracy === -1 ? 0 : accuracy;
                    performanceScore = (accuracyScore * 0.8) + ((5 - avgDifficulty) * 5);
                }

                if (plannerData.totalTimeSpent > 0 || practiceAttempted > 0) {
                     if (!combinedChapterMap[chapterInfo.chapter]) {
                        combinedChapterMap[chapterInfo.chapter] = { topics: [] };
                    }
                    combinedChapterMap[chapterInfo.chapter].topics.push({
                        topic: topicName, totalTimeSpent: plannerData.totalTimeSpent, avgAccuracy: accuracy, avgDifficulty: avgDifficulty,
                        totalQuestionsPracticed: totalPracticed, totalQuestionsIncorrect: totalIncorrect, performanceScore,
                    });
                }
            });
        });
        
        const analytics = Object.entries(combinedChapterMap).map(([chapter, data]) => {
            const chapterTopics = data.topics || [];
            const chapterTotalTime = chapterTopics.reduce((sum, t) => sum + t.totalTimeSpent, 0);
            const topicsWithScores = chapterTopics.filter(t => t.performanceScore !== null);
            let chapterPerformanceScore: number | null = null;
            if (topicsWithScores.length > 0) {
                const scoreSum = topicsWithScores.reduce((sum, t) => sum + (t.performanceScore || 0), 0);
                chapterPerformanceScore = scoreSum / topicsWithScores.length;
            }
            const chapterTotalPracticed = chapterTopics.reduce((sum, t) => sum + t.totalQuestionsPracticed, 0);
            const chapterTotalIncorrect = chapterTopics.reduce((sum, t) => sum + t.totalQuestionsIncorrect, 0);
            let chapterAccuracy = -1;
            if (chapterTotalPracticed > 0) chapterAccuracy = ((chapterTotalPracticed - chapterTotalIncorrect) / chapterTotalPracticed) * 100;
            return { chapter, totalTime: chapterTotalTime, avgAccuracy: chapterAccuracy, performanceScore: chapterPerformanceScore, topics: chapterTopics };
        });
        return analytics.sort((a,b) => b.totalTime - a.totalTime || a.chapter.localeCompare(b.chapter));
    }, [subject, topicAnalytics, userAnswers, allQuestions]);

    const { strongChapters, weakChapters } = useMemo(() => ({
        strongChapters: subjectAnalytics.filter(c => c.performanceScore !== null && c.performanceScore > 80).map(c => c.chapter),
        weakChapters: subjectAnalytics.filter(c => c.performanceScore !== null && c.performanceScore < 50).map(c => c.chapter),
    }), [subjectAnalytics]);

    const subjectIncorrectAnswers = useMemo(() => userAnswers.filter(a => !a.isCorrect && !solvedIncorrectIds.has(a.questionId) && allQuestions.find(q => q.id === a.questionId)?.subject === subject).reverse(), [userAnswers, allQuestions, subject, solvedIncorrectIds]);
    const subjectBookmarkedQuestions = useMemo(() => bookmarks.filter(b => b.question.subject === subject), [bookmarks, subject]);
    const chapterData = useMemo(() => subjectAnalytics.find(c => c.chapter === selectedChapter), [selectedChapter, subjectAnalytics]);

    const { strongTopics, weakTopics } = useMemo(() => {
        if (!chapterData) return { strongTopics: [], weakTopics: [] };
        return {
            strongTopics: chapterData.topics.filter(t => t.performanceScore !== null && t.performanceScore > 80).map(t => t.topic),
            weakTopics: chapterData.topics.filter(t => t.performanceScore !== null && t.performanceScore < 50).map(t => t.topic),
        };
    }, [chapterData]);

    const AnalysisGroup = ({ title, items, icon, colorClass, type }: { title: string, items: string[], icon: React.ReactNode, colorClass: string, type: 'chapter' | 'topic' }) => (
        <div className="glass-card p-4 rounded-xl mb-6">
            <h3 className={`font-bold text-xl mb-3 flex items-center ${colorClass}`}>
                {icon} {title}
            </h3>
            {items && items.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                    {items.map(item => <span key={item} className="px-3 py-1 bg-black/30 text-[var(--text-primary)] rounded-full text-base font-medium">{item}</span>)}
                </div>
            ) : (
                <div className="text-center py-4 px-2"><p className="text-base text-[var(--text-secondary)]">{type === 'chapter' ? "Practice more to see your strong & weak chapters." : "More data needed for this chapter's topics."}</p></div>
            )}
        </div>
    );

    const TabButton = ({ tab, label, icon, count, active, onClick }: { tab: string, label: string, icon: React.ReactNode, count: number, active: boolean, onClick: () => void }) => (
        <button onClick={onClick} className={`flex items-center space-x-2 px-4 py-2 text-base font-semibold rounded-t-lg border-b-2 transition-colors ${active ? 'border-[var(--glow-cyan)] text-[var(--glow-cyan)]' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            {icon}<span>{label}</span><span className={`px-2 py-0.5 rounded-full text-sm font-bold ${active ? 'bg-[var(--glow-cyan)] bg-opacity-20 text-[var(--glow-cyan)]' : 'bg-white/10 text-[var(--text-secondary)]'}`}>{count}</span>
        </button>
    );

    const renderAnalyticsView = () => (
        <>
            <AnalysisGroup title="Strong Chapters" items={strongChapters} icon={<ShieldCheck size={20} className="mr-2"/>} colorClass="text-green-400" type="chapter" />
            <AnalysisGroup title="Weak Chapters" items={weakChapters} icon={<Zap size={20} className="mr-2"/>} colorClass="text-red-400" type="chapter" />
            <div className="glass-card p-4 rounded-xl">
                <h3 className="font-bold text-xl mb-4 flex items-center"><BarChart size={20} className="mr-2 text-[var(--glow-cyan)]"/>Chapter Breakdown</h3>
                <div className="space-y-3">
                    {subjectAnalytics.length > 0 ? (
                        subjectAnalytics.map(perf => (
                        <button onClick={() => setSelectedChapter(perf.chapter)} key={perf.chapter} className="w-full text-left p-3 bg-black/20 hover:bg-black/40 rounded-md transition-colors flex justify-between items-center">
                            <span className="font-medium text-[var(--text-primary)] flex-1 pr-4 truncate">{perf.chapter}</span>
                        </button>
                    ))) : (
                        <p className="text-base text-[var(--text-secondary)] text-center py-6">No data available. Practice to see your analytics!</p>
                    )}
                </div>
            </div>
        </>
    );
    
    const renderQuestionListView = (type: 'incorrect' | 'bookmarked', items: (UserAnswer | Bookmark)[]) => {
        const emptyMessage = type === 'incorrect' ? "No incorrect answers here. Great job!" : "No bookmarks for this section.";
        if (items.length === 0) return <div className="text-center py-12 glass-card rounded-b-xl rounded-tr-xl"><p className="text-[var(--text-secondary)]">{emptyMessage}</p></div>;
        return (
            <div className="space-y-4 bg-black/20 p-4 rounded-b-xl rounded-tr-xl">
                {items.map(item => 'isCorrect' in item ? 
                    <QuestionReviewCard key={item.questionId + item.timestamp} question={allQuestions.find(q => q.id === item.questionId)!} userAnswer={item} onMarkAsSolved={onMarkAsSolved} /> :
                    <QuestionReviewCard key={item.questionId} question={item.question} onDeleteBookmark={() => onBookmarkToggle(item.questionId, '')} />
                )}
            </div>
        );
    };

    if (selectedTopic && selectedChapter && chapterData) {
        const completedTasksForTopic = tasks.filter(task => task.isCompleted && task.subject === subject && task.chapter === selectedChapter && task.topic === selectedTopic).sort((a, b) => (b.completionData?.completedAt || 0) - (a.completionData?.completedAt || 0));
        return (
            <div className="animate-fade-in">
                <div className="flex items-center mb-4"><button onClick={() => setSelectedTopic(null)} className="p-2 rounded-full hover:bg-white/10 mr-4"><ArrowLeft size={20} /></button><div><h2 className="text-3xl font-bold text-white truncate">{selectedTopic}</h2><p className="text-base text-[var(--text-secondary)]">{selectedChapter}</p></div></div>
                <div className="glass-card p-4 rounded-xl"><h3 className="font-bold text-lg mb-4 text-white">Completed Task History</h3>
                    {completedTasksForTopic.length > 0 ? (
                        <div className="space-y-4">
                            {completedTasksForTopic.map(task => {
                                const data = task.completionData!;
                                const accuracy = data.questionsPracticed && data.questionsPracticed > 0 ? Math.round(((data.questionsPracticed - (data.questionsIncorrect || 0)) / data.questionsPracticed) * 100) : null;
                                return (
                                    <div key={task.id} className="p-4 bg-black/30 rounded-lg"><div className="flex justify-between items-start"><div><p className="font-bold text-white">{task.taskName}</p><span className="text-sm font-medium text-[var(--bg-dark-primary)] px-2 py-0.5 rounded-full bg-[var(--glow-cyan)] opacity-80">{task.taskType}</span></div><p className="text-sm text-[var(--text-secondary)]">{new Date(data.completedAt).toLocaleDateString()}</p></div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
                                            <div><p className="text-sm text-[var(--text-secondary)] font-semibold">Time Spent</p><p className="font-bold text-white">{data.timeSpent} mins</p></div>
                                            <div><p className="text-sm text-[var(--text-secondary)] font-semibold">Difficulty</p><p className="font-bold text-white">{data.difficultyRating}/5</p></div>
                                            {task.taskType === 'Question Practice' && <><div><p className="text-sm text-[var(--text-secondary)] font-semibold">Practiced</p><p className="font-bold text-white">{data.questionsPracticed}</p></div><div><p className="text-sm text-[var(--text-secondary)] font-semibold">Accuracy</p><p className="font-bold text-white">{accuracy !== null ? `${accuracy}%` : 'N/A'}</p></div></>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-base text-[var(--text-secondary)] text-center py-6">No completed tasks found for this topic.</p>}
                </div>
            </div>
        );
    }

    if (selectedChapter && chapterData) {
        const incorrectInChapter = subjectIncorrectAnswers.filter(a => allQuestions.find(q => q.id === a.questionId)?.chapter === selectedChapter);
        const bookmarkedInChapter = subjectBookmarkedQuestions.filter(b => b.question.chapter === selectedChapter);
        const getDifficultyColor = (d: number) => d === 0 ? 'text-gray-400' : d > 3.5 ? 'text-red-400' : d < 2.5 ? 'text-green-400' : 'text-yellow-400';
        const getAccuracyColor = (a: number) => a === -1 ? 'text-gray-400' : a >= 85 ? 'text-green-400' : a < 60 ? 'text-red-400' : 'text-yellow-400';
        return (
            <div className="animate-fade-in"><div className="flex items-center mb-4"><button onClick={() => setSelectedChapter(null)} className="p-2 rounded-full hover:bg-white/10 mr-4"><ArrowLeft size={20} /></button><h2 className="text-3xl font-bold text-white truncate">{selectedChapter}</h2></div>
                <div className="border-b border-[var(--border-color)]"><nav className="-mb-px flex space-x-4"><TabButton tab="analytics" label="Analytics" icon={<BarChart size={16} />} count={chapterData?.topics?.length || 0} active={chapterActiveTab === 'analytics'} onClick={() => setChapterActiveTab('analytics')} /><TabButton tab="incorrect" label="Incorrect" icon={<AlertTriangle size={16} />} count={incorrectInChapter.length} active={chapterActiveTab === 'incorrect'} onClick={() => setChapterActiveTab('incorrect')} /><TabButton tab="bookmarked" label="Bookmarked" icon={<BookmarkIcon size={16} />} count={bookmarkedInChapter.length} active={chapterActiveTab === 'bookmarked'} onClick={() => setChapterActiveTab('bookmarked')} /></nav></div>
                <div className="mt-4">
                    {chapterActiveTab === 'analytics' && <div className="glass-card p-4 rounded-b-xl rounded-tr-xl"><AnalysisGroup title="Strong Topics" items={strongTopics} icon={<ShieldCheck size={20} className="mr-2"/>} colorClass="text-green-400" type="topic" /><AnalysisGroup title="Weak Topics" items={weakTopics} icon={<Zap size={20} className="mr-2"/>} colorClass="text-red-400" type="topic" /><h3 className="font-bold text-xl mb-4 flex items-center text-white"><BarChart size={20} className="mr-2 text-[var(--glow-cyan)]"/>Topic Breakdown</h3><div className="space-y-2 mt-4"><div className="grid grid-cols-3 gap-2 text-sm font-bold text-[var(--text-secondary)] px-3"><span>Topic</span><span className="text-center">Accuracy</span><span className="text-center">Avg. Difficulty</span></div>{chapterData.topics.sort((a,b) => (b.performanceScore ?? -1) - (a.performanceScore ?? -1)).map(topic => <button key={topic.topic} onClick={() => setSelectedTopic(topic.topic)} className="w-full grid grid-cols-3 gap-2 items-center p-3 bg-black/20 rounded-md hover:bg-black/40 transition-colors"><span className="font-medium text-[var(--text-primary)] text-base truncate text-left">{topic.topic}</span><span className={`text-center text-base font-bold ${getAccuracyColor(topic.avgAccuracy)}`}>{topic.avgAccuracy === -1 ? 'N/A' : `${Math.round(topic.avgAccuracy)}%`}</span><span className={`text-center text-base font-bold ${getDifficultyColor(topic.avgDifficulty)}`}>{topic.avgDifficulty === 0 ? 'N/A' : `${topic.avgDifficulty.toFixed(1)}/5`}</span></button>))}</div></div>}
                    {chapterActiveTab === 'incorrect' && renderQuestionListView('incorrect', incorrectInChapter)}
                    {chapterActiveTab === 'bookmarked' && renderQuestionListView('bookmarked', bookmarkedInChapter)}
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in"><div className="flex items-center mb-4"><button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 mr-4"><ArrowLeft size={20} /></button><h2 className="text-3xl font-bold text-white">{subject} Dashboard</h2></div>
            <div className="border-b border-[var(--border-color)]"><nav className="-mb-px flex space-x-4"><TabButton tab="analytics" label="Analytics" icon={<BarChart size={16} />} count={subjectAnalytics.length} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} /><TabButton tab="incorrect" label="Incorrect" icon={<AlertTriangle size={16} />} count={subjectIncorrectAnswers.length} active={activeTab === 'incorrect'} onClick={() => setActiveTab('incorrect')} /><TabButton tab="bookmarked" label="Bookmarked" icon={<BookmarkIcon size={16} />} count={subjectBookmarkedQuestions.length} active={activeTab === 'bookmarked'} onClick={() => setActiveTab('bookmarked')} /></nav></div>
            <div className="mt-4">
                {activeTab === 'analytics' && renderAnalyticsView()}
                {activeTab === 'incorrect' && renderQuestionListView('incorrect', subjectIncorrectAnswers)}
                {activeTab === 'bookmarked' && renderQuestionListView('bookmarked', subjectBookmarkedQuestions)}
            </div>
        </div>
    );
};

export default SubjectDashboard;