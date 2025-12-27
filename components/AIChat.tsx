import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { generateDesignElement } from '../services/geminiService';
import { Layer } from '../types';

interface Props {
  onClose: () => void;
  onAddLayer: (layer: Partial<Layer>) => void;
}

export const AIChat: React.FC<Props> = ({ onClose, onAddLayer }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await generateDesignElement(prompt);
      if (result) {
        onAddLayer(result);
        onClose();
      } else {
        setError('Could not generate design. Check API Key or try a simpler prompt.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-96 bg-[#2C2C2C] border border-purple-500 rounded-lg shadow-2xl z-50 p-4 text-white">
      <div className="flex justify-between items-center mb-3">
         <div className="flex items-center gap-2 text-purple-400 font-semibold">
            <Sparkles size={18} />
            <span>Figma AI</span>
         </div>
         <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18}/></button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <textarea
           value={prompt}
           onChange={(e) => setPrompt(e.target.value)}
           placeholder="Describe what you want (e.g., 'A big red delete button' or 'A yellow sticky note about meeting notes')"
           className="w-full bg-[#1E1E1E] text-sm p-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none resize-none h-24 mb-3"
           autoFocus
        />
        {error && <div className="text-xs text-red-400 mb-2">{error}</div>}
        <div className="flex justify-end">
           <button 
              type="submit" 
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
           >
              {loading && <Loader2 size={14} className="animate-spin"/>}
              Generate
           </button>
        </div>
      </form>
    </div>
  );
};