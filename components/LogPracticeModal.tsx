
import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface LogPracticeModalProps {
  topicName: string;
  onClose: () => void;
  onSave: (data: { questionsPracticed: number; questionsCorrect: number }) => void;
}

const LogPracticeModal: React.FC<LogPracticeModalProps> = ({ topicName, onClose, onSave }) => {
  const [practiced, setPracticed] = useState(10);
  const [correct, setCorrect] = useState(8);

  const handleSubmit = () => {
    if (practiced <= 0) { alert("Questions practiced must be greater than zero."); return; }
    if (correct > practiced) { alert("Correct questions cannot be more than practiced questions."); return; }
    onSave({ questionsPracticed: practiced, questionsCorrect: correct });
  };
  
  const futuristicInput = (value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min: number) => (
      <input 
          type="number" 
          value={value} 
          onChange={onChange} 
          min={min} 
          className="w-full p-2 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none text-[var(--text-primary)]" 
      />
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-sm w-full border-2 border-[var(--glow-cyan)]/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Log Practice</h2>
          <button onClick={onClose} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <p className="font-semibold text-[var(--text-primary)] mb-6 text-center">{topicName}</p>
        
        <div className="space-y-5">
            <div>
                <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">Questions Practiced</label>
                {futuristicInput(practiced, e => setPracticed(Number(e.target.value)), 1)}
            </div>
            <div>
                <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">Questions Correct</label>
                {futuristicInput(correct, e => setCorrect(Number(e.target.value)), 0)}
            </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-8 bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors flex items-center justify-center space-x-2 shadow-[0_0_15px_var(--glow-cyan)]"
        >
          <CheckCircle size={20} />
          <span>Save Log</span>
        </button>
      </div>
    </div>
  );
};

export default LogPracticeModal;