
import React, { useState } from 'react';
import { TestPlan } from '../types';
import { X, CheckCircle } from 'lucide-react';

interface TestCompletionModalProps {
  testPlan: TestPlan;
  onClose: () => void;
  onComplete: (completionData: { finalAvgDifficulty: number, finalAvgAccuracy: number }) => void;
}

const TestCompletionModal: React.FC<TestCompletionModalProps> = ({ testPlan, onClose, onComplete }) => {
  const [finalDifficulty, setFinalDifficulty] = useState(3);
  const [finalAccuracy, setFinalAccuracy] = useState(75);

  const handleSubmit = () => {
    onComplete({
      finalAvgDifficulty: finalDifficulty,
      finalAvgAccuracy: finalAccuracy,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-md w-full border-2 border-[var(--glow-cyan)]/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Finalize Preparation</h2>
          <button onClick={onClose} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <p className="font-semibold text-[var(--text-primary)] mb-1">{testPlan.name}</p>
        <p className="text-base text-[var(--text-secondary)] mb-6">Enter your self-assessed performance for this test's preparation period.</p>
        
        <div className="space-y-6">
            <div>
                 <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">Final Average Difficulty (1-5)</label>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-green-400">Easy</span>
                    <input type="range" min="1" max="5" step="0.1" value={finalDifficulty} onChange={e => setFinalDifficulty(Number(e.target.value))} className="w-full mx-4" />
                    <span className="text-sm text-red-400">Hard</span>
                 </div>
                 <p className="text-center font-bold text-[var(--glow-cyan)] mt-1">{finalDifficulty.toFixed(1)}</p>
            </div>
            
            <div>
                 <label className="block text-base font-bold text-[var(--text-secondary)] mb-2">Final Average Accuracy (%)</label>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-red-400">0%</span>
                    <input type="range" min="0" max="100" value={finalAccuracy} onChange={e => setFinalAccuracy(Number(e.target.value))} className="w-full mx-4" />
                    <span className="text-sm text-green-400">100%</span>
                 </div>
                 <p className="text-center font-bold text-[var(--glow-cyan)] mt-1">{finalAccuracy}%</p>
            </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-8 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(34,197,94,0.6)]"
        >
          <CheckCircle size={20} />
          <span>Complete and Save</span>
        </button>
      </div>
    </div>
  );
};

export default TestCompletionModal;