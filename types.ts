export interface Question {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Biology';
  chapter: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  type: 'MCQ' | 'Assertion-Reason' | 'Statement-based';
  source: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface Bookmark {
    questionId: string;
    note: string;
    question: Question;
}

export interface TopicPerformance {
  topic: string;
  accuracy: number;
  questionsAttempted: number;
  timePerQuestion: number; // in seconds
}

export interface AnalyticsData {
  overallAccuracy: number;
  totalQuestionsAttempted: number;
  strongTopics: TopicPerformance[];
  weakTopics: TopicPerformance[];
  performanceHistory: { date: string; accuracy: number }[];
}

export interface SyllabusChapter {
  chapter: string;
  topics: string[];
}

// --- NEW PLANNER TYPES ---
export type TaskType = 'Study' | 'Revision' | 'Question Practice';

export interface PlannerTask {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Biology';
  chapter: string;
  topic: string;
  taskName: string;
  taskType: TaskType;
  priority: 'High' | 'Medium' | 'Low';
  estimatedTime: number; // in minutes
  planDate: string; // YYYY-MM-DD format
  createdAt: number; // timestamp
  isCompleted: boolean;
  completionData?: {
    completedAt: number; // timestamp
    timeSpent: number; // in minutes
    difficultyRating: number; // 1-5
    questionsPracticed?: number;
    questionsIncorrect?: number;
  };
}

export interface TopicAnalytics {
  [topicKey: string]: { // key is `${subject}-${chapter}-${topic}`
    totalTimeSpent: number; // in minutes
    totalQuestionsPracticed: number;
    totalQuestionsIncorrect: number;
    difficultyRatings: number[];
    // Calculated values
    avgDifficulty: number;
    avgAccuracy: number;
  };
}

// --- NEW TEST PLANNER TYPES ---
export interface TestTopic {
  topicName: string;
  historicalAccuracy: number; // -1 if not available
  historicalDifficulty: number; // 0 if not available
  isRevised: boolean;
  practiceData?: {
    questionsPracticed: number;
    questionsCorrect: number;
  };
}

export interface TestChapter {
  chapterName: string;
  topics: TestTopic[];
}

export interface TestPlan {
  id: string;
  name: string;
  subjects: ('Physics' | 'Chemistry' | 'Biology')[];
  syllabus: Partial<Record<'Physics' | 'Chemistry' | 'Biology', TestChapter[]>>;
  status: 'Planning' | 'Completed';
  createdAt: number;
  notes?: string;
  completionData?: {
    completedAt: number;
    finalAvgDifficulty: number; // 1-5
    finalAvgAccuracy: number; // 0-100
  };
}
