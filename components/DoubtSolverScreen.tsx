
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { askNeetDost } from '../services/geminiService';
import { Send, Paperclip, Bot, User, Loader, Link } from 'lucide-react';

const formatBotResponse = (text: string): string => {
    // This function is complex and specific to the AI's output format.
    // We will keep its logic but ensure the output HTML is styled by the new theme's CSS.
    return text
      .replace(/1️⃣ \*\*Short Answer:\*\*/g, '<h3 class="font-bold text-[var(--glow-cyan)] text-lg mb-1">1️⃣ Short Answer:</h3>')
      .replace(/2️⃣ \*\*Step-by-step Explanation:\*\*/g, '<h3 class="font-bold text-[var(--glow-cyan)] text-lg my-2">2️⃣ Step-by-step Explanation:</h3>')
      .replace(/3️⃣ \*\*NEET Tips & Common Mistakes:\*\*/g, '<h3 class="font-bold text-[var(--glow-cyan)] text-lg my-2">3️⃣ NEET Tips & Common Mistakes:</h3>')
      .replace(/4️⃣ \*\*Practice Question:\*\*/g, '<h3 class="font-bold text-[var(--glow-cyan)] text-lg my-2">4️⃣ Practice Question:</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
};


const DoubtSolverScreen: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'bot', text: "Hi! I am NEET-Dost. How can I help you with Physics, Chemistry, or Biology today?" }
    ]);
    const [input, setInput] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<null | HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64((reader.result as string).split(',')[1]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async () => {
        if (input.trim() === '' && !image) return;

        const userMessage: ChatMessage = { sender: 'user', text: input, image: imageBase64 || undefined };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setImage(null);
        setImageBase64(null);
        setIsLoading(true);

        try {
            const { text: botResponseText, sources } = await askNeetDost(messages, input, imageBase64 || undefined);
            const formattedResponse = formatBotResponse(botResponseText);
            setMessages(prev => [...prev, { sender: 'bot', text: formattedResponse, sources }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, something went wrong." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-150px)] glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] font-bold text-xl text-white flex items-center">
                <Bot className="mr-2 text-[var(--glow-cyan)]" style={{ filter: 'drop-shadow(0 0 5px var(--glow-cyan))' }}/> NEET-Dost AI
            </div>
            <div className="flex-grow p-4 overflow-y-auto bg-black bg-opacity-20">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-[var(--glow-cyan)] bg-opacity-30 flex items-center justify-center text-[var(--glow-cyan)] flex-shrink-0"><Bot size={20}/></div>}
                            <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] rounded-br-none' : 'glass-card !bg-opacity-80 text-[var(--text-primary)] rounded-bl-none'}`}>
                                {msg.image && <img src={`data:image/jpeg;base64,${msg.image}`} alt="user upload" className="rounded-lg mb-2 max-h-48 border border-[var(--border-color)]" />}
                                <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: msg.text }} />
                                {msg.sender === 'bot' && msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-[var(--border-color)]">
                                        <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-1 flex items-center"><Link size={12} className="mr-1.5" /> Sources:</h4>
                                        <ul className="space-y-1 pl-1">
                                            {msg.sources.map((source, i) => (
                                                <li key={i} className="text-sm truncate">
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[var(--glow-cyan)] opacity-80 hover:opacity-100 hover:underline" title={source.title}>
                                                        {source.title || source.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-gray-200 flex-shrink-0"><User size={20}/></div>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-3 justify-start">
                             <div className="w-8 h-8 rounded-full bg-[var(--glow-cyan)] bg-opacity-30 flex items-center justify-center text-[var(--glow-cyan)] flex-shrink-0"><Bot size={20}/></div>
                            <div className="max-w-sm p-3 rounded-2xl glass-card text-[var(--text-primary)] rounded-bl-none flex items-center space-x-2">
                                <Loader className="animate-spin text-[var(--glow-cyan)]" size={20} />
                                <span>Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-dark-primary)] bg-opacity-50">
                {image && (
                    <div className="mb-2 p-2 bg-[var(--bg-dark-secondary)] rounded-md flex justify-between items-center text-base text-[var(--text-primary)]">
                        <span>{image.name}</span>
                        <button onClick={() => { setImage(null); setImageBase64(null); }} className="text-red-400 hover:text-red-300">X</button>
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full text-[var(--text-secondary)] hover:text-[var(--glow-cyan)] hover:bg-white/10 transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask your doubt..."
                        className="flex-grow p-3 bg-[var(--bg-dark-secondary)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--glow-cyan)] focus:border-[var(--glow-cyan)] focus:outline-none text-[var(--text-primary)]"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || (input.trim() === '' && !image)} className="bg-[var(--glow-cyan)] text-[var(--bg-dark-primary)] p-3 rounded-lg hover:bg-opacity-80 disabled:bg-opacity-40 disabled:cursor-not-allowed transition-colors">
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoubtSolverScreen;