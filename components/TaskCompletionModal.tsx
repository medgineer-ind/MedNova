
import React, { useState, useEffect } from 'react';
import { PlannerTask } from '../types';
import { X, CheckCircle, Play, Pause, RefreshCw } from 'lucide-react';

interface TaskCompletionModalProps {
  task: PlannerTask;
  onClose: () => void;
  onComplete: (completionData: Omit<NonNullable<PlannerTask['completionData']>, 'completedAt'>) => void;
}

const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({ task, onClose, onComplete }) => {
  const [timeSpent, setTimeSpent] = useState(task.estimatedTime);
  const [difficulty, setDifficulty] = useState(3);
  const [questionsPracticed, setQuestionsPracticed] = useState(10);
  const [questionsIncorrect, setQuestionsIncorrect] = useState(2);
  
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0); 
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimeElapsed(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  const handleToggleTimer = () => setIsTimerActive(!isTimerActive);
  const handleResetTimer = () => { setIsTimerActive(false); setTimeElapsed(0); };
  const handleSetTimeFromTimer = () => {
    setIsTimerActive(false);
    const minutes = Math.ceil(timeElapsed / 60);
    setTimeSpent(minutes > 0 ? minutes : 1);
    setShowTimer(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (task.taskType === 'Question Practice' && questionsIncorrect > questionsPracticed) {
        alert("Incorrect questions cannot be more than practiced questions.");
        return;
    }
    onComplete({
      timeSpent, difficultyRating: difficulty,
      ...(task.taskType === 'Question Practice' && { questionsPracticed, questionsIncorrect }),
    });
  };
  
  const futuristicInput = (type: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min: number, step?: number) => (
      <input type={type} value={value} onChange={onChange} min={min} step={step} className="w-full p-2 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none" />
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-md w-full border-2 border-[var(--glow-cyan)]/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Complete Task</h2>
          <button onClick={onClose} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <p className="font-semibold text-[var(--text-primary)] mb-1">{task.taskName}</p>
        <p className="text-base text-[var(--text-secondary)] mb-6">{task.topic}</p>
        
        <div className="space-y-5">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-base font-bold text-[var(--text-secondary)]">Time Spent (minutes)</label>
                    {!showTimer && <button onClick={() => setShowTimer(true)} className="text-sm text-[var(--glow-cyan)] hover:underline font-semibold">Use Stopwatch</button>}
                </div>
                {showTimer ? (
                    <div className="bg-black/30 p-4 rounded-lg text-center">
                        <p className="text-4xl font-mono font-bold text-white tracking-widest">{formatTime(timeElapsed)}</p>
                        <div className="flex justify-center space-x-3 mt-4">
                            <button onClick={handleToggleTimer} className={`px-4 py-2 rounded-md font-semibold text-white flex items-center space-x-2 ${isTimerActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>
                                {isTimerActive ? <Pause size={16}/> : <Play size={16} />}<span>{isTimerActive ? 'Pause' : 'Start'}</span>
                            </button>
                            <button onClick={handleResetTimer} className="p-2.5 rounded-md font-semibold bg-red-500 text-white hover:bg-red-600"><RefreshCw size={16}/></button>
                        </div>
                        <button onClick={handleSetTimeFromTimer} className="w-full mt-4 bg-[var(--glow-cyan)]/80 text-white font-semibold py-2 rounded-lg hover:bg-[var(--glow-cyan)] transition-colors">Use This Time</button>
                    </div>
                ) : futuristicInput('number', timeSpent, e => setTimeSpent(Number(e.target.value)), 1) }
            </div>
            <div>
                 <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">Difficulty Level of Topic (1-5)</label>
                 <div className="flex justify-between items-center"><span className="text-sm text-green-400">Easy</span>
                    <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full mx-4" />
                    <span className="text-sm text-red-400">Hard</span>
                 </div>
                 <p className="text-center font-bold text-[var(--glow-cyan)] mt-1">{difficulty}</p>
            </div>
            {task.taskType === 'Question Practice' && (
                <>
                    <div>
                        <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">Questions Practiced?</label>
                        {futuristicInput('number', questionsPracticed, e => setQuestionsPracticed(Number(e.target.value)), 1)}
                    </div>
                    <div>
                        <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">Incorrect Count?</label>
                        {futuristicInput('number', questionsIncorrect, e => setQuestionsIncorrect(Number(e.target.value)), 0)}
                    </div>
                </>
            )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-8 bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(34,197,94,0.6)]"
        >
          <CheckCircle size={20} />
          <span>Mark as Completed</span>
        </button>
      </div>
    </div>
  );
};

export default TaskCompletionModal;