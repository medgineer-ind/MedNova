import React from 'react';
import { Calendar, ClipboardList, BarChart2, X } from 'lucide-react';

interface IntroModalProps {
  onClose: () => void;
}

const IntroModal: React.FC<IntroModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-8 max-w-2xl w-full transform transition-all duration-300 scale-95 hover:scale-100 border-2 border-[var(--glow-cyan)]" style={{boxShadow: '0 0 40px var(--glow-cyan)'}}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 8px var(--glow-cyan)' }}>Welcome to your Med-Pod</h2>
            <button onClick={onClose} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                <X size={24} />
            </button>
        </div>
        
        <p className="text-[var(--text-secondary)] mb-6">Your personal offline coach to help you ace the NEET exam. Key features:</p>

        <ul className="space-y-4 text-[var(--text-primary)]">
          <li className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--glow-cyan)] bg-opacity-20 text-[var(--glow-cyan)] rounded-full flex items-center justify-center">
                <Calendar size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Smart Study Planner</h3>
              <p className="text-base text-[var(--text-secondary)]">Organize your study schedule, track your progress, and log your performance for every topic.</p>
            </div>
          </li>
           <li className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 bg-opacity-20 text-blue-400 rounded-full flex items-center justify-center">
                <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Custom Test Architect</h3>
              <p className="text-base text-[var(--text-secondary)]">Build targeted test plans from the entire NEET syllabus to focus on your specific needs.</p>
            </div>
          </li>
          <li className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--glow-magenta)] bg-opacity-20 text-[var(--glow-magenta)] rounded-full flex items-center justify-center">
                <BarChart2 size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Performance Matrix</h3>
              <p className="text-base text-[var(--text-secondary)]">Deep dive into analytics, identify weak chapters, and review every incorrect answer.</p>
            </div>
          </li>
        </ul>

        <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
            <h4 className="font-bold text-center text-lg text-[var(--glow-cyan)] tracking-widest uppercase">
                Creator's Transmission
            </h4>
            <p className="text-center text-base text-[var(--text-secondary)] mt-2">
                This Med-Pod was forged with passion by <strong className="text-[var(--text-primary)]">Prasenjeet Mehta</strong>.
                <br/>Connect and share your journey:
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-3 text-base text-[var(--text-primary)]">
                <span className="font-semibold">Telegram: <span className="font-normal opacity-80">medgineer_ind</span></span>
                <span className="font-semibold">Instagram: <span className="font-normal opacity-80">medgineer.ind</span></span>
                <span className="font-semibold">Arratai: <span className="font-normal opacity-80">medgineer</span></span>
            </div>
        </div>


        <button
          onClick={onClose}
          className="w-full mt-6 bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors duration-300 text-xl shadow-[0_0_20px_var(--glow-cyan)]"
        >
          Initialize Med-Pod
        </button>
      </div>
    </div>
  );
};

export default IntroModal;