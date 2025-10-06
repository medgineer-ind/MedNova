
import React, { useState, useMemo } from 'react';
import { TestPlan, TestChapter, TestTopic, TopicAnalytics, UserAnswer, Question } from '../types';
import { Plus, ChevronLeft, Trash2, CheckCircle, BarChart, Zap, ShieldCheck, PlusCircle } from 'lucide-react';
import { NEET_SYLLABUS } from '../constants';
import TestCompletionModal from './TestCompletionModal';
import LogPracticeModal from './LogPracticeModal';

type Subject = 'Physics' | 'Chemistry' | 'Biology';
const ALL_SUBJECTS: Subject[] = ['Physics', 'Chemistry', 'Biology'];

interface TestPlannerScreenProps {
  testPlans: TestPlan[];
  topicAnalytics: TopicAnalytics;
  userAnswers: UserAnswer[];
  allQuestions: Question[];
  onCreateTestPlan: (name: string, subjects: Subject[]) => void;
  onUpdateTestPlan: (updatedPlan: TestPlan) => void;
  onCompleteTestPlan: (testPlanId: string, completionData: { finalAvgDifficulty: number, finalAvgAccuracy: number }) => void;
}

const TestPlannerScreen: React.FC<TestPlannerScreenProps> = ({
  testPlans, topicAnalytics, userAnswers, allQuestions,
  onCreateTestPlan, onUpdateTestPlan, onCompleteTestPlan
}) => {
  const [selectedTest, setSelectedTest] = useState<TestPlan | null>(null);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [testToComplete, setTestToComplete] = useState<TestPlan | null>(null);
  const [logPracticeFor, setLogPracticeFor] = useState<{ subject: Subject; chapterName: string; topicName: string } | null>(null);

  const [testName, setTestName] = useState('');
  const [testSubjects, setTestSubjects] = useState<Subject[]>([]);

  const getDifficultyColor = (d: number) => d === 0 ? 'text-gray-400 bg-black/20' : d > 3.5 ? 'text-red-300 bg-red-900/50' : d < 2.5 ? 'text-green-300 bg-green-900/50' : 'text-yellow-300 bg-yellow-900/50';
  const getAccuracyColor = (a: number) => a === -1 ? 'text-gray-400 bg-black/20' : a >= 85 ? 'text-green-300 bg-green-900/50' : a < 60 ? 'text-red-300 bg-red-900/50' : 'text-yellow-300 bg-yellow-900/50';
  
  const handleSubjectToggle = (subject: Subject) => setTestSubjects(p => p.includes(subject) ? p.filter(s => s !== subject) : [...p, subject]);
  const handleCreateTest = () => { if (testName.trim() && testSubjects.length > 0) { onCreateTestPlan(testName.trim(), testSubjects); setTestName(''); setTestSubjects([]); setView('list'); } };

  const getTopicPerformance = (subject: Subject, chapter: string, topic: string) => {
    const key = `${subject}-${chapter}-${topic}`;
    const plannerData = topicAnalytics[key];
    const practiceAnswers = userAnswers.filter(a => { const q = allQuestions.find(q => q.id === a.questionId); return q?.subject === subject && q?.chapter === chapter && q?.topic === topic; });
    const totalPracticed = (plannerData?.totalQuestionsPracticed || 0) + practiceAnswers.length;
    const totalIncorrect = (plannerData?.totalQuestionsIncorrect || 0) + practiceAnswers.filter(a => !a.isCorrect).length;
    const accuracy = totalPracticed > 0 ? ((totalPracticed - totalIncorrect) / totalPracticed) * 100 : -1;
    const difficulty = plannerData?.avgDifficulty || 0;
    return { accuracy, difficulty };
  };

  const handleAddChapter = (subject: Subject, chapterName: string) => {
    if (!selectedTest) return;
    const subjectSyllabus = selectedTest.syllabus[subject] || [];
    if (subjectSyllabus.some(c => c.chapterName === chapterName)) return;
    const chapterInfo = NEET_SYLLABUS[subject].find(c => c.chapter === chapterName);
    if (!chapterInfo) return;
    const newTestChapter: TestChapter = { chapterName, topics: chapterInfo.topics.map(topicName => { const { accuracy, difficulty } = getTopicPerformance(subject, chapterName, topicName); return { topicName, historicalAccuracy: accuracy, historicalDifficulty: difficulty, isRevised: false }; }) };
    const updatedPlan = { ...selectedTest, syllabus: { ...selectedTest.syllabus, [subject]: [...subjectSyllabus, newTestChapter] } };
    onUpdateTestPlan(updatedPlan);
    setSelectedTest(updatedPlan);
  };
  
  const handleToggleTopicRevised = (subject: Subject, chapterName: string, topicName: string) => {
      if (!selectedTest) return;
      const updatedSyllabus = { ...selectedTest.syllabus };
      // FIX: Explicitly type `c` as TestChapter to help TypeScript infer the correct type and prevent errors.
      const subjectSyllabus = updatedSyllabus[subject]?.map((c: TestChapter) => c.chapterName === chapterName ? { ...c, topics: c.topics.map(t => t.topicName === topicName ? { ...t, isRevised: !t.isRevised } : t) } : c);
      updatedSyllabus[subject] = subjectSyllabus;
      const updatedPlan = { ...selectedTest, syllabus: updatedSyllabus };
      onUpdateTestPlan(updatedPlan);
      setSelectedTest(updatedPlan);
  };

  const handleLogPractice = (subject: Subject, chapterName: string, topicName: string, data: { questionsPracticed: number; questionsCorrect: number }) => {
    if (!selectedTest) return;
    const updatedSyllabus = { ...selectedTest.syllabus };
    // FIX: Explicitly type `c` as TestChapter to help TypeScript infer the correct type and prevent errors.
    const subjectSyllabus = updatedSyllabus[subject]?.map((c: TestChapter) => c.chapterName === chapterName ? { ...c, topics: c.topics.map(t => t.topicName === topicName ? { ...t, practiceData: { questionsPracticed: (t.practiceData?.questionsPracticed || 0) + data.questionsPracticed, questionsCorrect: (t.practiceData?.questionsCorrect || 0) + data.questionsCorrect } } : t) } : c);
    updatedSyllabus[subject] = subjectSyllabus;
    const updatedPlan = { ...selectedTest, syllabus: updatedSyllabus };
    onUpdateTestPlan(updatedPlan);
    setSelectedTest(updatedPlan);
  };

  const handleDeleteChapter = (subject: Subject, chapterName: string) => {
      if (!selectedTest) return;
      const updatedSubjectSyllabus = selectedTest.syllabus[subject]?.filter(c => c.chapterName !== chapterName);
      const updatedPlan = { ...selectedTest, syllabus: { ...selectedTest.syllabus, [subject]: updatedSubjectSyllabus } };
      onUpdateTestPlan(updatedPlan);
      setSelectedTest(updatedPlan);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedTest) return;
    const updatedPlan = { ...selectedTest, notes: e.target.value };
    setSelectedTest(updatedPlan); 
    onUpdateTestPlan(updatedPlan);
  };
  
  const getAvailableChapters = (subject: Subject) => {
    if (!selectedTest) return [];
    const syllabusChapters = new Set(selectedTest.syllabus[subject]?.map(c => c.chapterName) || []);
    return NEET_SYLLABUS[subject].filter(c => !syllabusChapters.has(c.chapter)).map(c => c.chapter);
  };

  const testPracticeStats = useMemo(() => {
    if (!selectedTest) return null;
    let totalPracticed = 0, totalCorrect = 0;
    Object.values(selectedTest.syllabus).flat().forEach(c => c.topics.forEach(t => { if(t.practiceData) { totalPracticed += t.practiceData.questionsPracticed; totalCorrect += t.practiceData.questionsCorrect; } }));
    return { totalPracticed, totalCorrect, totalIncorrect: totalPracticed - totalCorrect, accuracy: totalPracticed > 0 ? Math.round((totalCorrect / totalPracticed) * 100) : 0 };
  }, [selectedTest]);

  if (view === 'create') {
    return (
      <div className="glass-card p-6 rounded-2xl animate-fade-in">
        <div className="flex items-center mb-6"><button onClick={() => setView('list')} className="p-2 rounded-full hover:bg-white/10 mr-4"><ChevronLeft size={20} /></button><h2 className="text-3xl font-bold text-white">Create New Test Plan</h2></div>
        <div className="space-y-6">
          <div><label className="block text-base font-bold text-[var(--text-secondary)] mb-2">Test Name</label><input type="text" value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g., Full Syllabus Mock 1" className="w-full p-3 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none" /></div>
          <div><label className="block text-base font-bold text-[var(--text-secondary)] mb-2">Subjects</label>
            <div className="grid grid-cols-3 gap-2">{ALL_SUBJECTS.map(s => <label key={s} className={`flex items-center space-x-2 p-3 rounded-md border-2 cursor-pointer transition-all ${testSubjects.includes(s) ? 'bg-[var(--glow-cyan)]/10 border-[var(--glow-cyan)]' : 'bg-black/20 border-transparent'}`}><input type="checkbox" checked={testSubjects.includes(s)} onChange={() => handleSubjectToggle(s)} className="appearance-none h-4 w-4 border-2 border-[var(--border-color)] rounded-sm bg-[var(--bg-dark-primary)] checked:bg-[var(--glow-cyan)] checked:border-transparent focus:outline-none" /><span className="text-base font-medium text-[var(--text-primary)]">{s}</span></label>)}</div>
          </div>
          <button onClick={handleCreateTest} disabled={!testName.trim() || testSubjects.length === 0} className="w-full bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_var(--glow-cyan)]">Create Test Plan</button>
        </div>
      </div>
    );
  }

  if (selectedTest) {
    const { status } = selectedTest;
    const allTopics = Object.values(selectedTest.syllabus).flat().flatMap(c => c.topics);
    const totalTopics = allTopics.length;
    const revisedTopics = allTopics.filter(t => t.isRevised).length;
    const prepProgress = totalTopics > 0 ? (revisedTopics / totalTopics) * 100 : 0;
    const weakTopics = allTopics.filter(t => t.historicalAccuracy !== -1 && t.historicalAccuracy < 60);
    const strongTopics = allTopics.filter(t => t.historicalAccuracy !== -1 && t.historicalAccuracy > 85);
    return (
        <div className="animate-fade-in">
            {testToComplete && <TestCompletionModal testPlan={testToComplete} onClose={() => setTestToComplete(null)} onComplete={(data) => { onCompleteTestPlan(testToComplete.id, data); setTestToComplete(null); setSelectedTest(p => p ? {...p, status: 'Completed', completionData: {...data, completedAt: Date.now()}} : null); }} />}
            {logPracticeFor && <LogPracticeModal topicName={logPracticeFor.topicName} onClose={() => setLogPracticeFor(null)} onSave={(data) => { handleLogPractice(logPracticeFor.subject, logPracticeFor.chapterName, logPracticeFor.topicName, data); setLogPracticeFor(null); }} />}
            <div className="flex items-center mb-4"><button onClick={() => setSelectedTest(null)} className="p-2 rounded-full hover:bg-white/10 mr-4"><ChevronLeft size={20} /></button><div><h2 className="text-3xl font-bold text-white">{selectedTest.name}</h2><span className={`text-base font-semibold px-2 py-0.5 rounded-full ${status === 'Planning' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-green-900/50 text-green-300'}`}>{status}</span></div></div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="glass-card p-4 rounded-xl"><h3 className="font-bold text-xl mb-4 text-white">Preparation Summary</h3><div className="space-y-4"><div><div className="flex justify-between items-center mb-1"><span className="text-base font-semibold text-[var(--text-secondary)]">Revision Progress</span><span className="text-base font-bold text-white">{revisedTopics} / {totalTopics}</span></div><div className="w-full bg-black/30 rounded-full h-2.5"><div className="bg-[var(--glow-cyan)] h-2.5 rounded-full" style={{ width: `${prepProgress}%`, boxShadow:'0 0 8px var(--glow-cyan)' }}></div></div></div>{status === 'Completed' && selectedTest.completionData && <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]"><div className="text-center"><p className="text-sm text-[var(--text-secondary)] font-semibold">Final Accuracy</p><p className="font-bold text-lg text-white">{selectedTest.completionData.finalAvgAccuracy}%</p></div><div className="text-center"><p className="text-sm text-[var(--text-secondary)] font-semibold">Final Difficulty</p><p className="font-bold text-lg text-white">{selectedTest.completionData.finalAvgDifficulty}/5</p></div></div>}</div></div>
                <div className="glass-card p-4 rounded-xl"><h3 className="font-bold text-xl mb-4 text-white">Test Practice Stats</h3>{testPracticeStats && testPracticeStats.totalPracticed > 0 ? <div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-sm text-[var(--text-secondary)] font-semibold">Accuracy</p><p className="font-bold text-xl text-[var(--glow-cyan)]">{testPracticeStats.accuracy}%</p></div><div className="text-center"><p className="text-sm text-[var(--text-secondary)] font-semibold">Practiced</p><p className="font-bold text-xl text-white">{testPracticeStats.totalPracticed}</p></div><div className="text-center"><p className="text-sm text-[var(--text-secondary)] font-semibold">Correct</p><p className="font-bold text-xl text-green-400">{testPracticeStats.totalCorrect}</p></div><div className="text-center"><p className="text-sm text-[var(--text-secondary)] font-semibold">Incorrect</p><p className="font-bold text-xl text-red-400">{testPracticeStats.totalIncorrect}</p></div></div> : <p className="text-center text-base text-[var(--text-secondary)] pt-6">Log practice sessions to see stats.</p>}</div>
            </div>
            <div className="glass-card p-4 rounded-xl mb-6"><h3 className="font-bold text-lg mb-3 text-white">Preparation Notes</h3><textarea value={selectedTest.notes || ''} onChange={handleNotesChange} placeholder="Add strategies, important formulas..." className="w-full h-24 p-2 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md text-base focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] disabled:bg-black/20 text-[var(--text-primary)]" disabled={status === 'Completed'} /></div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="glass-card p-4 rounded-md"><h3 className="font-bold text-xl mb-3 flex items-center text-green-400"><ShieldCheck size={20} className="mr-2"/> Strong Topics ({strongTopics.length})</h3><div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">{strongTopics.map(t => <span key={t.topicName} className="text-sm font-medium bg-green-900/50 text-green-300 px-2 py-1 rounded-full">{t.topicName}</span>)}</div></div>
                <div className="glass-card p-4 rounded-md"><h3 className="font-bold text-xl mb-3 flex items-center text-red-400"><Zap size={20} className="mr-2"/> Weak Topics ({weakTopics.length})</h3><div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">{weakTopics.map(t => <span key={t.topicName} className="text-sm font-medium bg-red-900/50 text-red-300 px-2 py-1 rounded-full">{t.topicName}</span>)}</div></div>
            </div>
            <div><h3 className="text-2xl font-bold text-white mb-4">Syllabus</h3><div className="space-y-6">
            {selectedTest.subjects.map(subject => {
                const subjectChapters = selectedTest.syllabus[subject] || [];
                const subjectStats = subjectChapters.reduce((acc, c) => { c.topics.forEach(t => { if (t.practiceData) { acc.practiced += t.practiceData.questionsPracticed; acc.correct += t.practiceData.questionsCorrect; } }); return acc; }, { practiced: 0, correct: 0 });
                const subjectAccuracy = subjectStats.practiced > 0 ? Math.round((subjectStats.correct / subjectStats.practiced) * 100) : null;
                return (
                    <div key={subject} className="glass-card p-4 rounded-xl"><div className="flex justify-between items-center mb-3"><h4 className="font-bold text-xl text-[var(--glow-cyan)]">{subject}</h4>{subjectAccuracy !== null && <div className="text-right"><p className="text-sm font-semibold text-[var(--text-secondary)]">Practice Accuracy</p><p className="font-bold text-[var(--glow-cyan)]">{subjectAccuracy}% <span className="text-sm font-normal text-[var(--text-secondary)]">({subjectStats.correct}/{subjectStats.practiced})</span></p></div>}</div>
                    {status === 'Planning' && <div className="flex items-center space-x-2 mb-4"><select onChange={(e) => handleAddChapter(subject, e.target.value)} className="w-full p-2 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md text-base appearance-none" value=""><option value="" disabled>-- Add a chapter to {subject} --</option>{getAvailableChapters(subject).map(c => <option key={c} value={c}>{c}</option>)}</select></div>}
                    <div className="space-y-4">
                        {subjectChapters.length > 0 ? subjectChapters.map(chapter => {
                            const chapterStats = chapter.topics.reduce((acc, t) => { if (t.practiceData) { acc.practiced += t.practiceData.questionsPracticed; acc.correct += t.practiceData.questionsCorrect; } return acc; }, { practiced: 0, correct: 0 });
                            const chapterAccuracy = chapterStats.practiced > 0 ? Math.round((chapterStats.correct / chapterStats.practiced) * 100) : null;
                            return (
                                <div key={chapter.chapterName} className="bg-black/30 p-3 rounded-lg border border-[var(--border-color)]/50"><div className="flex justify-between items-start mb-3"><div><h5 className="font-semibold text-white">{chapter.chapterName}</h5>{chapterAccuracy !== null && <p className="text-sm font-semibold text-[var(--text-secondary)]">{chapterAccuracy}% accuracy ({chapterStats.correct}/{chapterStats.practiced})</p>}</div>{status === 'Planning' && <button onClick={() => handleDeleteChapter(subject, chapter.chapterName)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16} /></button>}</div>
                                    <div className="space-y-2">{chapter.topics.map(topic => (
                                        <div key={topic.topicName} className={`p-2 rounded-md transition-colors ${topic.isRevised ? 'bg-green-900/40' : 'hover:bg-black/20'}`}><div className="flex items-center space-x-2"><input type="checkbox" checked={topic.isRevised} onChange={() => handleToggleTopicRevised(subject, chapter.chapterName, topic.topicName)} className="appearance-none h-4 w-4 border-2 border-[var(--border-color)] rounded-sm bg-[var(--bg-dark-primary)] checked:bg-green-500 checked:border-transparent flex-shrink-0" disabled={status === 'Completed'} /><span className="text-base text-[var(--text-primary)] flex-1 truncate" title={topic.topicName}>{topic.topicName}</span><div className="flex items-center space-x-2 flex-shrink-0"><span className={`text-sm font-bold px-2 py-0.5 rounded-full ${getAccuracyColor(topic.historicalAccuracy)}`}>{topic.historicalAccuracy===-1?'N/A':`${Math.round(topic.historicalAccuracy)}%`}</span><span className={`text-sm font-bold px-2 py-0.5 rounded-full ${getDifficultyColor(topic.historicalDifficulty)}`}>{topic.historicalDifficulty===0?'N/A':`${topic.historicalDifficulty.toFixed(1)}/5`}</span>{topic.practiceData && <span className="text-sm font-semibold text-[var(--text-secondary)]">{topic.practiceData.questionsCorrect}/{topic.practiceData.questionsPracticed}</span>}<button disabled={status==='Completed'} onClick={() => setLogPracticeFor({subject, chapterName: chapter.chapterName, topicName: topic.topicName})} className="text-[var(--glow-cyan)] hover:opacity-80 disabled:text-gray-600 disabled:cursor-not-allowed"><PlusCircle size={18} /></button></div></div></div>
                                    ))}</div>
                                </div>
                            )
                        }) : <p className="text-center text-base text-[var(--text-secondary)] py-4">No chapters added for {subject} yet.</p>}
                    </div></div>
                )
            })}
            </div>{status === 'Planning' && allTopics.length > 0 && <button onClick={() => setTestToComplete(selectedTest)} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(34,197,94,0.6)]"><CheckCircle size={20} /><span>Finalize Preparation</span></button>}</div>
        </div>
    );
  }

  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-4"><h2 className="text-3xl font-bold text-white">Test Architect</h2><button onClick={() => setView('create')} className="bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] font-semibold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors flex items-center space-x-2 shadow-[0_0_10px_var(--glow-cyan)]"><Plus size={18} /><span>Create New Plan</span></button></div>
        <div className="space-y-4">
            {testPlans.length > 0 ? testPlans.map(plan => (
                <button key={plan.id} onClick={() => setSelectedTest(plan)} className="w-full text-left glass-card p-4 rounded-xl flex justify-between items-center glass-card-hover">
                    <div><p className="font-bold text-white">{plan.name}</p><p className="text-base text-[var(--text-secondary)]">{plan.subjects.join(', ')}</p></div>
                    <span className={`text-base font-semibold px-3 py-1 rounded-full ${plan.status === 'Planning' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-green-900/50 text-green-300'}`}>{plan.status}</span>
                </button>
            )) : <p className="text-center text-[var(--text-secondary)] py-10 glass-card rounded-xl">You haven't created any test plans yet.</p>}
        </div>
    </div>
  );
};

export default TestPlannerScreen;