import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX,
  Bot, User, Minimize2, Maximize2, Navigation
} from 'lucide-react';

interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
  time: string;
}

const NAV_INTENTS: { patterns: RegExp[]; path: string; label: string }[] = [
  { patterns: [/\b(home|landing|start|main page)\b/i], path: '/', label: 'Home' },
  { patterns: [/\b(predict|assess|risk|analysis|analyze|check|evaluate|screening)\b/i], path: '/predict', label: 'Risk Assessment' },
  { patterns: [/\b(history|past|previous|records|patients)\b/i], path: '/history', label: 'Patient History' },
  { patterns: [/\b(report|reports|statistics|aggregate|stats)\b/i], path: '/reports', label: 'Clinical Reports' },
  { patterns: [/\b(setting|settings|profile|account|preference)\b/i], path: '/settings', label: 'Settings' },
  { patterns: [/\b(login|sign in|signin)\b/i], path: '/login', label: 'Login' },
  { patterns: [/\b(signup|sign up|register)\b/i], path: '/signup', label: 'Sign Up' },
];

const FAQ: { patterns: RegExp[]; answer: string }[] = [
  {
    patterns: [/\b(what is|about|explain|tell me about|purpose)\b.*\bpreventai\b/i, /\bpreventai\b.*\b(what|explain|tell)\b/i],
    answer: `**PreventAI** is an AI-powered clinical decision support system for diabetes risk assessment. It uses machine learning to analyze patient data and provides:\n- 🔬 Personalized risk scores\n- 📊 SHAP-based explainability\n- 🩺 Doctor & patient clinical reports\n- 📈 Charts and trend analysis\n- 📄 PDF clinical reports`
  },
  {
    patterns: [/\bhba1c\b/i, /\bhemoglobin a1c\b/i],
    answer: `**HbA1c (Hemoglobin A1c)** reflects your average blood sugar over the past 2–3 months.\n\n| Level | Interpretation |\n|-------|---------------|\n| < 5.7% | Normal |\n| 5.7–6.4% | Prediabetes |\n| ≥ 6.5% | Diabetes |\n\nIt's one of the strongest predictors in our model.`
  },
  {
    patterns: [/\bbmi\b/i, /\bbody mass index\b/i],
    answer: `**BMI (Body Mass Index)** = weight(kg) / height(m)²\n\n| BMI | Category |\n|-----|----------|\n| < 18.5 | Underweight |\n| 18.5–24.9 | Normal |\n| 25–29.9 | Overweight |\n| ≥ 30 | Obese |\n\nHigher BMI significantly increases diabetes risk.`
  },
  {
    patterns: [/\bblood glucose\b/i, /\bglucose level\b/i, /\bfasting glucose\b/i],
    answer: `**Blood Glucose Level** (fasting):\n\n| Level | Category |\n|-------|----------|\n| < 100 mg/dL | Normal |\n| 100–125 mg/dL | Prediabetes |\n| ≥ 126 mg/dL | Diabetes |\n\nEnter the value in mg/dL in the assessment form.`
  },
  {
    patterns: [/\bhow.*work\b/i, /\bhow.*predict\b/i, /\bml model\b/i, /\bmachine learning\b/i],
    answer: `Our system uses a **Random Forest** model trained on 100,000+ patient records. Steps:\n\n1. You enter patient vitals & history\n2. The ML model outputs a risk probability (0–100%)\n3. SHAP values explain *which* factors contributed most\n4. GPT generates clinical insights for doctors & patients\n5. You can export a full PDF clinical report`
  },
  {
    patterns: [/\bright.*score\b/i, /\brisk score\b/i, /\bpercentage mean\b/i, /\bwhat.*(\d+)%\b/i],
    answer: `**Risk Score** interpretation:\n\n| Score | Category | Recommendation |\n|-------|----------|---------------|\n| 0–30% | 🟢 Low | Annual screening |\n| 30–60% | 🟡 Moderate | Lifestyle changes + 6-month follow-up |\n| 60–100% | 🔴 High | Immediate clinical intervention |`
  },
  {
    patterns: [/\bdiabetes\b.*\bprevent\b/i, /\bprevent\b.*\bdiabetes\b/i, /\bhow.*reduce.*risk\b/i],
    answer: `**Diabetes Prevention Tips:**\n\n🥗 **Diet:** Reduce refined carbs & sugar. Eat more fiber, vegetables, and lean protein.\n\n🏃 **Exercise:** 150 min/week of moderate aerobic activity + strength training 2x/week.\n\n⚖️ **Weight:** Even 5–7% weight loss can reduce risk by 58%.\n\n🚭 **Smoking:** Quit smoking — it increases diabetes risk by 30–40%.\n\n💊 **Monitoring:** Check HbA1c and fasting glucose every 6 months if at moderate risk.`
  },
  {
    patterns: [/\bhypertension\b/i, /\bhigh blood pressure\b/i],
    answer: `**Hypertension** (high blood pressure) co-occurs with diabetes in ~75% of cases. It accelerates complications like kidney disease, neuropathy, and retinopathy. Normal BP is < 120/80 mmHg. If you have hypertension, our model factors it in as a risk multiplier.`
  },
  {
    patterns: [/\bhelp\b/i, /\bwhat can you do\b/i, /\bcommands\b/i, /\bfeatures\b/i],
    answer: `I'm **PreventAI Assistant** 🤖. I can help you:\n\n🧭 **Navigate** — Say "go to predictions" or "open reports"\n\n💊 **Explain** medical terms (HbA1c, BMI, Glucose...)\n\n📊 **Interpret** risk scores and results\n\n🌿 **Advise** on diabetes prevention\n\n🔬 **Explain** how our ML model works\n\nJust ask anything about diabetes risk or the PreventAI platform!`
  },
];

