
import React from 'react';
import { ArrowRight, Zap, MessageSquare, BarChart2, Calendar, ClipboardList } from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (screen: 'practice' | 'dashboard' | 'doubt' | 'planner' | 'testPlanner') => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  
  const ActionCard = ({ title, description, icon, buttonText, onClick, colorClass }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    buttonText: string;
    onClick: () => void;
    colorClass: string;
  }) => (
    <div 
        className="glass-card rounded-2xl p-6 flex flex-col transition-all duration-300 transform hover:-translate-y-1 glass-card-hover"
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className={`p-3 rounded-full bg-opacity-20 ${colorClass}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-[var(--text-secondary)] text-base">{description}</p>
        </div>
      </div>
      <button 
        onClick={onClick} 
        className="mt-auto ml-auto bg-[var(--glow-cyan)] bg-opacity-20 text-[var(--glow-cyan)] font-semibold py-2 px-4 rounded-lg hover:bg-opacity-30 transition-all duration-300 flex items-center space-x-2 border border-[var(--glow-cyan)] border-opacity-30 hover:border-opacity-80"
      >
        <span>{buttonText}</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="glass-card p-6 rounded-2xl mb-6 text-center">
        <h2 className="text-4xl font-bold text-white tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 242, 255, 0.5)' }}>Welcome, Future Doctor</h2>
        <p className="text-lg text-[var(--text-secondary)] mt-2">Your Med-Pod is calibrated. Ready to conquer your goals?</p>
        <p className="text-sm text-[var(--text-secondary)] italic opacity-70 mt-2">
            A private build, forged by Prasenjeet Mehta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ActionCard
          title="Practice Engine"
          description="Generate unique, PYQ-pattern questions."
          icon={<Zap size={24} />}
          buttonText="Begin Practice"
          onClick={() => onNavigate('practice')}
          colorClass="bg-yellow-500 text-yellow-300"
        />
         <ActionCard
          title="Daily Planner"
          description="Organize your study schedule with precision."
          icon={<Calendar size={24} />}
          buttonText="View Planner"
          onClick={() => onNavigate('planner')}
          colorClass="bg-green-500 text-green-300"
        />
        <ActionCard
          title="Test Architect"
          description="Build and track targeted test plans."
          icon={<ClipboardList size={24} />}
          buttonText="Plan Tests"
          onClick={() => onNavigate('testPlanner')}
          colorClass="bg-blue-500 text-blue-300"
        />
        <ActionCard
          title="NEET-Dost AI"
          description="Your personal AI tutor for instant doubt-solving."
          icon={<MessageSquare size={24} />}
          buttonText="Ask Doubt"
          onClick={() => onNavigate('doubt')}
          colorClass="bg-pink-500 text-pink-300"
        />
        <ActionCard
          title="Performance Matrix"
          description="Analyze your strengths and weaknesses."
          icon={<BarChart2 size={24} />}
          buttonText="View Dashboard"
          onClick={() => onNavigate('dashboard')}
          colorClass="bg-purple-500 text-purple-300"
        />
      </div>
    </div>
  );
};

export default HomeScreen;