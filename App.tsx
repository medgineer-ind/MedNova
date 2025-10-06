import React, { useState, useEffect, useCallback } from 'react';
import PracticeScreen from './components/PracticeScreen';
import DashboardScreen from './components/DashboardScreen';
import DoubtSolverScreen from './components/DoubtSolverScreen';
import HomeScreen from './components/HomeScreen';
import PlannerScreen from './components/PlannerScreen';
import TestPlannerScreen from './components/TestPlannerScreen';
import { Question, UserAnswer, Bookmark, PlannerTask, TopicAnalytics, TestPlan } from './types';
import IntroModal from './components/IntroModal';
import * as db from './services/dbService';

type Screen = 'home' | 'practice' | 'dashboard' | 'doubt' | 'planner' | 'testPlanner';

// Helper to safely load from localStorage, ONLY for migration
const loadFromLocalStorageForMigration = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      if (defaultValue instanceof Set) {
        return new Set(data) as T;
      }
      return data;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
  }
  return defaultValue;
};


const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [prevScreen, setPrevScreen] = useState<Screen>('home');
  const [isLoading, setIsLoading] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [seenQuestionTexts, setSeenQuestionTexts] = useState<Set<string>>(new Set());
  const [solvedIncorrectIds, setSolvedIncorrectIds] = useState<Set<string>>(new Set());
  const [showIntro, setShowIntro] = useState(false);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [topicAnalytics, setTopicAnalytics] = useState<TopicAnalytics>({});
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [selectedSubjectForDashboard, setSelectedSubjectForDashboard] = useState<'Physics' | 'Chemistry' | 'Biology' | null>(null);
  
  const [animationClass, setAnimationClass] = useState('animate-slide-in-3d');


  useEffect(() => {
    const loadAndMigrateData = async () => {
        try {
            const isMigrated = localStorage.getItem('neet_migrated_to_idb');
            if (!isMigrated) {
                console.log("Starting migration from localStorage to IndexedDB...");
                const lsQuestions = loadFromLocalStorageForMigration('neet_questions', []);
                const lsUserAnswers = loadFromLocalStorageForMigration('neet_userAnswers', []);
                const lsBookmarks = loadFromLocalStorageForMigration('neet_bookmarks', []);
                const lsTasks = loadFromLocalStorageForMigration('neet_tasks', []);
                const lsTopicAnalytics = loadFromLocalStorageForMigration('neet_topicAnalytics', {});
                const lsTestPlans = loadFromLocalStorageForMigration('neet_testPlans', []);
                const lsSeenQuestionTexts = Array.from(loadFromLocalStorageForMigration('neet_seenQuestionTexts', new Set()));
                const lsSolvedIncorrectIds = Array.from(loadFromLocalStorageForMigration('neet_solvedIncorrectIds', new Set()));

                await db.addMany(db.STORES.questions, lsQuestions);
                await db.addMany(db.STORES.userAnswers, lsUserAnswers);
                await db.addMany(db.STORES.bookmarks, lsBookmarks);
                await db.addMany(db.STORES.tasks, lsTasks);
                await db.addMany(db.STORES.testPlans, lsTestPlans);
                for (const key in lsTopicAnalytics) {
                    await db.setTopicAnalyticsData(key, lsTopicAnalytics[key]);
                }
                if (lsSeenQuestionTexts.length > 0) await db.setKeyValue('seenQuestionTexts', lsSeenQuestionTexts);
                if (lsSolvedIncorrectIds.length > 0) await db.setKeyValue('solvedIncorrectIds', lsSolvedIncorrectIds);
                
                localStorage.setItem('neet_migrated_to_idb', 'true');
                console.log("Migration complete.");
            }

            // Load all data from IndexedDB
            const [
                dbQuestions, dbUserAnswers, dbBookmarks, dbTasks, dbTopicAnalytics, dbTestPlans,
                dbSeenQuestionTexts, dbSolvedIncorrectIds
            ] = await Promise.all([
                db.getAll<Question>(db.STORES.questions),
                db.getAll<UserAnswer>(db.STORES.userAnswers),
                db.getAll<Bookmark>(db.STORES.bookmarks),
                db.getAll<PlannerTask>(db.STORES.tasks),
                db.getTopicAnalytics(),
                db.getAll<TestPlan>(db.STORES.testPlans),
                db.getKeyValue<string[]>('seenQuestionTexts'),
                db.getKeyValue<string[]>('solvedIncorrectIds')
            ]);

            setQuestions(dbQuestions);
            setUserAnswers(dbUserAnswers);
            setBookmarks(dbBookmarks);
            setTasks(dbTasks.map(task => ({ ...task, priority: task.priority || 'Medium' })));
            setTopicAnalytics(dbTopicAnalytics);
            setTestPlans(dbTestPlans);
            setSeenQuestionTexts(new Set(dbSeenQuestionTexts || []));
            setSolvedIncorrectIds(new Set(dbSolvedIncorrectIds || []));

            setShowIntro(!localStorage.getItem('neet_has_seen_intro'));
        } catch (error) {
            console.error("Failed to load data from IndexedDB:", error);
        } finally {
            setIsLoading(false);
        }
    };

    loadAndMigrateData();
  }, []);

  const handleIntroClose = () => {
    localStorage.setItem('neet_has_seen_intro', 'true');
    setShowIntro(false);
  };

  const handleSessionComplete = useCallback(async (sessionAnswers: UserAnswer[], completedQuestions: Question[]) => {
    await db.addMany(db.STORES.userAnswers, sessionAnswers);
    setUserAnswers(prev => [...prev, ...sessionAnswers]);
    
    const completedQuestionTexts = completedQuestions.map(q => q.questionText);
    const newSeenTexts = new Set([...seenQuestionTexts, ...completedQuestionTexts]);
    await db.setKeyValue('seenQuestionTexts', Array.from(newSeenTexts));
    setSeenQuestionTexts(newSeenTexts);

    handleSetCurrentScreen('dashboard');
  }, [seenQuestionTexts]);

  const handleBookmarkToggle = useCallback(async (questionId: string, note: string) => {
    const existing = bookmarks.find(b => b.questionId === questionId);
    if (existing) {
        await db.deleteOne(db.STORES.bookmarks, questionId);
        setBookmarks(prev => prev.filter(b => b.questionId !== questionId));
    } else {
        const question = questions.find(q => q.id === questionId);
        if(question) {
            const newBookmark = { questionId, note, question };
            await db.putOne(db.STORES.bookmarks, newBookmark);
            setBookmarks(prev => [...prev, newBookmark]);
        }
    }
  }, [bookmarks, questions]);

  const handleAddQuestions = useCallback(async (newQuestions: Question[]) => {
    const existingIds = new Set(questions.map(q => q.id));
    const uniqueNewQuestions = newQuestions.filter(q => !existingIds.has(q.id));
    
    if (uniqueNewQuestions.length > 0) {
        await db.addMany(db.STORES.questions, uniqueNewQuestions);
        setQuestions(prev => [...prev, ...uniqueNewQuestions]);
    }
  }, [questions]);

  const handleMarkAsSolved = useCallback(async (questionId: string) => {
    const newSolvedIds = new Set([...solvedIncorrectIds, questionId]);
    await db.setKeyValue('solvedIncorrectIds', Array.from(newSolvedIds));
    setSolvedIncorrectIds(newSolvedIds);
  }, [solvedIncorrectIds]);

  const handleAddTask = useCallback(async (task: Omit<PlannerTask, 'id' | 'createdAt' | 'isCompleted'>) => {
    const planDateTimestamp = new Date(task.planDate + 'T00:00:00').getTime();
    const newTask: PlannerTask = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: planDateTimestamp,
        isCompleted: false,
    };
    await db.putOne(db.STORES.tasks, newTask);
    setTasks(prev => [...prev, newTask].sort((a, b) => a.createdAt - b.createdAt));
    handleSetCurrentScreen('planner');
  }, []);

  const handleCompleteTask = useCallback(async (taskId: string, completionData: Omit<NonNullable<PlannerTask['completionData']>, 'completedAt'>) => {
    let completedTask: PlannerTask | undefined;
    const finalCompletionData = { ...completionData, completedAt: Date.now() };
    
    const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
            completedTask = { ...task, isCompleted: true, completionData: finalCompletionData };
            return completedTask;
        }
        return task;
    });

    if (completedTask) {
        await db.putOne(db.STORES.tasks, completedTask);
        setTasks(updatedTasks);
        
        const task = completedTask;
        const key = `${task.subject}-${task.chapter}-${task.topic}`;
        
        const newAnalytics = { ...topicAnalytics };
        const current = newAnalytics[key] || {
            totalTimeSpent: 0, totalQuestionsPracticed: 0, totalQuestionsIncorrect: 0, difficultyRatings: [], avgDifficulty: 0, avgAccuracy: 0,
        };
        current.totalTimeSpent += finalCompletionData.timeSpent;
        current.difficultyRatings.push(finalCompletionData.difficultyRating);
        if (task.taskType === 'Question Practice' && finalCompletionData.questionsPracticed) {
            current.totalQuestionsPracticed += finalCompletionData.questionsPracticed;
            current.totalQuestionsIncorrect += finalCompletionData.questionsIncorrect || 0;
        }
        const totalRatings = current.difficultyRatings.reduce((sum, rating) => sum + rating, 0);
        current.avgDifficulty = totalRatings / current.difficultyRatings.length;
        if (current.totalQuestionsPracticed > 0) {
            const correct = current.totalQuestionsPracticed - current.totalQuestionsIncorrect;
            current.avgAccuracy = (correct / current.totalQuestionsPracticed) * 100;
        } else {
            current.avgAccuracy = -1;
        }
        newAnalytics[key] = current;
        
        await db.setTopicAnalyticsData(key, current);
        setTopicAnalytics(newAnalytics);
    }
  }, [tasks, topicAnalytics]);

  const handleCreateTestPlan = useCallback(async (name: string, subjects: ('Physics' | 'Chemistry' | 'Biology')[]) => {
    const syllabusObject = subjects.reduce((acc, subj) => {
      acc[subj] = [];
      return acc;
    }, {} as Partial<Record<'Physics' | 'Chemistry' | 'Biology', any[]>>);

    const newTestPlan: TestPlan = {
      id: crypto.randomUUID(), name, subjects, syllabus: syllabusObject,
      status: 'Planning', createdAt: Date.now(), notes: '',
    };
    await db.putOne(db.STORES.testPlans, newTestPlan);
    setTestPlans(prev => [newTestPlan, ...prev]);
  }, []);
  
  const handleUpdateTestPlan = useCallback(async (updatedPlan: TestPlan) => {
      await db.putOne(db.STORES.testPlans, updatedPlan);
      setTestPlans(prev => prev.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan));
  }, []);

  const handleCompleteTestPlan = useCallback(async (testPlanId: string, completionData: Pick<NonNullable<TestPlan['completionData']>, 'finalAvgDifficulty' | 'finalAvgAccuracy'>) => {
    const planToUpdate = testPlans.find(plan => plan.id === testPlanId);
    if (planToUpdate) {
        const updatedPlan = {
            ...planToUpdate,
            status: 'Completed' as 'Completed',
            completionData: { ...completionData, completedAt: Date.now() }
        };
        await db.putOne(db.STORES.testPlans, updatedPlan);
        setTestPlans(prev => prev.map(p => p.id === testPlanId ? updatedPlan : p));
    }
  }, [testPlans]);
  
  const handleSetCurrentScreen = (screen: Screen) => {
    if (screen === currentScreen) return;
    setPrevScreen(currentScreen);
    if (currentScreen === 'dashboard' && screen !== 'dashboard') {
      setSelectedSubjectForDashboard(null);
    }
    setAnimationClass('animate-fade-out'); // Start fade out
    setTimeout(() => {
        setCurrentScreen(screen);
        setAnimationClass('animate-slide-in-3d'); // Then fade in new screen
    }, 300); // Duration should match animation
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={handleSetCurrentScreen} />;
      case 'practice':
        return <PracticeScreen 
                  onSessionComplete={handleSessionComplete} 
                  bookmarks={bookmarks}
                  onBookmarkToggle={handleBookmarkToggle}
                  onQuestionsGenerated={handleAddQuestions}
                  seenQuestionTexts={seenQuestionTexts}
                />;
      case 'dashboard':
        return <DashboardScreen 
                userAnswers={userAnswers} 
                bookmarks={bookmarks} 
                allQuestions={questions}
                topicAnalytics={topicAnalytics}
                tasks={tasks}
                selectedSubject={selectedSubjectForDashboard}
                onSubjectSelect={setSelectedSubjectForDashboard}
                onBack={() => setSelectedSubjectForDashboard(null)}
                onBookmarkToggle={handleBookmarkToggle}
                solvedIncorrectIds={solvedIncorrectIds}
                onMarkAsSolved={handleMarkAsSolved}
               />;
      case 'doubt':
        return <DoubtSolverScreen />;
      case 'planner':
        return <PlannerScreen tasks={tasks} onAddTask={handleAddTask} onCompleteTask={handleCompleteTask} />;
      case 'testPlanner':
        return <TestPlannerScreen 
                  testPlans={testPlans}
                  topicAnalytics={topicAnalytics}
                  userAnswers={userAnswers}
                  allQuestions={questions}
                  onCreateTestPlan={handleCreateTestPlan}
                  onUpdateTestPlan={handleUpdateTestPlan}
                  onCompleteTestPlan={handleCompleteTestPlan}
                />;
      default:
        return <HomeScreen onNavigate={handleSetCurrentScreen} />;
    }
  };
  
    const NavIcon = ({ SvgComponent }: { SvgComponent: React.FC<React.SVGProps<SVGSVGElement>> }) => (
        <SvgComponent className="h-7 w-7 transition-all duration-300 group-hover:scale-110" />
    );

  const NavItem = ({ screen, icon, label }: { screen: Screen, icon: React.ReactNode, label: string }) => {
    const isActive = currentScreen === screen;
    return (
        <button
          onClick={() => handleSetCurrentScreen(screen)}
          className={`relative flex flex-col items-center justify-center space-y-1 w-full transition-colors duration-300 group ${isActive ? 'text-[var(--glow-cyan)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
          style={{ textShadow: isActive ? `0 0 8px var(--glow-cyan)` : 'none' }}
        >
          {icon}
          <span className="text-sm font-medium tracking-wider">{label}</span>
           {isActive && <div className="absolute -top-1 w-1/2 h-0.5 bg-[var(--glow-cyan)] rounded-full" style={{ boxShadow: '0 0 5px var(--glow-cyan)' }} />}
        </button>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-dark-primary)]">
        <div className="text-center">
            <div className="relative w-24 h-24">
                {/* Nucleus */}
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[var(--glow-cyan)] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_var(--glow-cyan)]"></div>
                {/* Electrons */}
                <div className="absolute inset-0 border-2 border-[var(--border-color)] rounded-full animate-spin" style={{animationDuration: '2s'}}>
                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute inset-2 border-2 border-[var(--border-color)] rounded-full animate-spin" style={{transform: 'rotateY(60deg)', animationDuration: '3s'}}>
                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute inset-2 border-2 border-[var(--border-color)] rounded-full animate-spin" style={{transform: 'rotateY(-60deg)', animationDuration: '2.5s'}}>
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-white rounded-full"></div>
                </div>
            </div>
          <p className="mt-8 text-xl font-semibold text-[var(--text-primary)] tracking-widest uppercase">Initializing Med-Pod...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent min-h-screen h-screen flex flex-col font-sans overflow-hidden">
      {showIntro && <IntroModal onClose={handleIntroClose} />}
      <header className="flex-shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--glow-cyan)]" style={{ filter: 'drop-shadow(0 0 5px var(--glow-cyan))' }}>
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 9.35001C15 8.51001 15 7.64001 13.88 7.05001C12.75 6.46001 11.25 6.46001 10.12 7.05001C9 7.64001 9 8.51001 9 9.35001C9 10.2 9.04 10.97 10.12 11.56C11.25 12.16 12.75 12.16 13.88 11.56C14.96 10.97 15 10.2 15 9.35001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.10999 15.32C9.46999 16.48 10.63 17.26 11.96 17.26C13.29 17.26 14.45 16.48 14.81 15.32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-bold text-white tracking-wider" style={{ textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>NEET Prep AI</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 overflow-y-auto" style={{ perspective: '1000px' }}>
        <div key={currentScreen} className={animationClass}>
            {renderScreen()}
        </div>
      </main>

      <nav className="flex-shrink-0 w-full flex justify-center p-2">
        <div className="w-full max-w-2xl h-16 glass-card rounded-full flex justify-around items-center px-4">
           <NavItem screen="home" icon={<NavIcon SvgComponent={(props) => (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>)}/>} label="Home" />
           <NavItem screen="practice" icon={<NavIcon SvgComponent={(props) => (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>)}/>} label="Practice" />
           <NavItem screen="planner" icon={<NavIcon SvgComponent={(props) => (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>)}/>} label="Planner" />
           <NavItem screen="testPlanner" icon={<NavIcon SvgComponent={(props) => (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>)}/>} label="Tests" />
           <NavItem screen="dashboard" icon={<NavIcon SvgComponent={(props) => (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>)}/>} label="Dashboard" />
           <NavItem screen="doubt" icon={<NavIcon SvgComponent={(props) => (<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>)}/>} label="NEET-Dost" />
        </div>
      </nav>
    </div>
  );
};

export default App;