function getBotResponse(input: string, navigate: (path: string) => void): string {
  const lower = input.toLowerCase().trim();

  // Navigation intent
  for (const nav of NAV_INTENTS) {
    if (nav.patterns.some(p => p.test(lower))) {
      setTimeout(() => navigate(nav.path), 800);
      return `Sure! Navigating you to **${nav.label}** now... 🧭`;
    }
  }

  // FAQ match
  for (const faq of FAQ) {
    if (faq.patterns.some(p => p.test(lower))) {
      return faq.answer;
    }
  }

  // Greetings
  if (/\b(hi|hello|hey|howdy|greetings)\b/i.test(lower)) {
    return `Hello! 👋 I'm the **PreventAI Assistant**. I can help you navigate the platform, explain diabetes-related terms, or interpret risk scores. What would you like to know?`;
  }

  if (/\b(thanks|thank you|thx|great|awesome|perfect)\b/i.test(lower)) {
    return `You're welcome! 😊 Let me know if there's anything else I can help you with. You can always ask me to navigate somewhere or explain medical terms.`;
  }

  if (/\b(bye|goodbye|exit|close|see you)\b/i.test(lower)) {
    return `Goodbye! 👋 Stay healthy and feel free to chat anytime. You can close this window with the X button.`;
  }

  // Default
  return `I'm not sure I understood that. Try asking me to:\n\n- **Navigate**: "Take me to reports" or "Open risk assessment"\n- **Explain**: "What is HbA1c?" or "Explain BMI"\n- **Advise**: "How can I prevent diabetes?"\n- **Interpret**: "What does a 65% risk score mean?"\n\nType **help** to see all my capabilities!`;
}

export default function Chatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'bot',
      text: `Hi! I'm **PreventAI Assistant** 🤖\n\nI can help you:\n- 🧭 Navigate the platform\n- 💊 Explain medical terms\n- 📊 Interpret your results\n- 🌿 Give diabetes prevention advice\n\nWhat can I help you with today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    // Strip markdown for speech
    const cleanText = text.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').replace(/\|.*\|/g, '').replace(/[-•]\s/g, '').replace(/\n+/g, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(text, navigate);
      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'bot',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      speak(response);
    }, 900 + Math.random() * 400);
  }, [navigate, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const renderText = (text: string) => {
    // Simple markdown-like renderer
    return text.split('\n').map((line, i) => {
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} className="ml-4 text-xs" dangerouslySetInnerHTML={{ __html: boldLine.slice(2) }} />;
      }
      if (line.includes('|') && line.includes('|')) {
        // Simple table row
        if (line.replace(/[|\s-]/g, '') === '') return <hr key={i} className="border-slate-200 my-1" />;
        const cells = line.split('|').filter(c => c.trim());
        return (
          <div key={i} className="flex gap-2 text-xs">
            {cells.map((cell, j) => (
              <span key={j} className={`flex-1 ${j === 0 ? 'font-medium text-slate-700' : 'text-slate-500'}`} dangerouslySetInnerHTML={{ __html: cell.trim() }} />
            ))}
          </div>
        );
      }
      if (line.startsWith('#')) {
        const content = line.replace(/^#+\s/, '');
        return <p key={i} className="font-bold text-xs text-slate-800 mt-1" dangerouslySetInnerHTML={{ __html: content }} />;
      }
      if (!line.trim()) return <div key={i} className="h-1" />;
      return <p key={i} className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: boldLine }} />;
    });
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-200 flex items-center justify-center transition-all ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Open PreventAI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">!</span>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-3xl shadow-2xl shadow-slate-300 overflow-hidden flex flex-col"
            style={{ height: isMinimized ? 'auto' : '560px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">PreventAI Assistant</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    <span className="text-emerald-100 text-xs">Online • Diabetes Risk Expert</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { isSpeaking ? stopSpeaking() : setVoiceEnabled(!voiceEnabled); }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                >
                  {voiceEnabled && !isSpeaking ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-white" />}
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4 text-white" /> : <Minimize2 className="w-4 h-4 text-white" />}
                </button>
                <button
                  onClick={() => { setIsOpen(false); stopSpeaking(); stopListening(); }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Navigation shortcuts */}
            {!isMinimized && (
              <div className="bg-emerald-50 px-4 py-2 flex gap-2 overflow-x-auto border-b border-emerald-100">
                <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                {[
                  { label: 'Assess', path: '/predict' },
                  { label: 'History', path: '/history' },
                  { label: 'Reports', path: '/reports' },
                  { label: 'Settings', path: '/settings' },
                ].map(({ label, path }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="shrink-0 text-xs text-emerald-700 bg-white border border-emerald-200 rounded-full px-3 py-0.5 hover:bg-emerald-100 transition-colors font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            {!isMinimized && (
              <div className="flex-1 overflow-y-auto bg-white px-4 py-4 space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'bot' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      {msg.role === 'bot' ? <Bot className="w-4 h-4 text-emerald-600" /> : <User className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-3 rounded-2xl space-y-0.5 ${
                        msg.role === 'bot'
                          ? 'bg-slate-50 border border-slate-100 rounded-tl-none text-slate-700'
                          : 'bg-emerald-600 rounded-tr-none text-white'
                      }`}>
                        {msg.role === 'bot' ? renderText(msg.text) : <p className="text-xs">{msg.text}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input */}
            {!isMinimized && (
              <div className="bg-white border-t border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                    placeholder="Ask me anything or say a command..."
                    className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-600'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                    className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isListening && (
                  <p className="text-center text-xs text-red-500 mt-2 animate-pulse">🎙️ Listening... Speak now</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
