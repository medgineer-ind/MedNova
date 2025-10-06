
import React, { useState, useMemo } from 'react';
import { PlannerTask, TaskType } from '../types';
import { NEET_SYLLABUS } from '../constants';
import { Plus, ChevronLeft, ChevronRight, Clock, Check, Calendar as CalendarIcon } from 'lucide-react';
import TaskCompletionModal from './TaskCompletionModal';

interface PlannerScreenProps {
  tasks: PlannerTask[];
  onAddTask: (task: Omit<PlannerTask, 'id' | 'createdAt' | 'isCompleted'>) => void;
  onCompleteTask: (taskId: string, completionData: Omit<NonNullable<PlannerTask['completionData']>, 'completedAt'>) => void;
}

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDisplayDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (formatDate(date) === formatDate(today)) return 'Today';
    if (formatDate(date) === formatDate(yesterday)) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

// --- NEW CALENDAR COMPONENT ---
const CalendarView = ({ currentMonth, selectedDate, tasks, onDateSelect, onMonthChange }: {
    currentMonth: Date;
    selectedDate: Date;
    tasks: PlannerTask[];
    onDateSelect: (date: Date) => void;
    onMonthChange: (newMonth: Date) => void;
}) => {
    const taskDays = useMemo(() => new Set(tasks.map(t => t.planDate)), [tasks]);
    const today = new Date();

    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array(startingDayOfWeek).fill(null);

    const changeMonth = (offset: number) => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
        onMonthChange(newMonth);
    };

    return (
        <div className="glass-card p-4 rounded-lg shadow-lg border border-[var(--border-color)] absolute top-full mt-2 left-0 right-0 z-10">
            <div className="flex justify-between items-center mb-2">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-white/10"><ChevronLeft size={20} /></button>
                <span className="font-bold text-white">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-white/10"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-[var(--text-secondary)] mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                {days.map(day => {
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const dateStr = formatDate(date);
                    const isToday = formatDate(date) === formatDate(today);
                    const isSelected = formatDate(date) === formatDate(selectedDate);
                    const hasTasks = taskDays.has(dateStr);

                    return (
                        <button 
                            key={day} 
                            onClick={() => onDateSelect(date)}
                            className={`w-8 h-8 rounded-full text-sm relative transition-colors ${
                                isSelected ? 'bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] font-bold' : 
                                isToday ? 'bg-white/20 text-[var(--glow-cyan)]' : 'hover:bg-white/10 text-[var(--text-primary)]'
                            }`}
                        >
                            {day}
                            {hasTasks && <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-[var(--bg-dark-primary)]' : 'bg-[var(--glow-cyan)]'}`}></div>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const priorityColors: Record<'High' | 'Medium' | 'Low', string> = {
    High: 'bg-red-500',
    Medium: 'bg-yellow-500',
    Low: 'bg-gray-400'
};

const PlannerScreen: React.FC<PlannerScreenProps> = ({ tasks, onAddTask, onCompleteTask }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'type' | 'time'>('default');
  
  // Form State
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Biology'>('Physics');
  const [chapter, setChapter] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('Study');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [planDateForNewTask, setPlanDateForNewTask] = useState(formatDate(selectedDate));


  const [taskToComplete, setTaskToComplete] = useState<PlannerTask | null>(null);

  const chaptersForSubject = useMemo(() => NEET_SYLLABUS[subject] || [], [subject]);
  const topicsForChapter = useMemo(() => {
    const selectedChapter = chaptersForSubject.find(c => c.chapter === chapter);
    return selectedChapter ? selectedChapter.topics : [];
  }, [chapter, chaptersForSubject]);

  const resetForm = () => {
    setSubject('Physics'); setChapter(''); setTopic(''); setTaskName('');
    setTaskType('Study'); setPriority('Medium'); setEstimatedTime(30);
  };
  
  const handleConfirmTask = () => {
    if (chapter && topic && taskName && taskType && estimatedTime > 0 && planDateForNewTask) {
      onAddTask({ subject, chapter, topic, taskName, taskType, priority, estimatedTime, planDate: planDateForNewTask });
      resetForm();
      setView('list');
    } else {
      alert("Please fill all fields.");
    }
  };

  const handleStartCompletion = (task: PlannerTask) => setTaskToComplete(task);
  const handleModalClose = () => setTaskToComplete(null);

  const handleModalSubmit = (completionData: Omit<NonNullable<PlannerTask['completionData']>, 'completedAt'>) => {
    if (taskToComplete) {
      onCompleteTask(taskToComplete.id, completionData);
    }
    setTaskToComplete(null);
  };

  const tasksForSelectedDay = useMemo(() => {
    const dateStr = formatDate(selectedDate);
    return tasks.filter(t => t.planDate === dateStr);
  }, [tasks, selectedDate]);

  const pendingTasks = useMemo(() => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const filtered = tasksForSelectedDay.filter(t => !t.isCompleted);

      return filtered.sort((a, b) => {
           switch (sortBy) {
              case 'priority':
                  return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
              case 'type':
                  return a.taskType.localeCompare(b.taskType);
              case 'time':
                  return b.estimatedTime - a.estimatedTime;
              case 'default':
              default:
                  return a.createdAt - b.createdAt;
          }
      });
  }, [tasksForSelectedDay, sortBy]);

  const completedTasks = tasksForSelectedDay.filter(t => t.isCompleted);

  const { totalEstimatedTime, totalTimeSpent } = useMemo(() => {
    return {
        totalEstimatedTime: tasksForSelectedDay.reduce((sum, task) => sum + task.estimatedTime, 0),
        totalTimeSpent: completedTasks.reduce((sum, task) => sum + (task.completionData?.timeSpent || 0), 0)
    };
  }, [tasksForSelectedDay, completedTasks]);

  const progressStats = useMemo(() => {
    const getStartOfDay = (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };
    const dailyCompleted = completedTasks.length;
    const dailyTotal = tasksForSelectedDay.length;
    const startOfWeek = getStartOfDay(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - selectedDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const weeklyTasks = tasks.filter(task => { const taskDate = new Date(task.planDate + 'T00:00:00'); return taskDate >= startOfWeek && taskDate <= endOfWeek; });
    const weeklyCompleted = weeklyTasks.filter(t => t.isCompleted).length;
    const weeklyTotal = weeklyTasks.length;
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    const monthlyTasks = tasks.filter(task => { const taskDate = new Date(task.planDate + 'T00:00:00'); return taskDate >= startOfMonth && taskDate <= endOfMonth; });
    const monthlyCompleted = monthlyTasks.filter(t => t.isCompleted).length;
    const monthlyTotal = monthlyTasks.length;
    return { daily: { completed: dailyCompleted, total: dailyTotal }, weekly: { completed: weeklyCompleted, total: weeklyTotal }, monthly: { completed: monthlyCompleted, total: monthlyTotal }, };
  }, [selectedDate, tasks, tasksForSelectedDay, completedTasks]);
  
  const futuristicSelect = (value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value:string, label:string}[], disabled=false) => (
      <select value={value} onChange={onChange} disabled={disabled} className="w-full p-3 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none text-[var(--text-primary)] appearance-none disabled:opacity-50">
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
  );

  if (view === 'create') {
    return (
      <div className="glass-card p-6 rounded-2xl animate-fade-in">
        <div className="flex items-center mb-6">
            <button onClick={() => setView('list')} className="p-2 rounded-full hover:bg-white/10 mr-4"> <ChevronLeft size={20} /> </button>
            <h2 className="text-3xl font-bold text-white">Create New Task</h2>
        </div>
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">1. Subject</label>
              {futuristicSelect(subject, e => {setSubject(e.target.value as any); setChapter(''); setTopic('');}, [{value:'Physics', label:'Physics'}, {value:'Chemistry', label:'Chemistry'}, {value:'Biology', label:'Biology'}])}
            </div>
            <div>
              <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">2. Chapter</label>
              {futuristicSelect(chapter, e => {setChapter(e.target.value); setTopic('');}, [{value:"", label:"-- Select Chapter --"}, ...chaptersForSubject.map(c => ({value: c.chapter, label: c.chapter}))], !subject)}
            </div>
          </div>
          <div>
            <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">3. Topic</label>
             {futuristicSelect(topic, e => setTopic(e.target.value), [{value:"", label:"-- Select Topic --"}, ...topicsForChapter.map(t => ({value: t, label: t}))], !chapter)}
          </div>
            <div>
              <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">4. Task Name</label>
              <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="e.g., Read NCERT Chapter" className="w-full p-3 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none" />
            </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">5. Task Type</label>
              {futuristicSelect(taskType, e => setTaskType(e.target.value as TaskType), [{value:'Study', label:'Study'}, {value:'Revision', label:'Revision'}, {value:'Question Practice', label:'Question Practice'}])}
            </div>
            <div>
              <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">6. Priority</label>
              {futuristicSelect(priority, e => setPriority(e.target.value as any), [{value:'High', label:'High'}, {value:'Medium', label:'Medium'}, {value:'Low', label:'Low'}])}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
                <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">7. Estimated Time (minutes)</label>
                <input type="number" value={estimatedTime} onChange={e => setEstimatedTime(Number(e.target.value))} min="5" step="5" className="w-full p-3 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none" />
            </div>
            <div>
                <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">8. Plan Date</label>
                <input type="date" value={planDateForNewTask} onChange={e => setPlanDateForNewTask(e.target.value)} className="w-full p-3 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none text-[var(--text-primary)]" />
            </div>
          </div>
          <button onClick={handleConfirmTask} className="w-full bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors shadow-[0_0_15px_var(--glow-cyan)]">Confirm Task</button>
        </div>
      </div>
    );
  }

  const TaskCard = ({ task }: { task: PlannerTask }) => (
    <li className={`p-4 rounded-lg flex items-center justify-between transition-colors relative overflow-hidden ${task.isCompleted ? 'bg-green-900/40' : 'bg-black/20 hover:bg-black/40'}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${priorityColors[task.priority] || 'bg-transparent'}`} style={{boxShadow: `0 0 5px ${priorityColors[task.priority]}`}}></div>
        <div className="pl-4 flex-grow">
            <p className={`font-bold ${task.isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>{task.taskName} <span className="ml-2 text-sm font-medium text-[var(--bg-dark-primary)] px-2 py-0.5 rounded-full bg-[var(--glow-cyan)] opacity-80">{task.taskType}</span></p>
            <p className="text-base text-[var(--text-secondary)]">{task.topic}, {task.chapter}</p>
            <p className="text-base text-[var(--text-secondary)] flex items-center mt-1"><Clock size={14} className="mr-1.5"/>~{task.estimatedTime} mins</p>
        </div>
        {!task.isCompleted && (
            <button onClick={() => handleStartCompletion(task)} className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors ml-4 shadow-[0_0_10px_rgba(34,197,94,0.7)]" title="Mark as Completed">
                <Check size={20} />
            </button>
        )}
    </li>
  );

  const ProgressBar = ({ label, completed, total }: { label: string, completed: number, total: number }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-base font-semibold text-[var(--text-secondary)]">{label}</span>
                <span className="text-base font-bold text-white">{completed} / {total}</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2.5">
                <div 
                    className="bg-[var(--glow-cyan)] h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%`, boxShadow: '0 0 8px var(--glow-cyan)' }}
                ></div>
            </div>
        </div>
    );
  };

  return (
    <div className="animate-fade-in">
        {taskToComplete && <TaskCompletionModal task={taskToComplete} onClose={handleModalClose} onComplete={handleModalSubmit} />}
        
        <div className="glass-card p-4 rounded-2xl mb-6">
            <div className="flex justify-between items-center relative">
                <button 
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="flex items-center space-x-2 text-2xl font-bold text-white p-2 rounded-lg hover:bg-white/10"
                >
                    <CalendarIcon size={22} className="text-[var(--glow-cyan)]" />
                    <span>{getDisplayDate(selectedDate)}</span>
                </button>

                {isCalendarOpen && (
                    <CalendarView 
                        currentMonth={calendarMonth}
                        selectedDate={selectedDate}
                        tasks={tasks}
                        onDateSelect={(date) => {
                            setSelectedDate(date);
                            setCalendarMonth(date);
                            setIsCalendarOpen(false);
                        }}
                        onMonthChange={setCalendarMonth}
                    />
                )}
                
                <button 
                    onClick={() => {
                        const today = new Date();
                        setSelectedDate(today);
                        setCalendarMonth(today);
                    }} 
                    className="text-base font-semibold text-[var(--glow-cyan)] hover:underline"
                >
                    Go to Today
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border-color)]">
                <div className="text-center">
                    <p className="text-base font-semibold text-[var(--text-secondary)]">Estimated</p>
                    <p className="text-3xl font-bold text-white">{totalEstimatedTime} <span className="text-base font-medium">mins</span></p>
                </div>
                 <div className="text-center">
                    <p className="text-base font-semibold text-[var(--text-secondary)]">Spent</p>
                    <p className="text-3xl font-bold text-green-400">{totalTimeSpent} <span className="text-base font-medium">mins</span></p>
                </div>
            </div>
        </div>

        <div className="glass-card p-4 rounded-2xl mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Progress Report</h3>
            <div className="space-y-4">
                <ProgressBar label="Today's Progress" completed={progressStats.daily.completed} total={progressStats.daily.total} />
                <ProgressBar label="This Week's Progress" completed={progressStats.weekly.completed} total={progressStats.weekly.total} />
                <ProgressBar label="This Month's Progress" completed={progressStats.monthly.completed} total={progressStats.monthly.total} />
            </div>
        </div>

        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-white">Daily Tasks</h3>
            <button 
                onClick={() => {
                    setPlanDateForNewTask(formatDate(selectedDate));
                    setView('create');
                }} 
                className="bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] font-semibold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors flex items-center space-x-2 shadow-[0_0_10px_var(--glow-cyan)]"
            >
                <Plus size={18} /><span>Create Task</span>
            </button>
        </div>
        
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-[var(--text-secondary)]">Pending ({pendingTasks.length})</h4>
                    {pendingTasks.length > 0 && (
                      <div className="flex items-center">
                          <label htmlFor="sort-tasks" className="text-base font-medium text-[var(--text-secondary)] mr-2">Sort by:</label>
                           {futuristicSelect(sortBy, e => setSortBy(e.target.value as any), [
                               {value: 'default', label: 'Default'},
                               {value: 'priority', label: 'Priority'},
                               {value: 'type', label: 'Task Type'},
                               {value: 'time', label: 'Time (High-Low)'}
                           ])}
                      </div>
                    )}
                </div>
                {pendingTasks.length > 0 ? <ul className="space-y-3">{pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}</ul> : <p className="text-base text-[var(--text-secondary)] text-center py-4 glass-card rounded-lg">No pending tasks for this day.</p>}
            </div>
             <div>
                <h4 className="font-bold text-[var(--text-secondary)] mb-2">Completed ({completedTasks.length})</h4>
                {completedTasks.length > 0 ? <ul className="space-y-3">{completedTasks.map(task => <TaskCard key={task.id} task={task} />)}</ul> : <p className="text-base text-[var(--text-secondary)] text-center py-4 glass-card rounded-lg">No tasks completed for this day.</p>}
            </div>
        </div>
    </div>
  );
};

export default PlannerScreen;