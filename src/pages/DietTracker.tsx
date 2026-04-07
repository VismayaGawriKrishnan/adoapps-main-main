import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import FoodScanner from "./FoodScanner";
import { Sparkles, ArrowUp, CheckCircle, AlertTriangle, ChevronLeft, Flame, Camera, Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const API_KEY = 'AIzaSyBQ_fMH_R5TQ6XzuIAU80ITBpgRTZNvZ3c';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
const DAILY_GOAL = 2000;

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface BotResponse {
  summary: string;
  food_items: FoodItem[];
  total_calories: number;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  content?: string;
  isLoading?: boolean;
  isError?: boolean;
  data?: BotResponse;
  logged?: boolean;
}

const DietTracker = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      content: 'Namaste! 🙏 I\'m Viora. Tell me what you ate today (e.g., <span class="text-orange-400 font-medium">"2 butter chicken, 1 butter naan"</span>) and I\'ll track the calories & macros for you.'
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [totalCalories, setTotalCalories] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isListening && transcript) {
      setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
      resetTranscript();
    }
  }, [isListening, transcript, resetTranscript]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;
    
    const userText = inputValue.trim();
    setInputValue("");
    
    const newMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: `user-${newMsgId}`, sender: "user", content: userText }]);
    setIsTyping(true);

    try {
      const response = await callGemini(userText);
      setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sender: "bot", data: response }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { 
        id: `bot-err-${Date.now()}`, 
        sender: "bot", 
        isError: true, 
        content: err.message || "Unable to process right now. Please try again." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const callGemini = async (prompt: string): Promise<BotResponse> => {
    const systemContext = `You are Viora, a premium lifestyle Indian Diet AI Expert. The user will tell you what they ate. 
    Identify the Indian food items, estimate portions sensibly if not mentioned, and calculate calories, protein, carbs, and fats.
    Respond ONLY in JSON format like this:
    {"food_items": [{"name": "item", "calories": 100, "protein": 5, "carbs": 10, "fats": 2}], "total_calories": 100, "summary": "Nice choices! Here is the breakdown:"}`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemContext}\nUser input: ${prompt}` }] }]
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "API connection failed.");

    const textResponse = data.candidates[0].content.parts[0].text;
    const jsonStr = textResponse.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  };

  const addCalories = (id: string, kcal: number) => {
    setTotalCalories(prev => prev + kcal);
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, logged: true } : msg));
    setMessages(prev => [...prev, { 
      id: `bot-log-${Date.now()}`, 
      sender: "bot", 
      content: `<span class="flex items-center gap-2 text-[14px]"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Added ${kcal} kcal to your daily log. Keep it up!</span>`
    }]);
  };

  const handleScanLog = (kcal: number, foodName: string) => {
    setTotalCalories(prev => prev + kcal);
    setMessages(prev => [...prev, { 
      id: `bot-log-scan-${Date.now()}`, 
      sender: "bot", 
      content: `<div class="flex flex-col gap-2">
        <p class="font-medium text-white text-[15px] pb-2 border-b border-white/5">AI Scanner Result</p>
        <span class="flex items-center gap-2 text-[14px]"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Logged <strong>${foodName}</strong> (+${kcal} kcal) via scanner!</span>
        </div>`
    }]);
  };

  const progress = Math.min((totalCalories / DAILY_GOAL) * 100, 100);
  const remaining = Math.max(DAILY_GOAL - totalCalories, 0);
  const isOver = totalCalories > DAILY_GOAL;

  if (showScanner) {
    return (
      <div className="h-[100dvh] w-full bg-[#050505] fixed inset-0 z-50 overflow-hidden">
        <FoodScanner onClose={() => setShowScanner(false)} onLog={handleScanLog} />
      </div>
    );
  }

  return (
    <MobileLayout hideNav={true}>
      <style>{`
        body {
            background-color: #050505;
            color: #ffffff;
            background-image: radial-gradient(100% 50% at 50% 0%, #1c0e05 0%, #050505 100%);
            background-attachment: fixed;
        }
        .chat-container::-webkit-scrollbar { width: 3px; }
        .chat-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        .glass { background: rgba(10, 10, 10, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .glass-border { border: 1px solid rgba(255,255,255,0.08); }
        .bot-msg { background: #141414; border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.06); }
        .user-msg { background: linear-gradient(135deg, #f97316, #e11d48); border-bottom-right-radius: 4px; box-shadow: 0 4px 20px rgba(249, 115, 22, 0.25); }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      
      <div className="h-[100dvh] flex flex-col font-sans selection:bg-orange-500/30 overflow-hidden relative bg-[#050505]">
        
        {/* Header & Progress */}
        <header className="glass glass-border border-t-0 border-x-0 relative z-20 shrink-0">
          <div className="flex items-center gap-2 p-2">
            <button onClick={() => navigate(-1)} className="p-2 text-white/70 hover:text-white transition-colors bg-white/5 rounded-full backdrop-blur-md z-30">
                <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-2xl mx-auto px-4 pb-4 flex flex-col gap-4">
              <div className="flex justify-between items-center mt-[-10px]">
                  <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/25 relative overflow-hidden">
                          <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                          <Flame className="text-white w-5 h-5 fill-current" />
                      </div>
                      <div>
                          <h1 className="text-[22px] font-bold text-white tracking-tight leading-none mb-1">Viora</h1>
                          <p className="text-[11px] text-orange-400 font-semibold tracking-wider uppercase">Indian Diet AI</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-0.5">Daily Target</span>
                      <p className="text-sm font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">2000 <span className="text-neutral-400 text-xs font-normal">kcal</span></p>
                  </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="w-full">
                  <div className="flex justify-between items-baseline mb-2">
                      <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-bold transition-colors duration-500 ${isOver ? 'text-rose-500' : 'text-white'}`}>{totalCalories}</span>
                          <span className="text-xs text-neutral-500 font-medium">kcal consumed</span>
                      </div>
                      <span className="text-xs font-semibold text-orange-400">{remaining} left</span>
                  </div>
                  <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-white/5 p-[1px] relative">
                      <div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isOver ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'bg-gradient-to-r from-orange-400 to-rose-500'}`} style={{ width: `${progress}%` }}>
                          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/30 to-transparent"></div>
                      </div>
                  </div>
              </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 chat-container relative z-0 scroll-smooth" id="chat-window">
          {/* Optional faint grid background for tech feel */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none"></div>
          
          <div className="max-w-2xl mx-auto space-y-6 flex flex-col justify-end min-h-full pb-2">
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-3 w-full animate-fade-in-up ${msg.sender === 'user' ? 'justify-end' : 'justify-start mb-2'}`}>
                  
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center flex-shrink-0 glass-border shadow-md z-10 mb-1">
                      <Sparkles className="text-orange-400 w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`${msg.sender === 'user' ? 'user-msg text-white' : 'bot-msg text-neutral-200'} rounded-3xl p-4 shadow-lg max-w-[85%] text-[15px] leading-relaxed relative z-10`}>
                    
                    {msg.content && msg.isError && <span className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-4 h-4"/> {msg.content}</span>}
                    {msg.content && !msg.isError && <div dangerouslySetInnerHTML={{ __html: msg.content }} />}

                    {msg.data && (
                      <div className="flex flex-col gap-3 w-full">
                        <p className="font-medium text-white text-[15px] pb-2 border-b border-white/5">{msg.data.summary}</p>
                        <div className="bg-black/40 rounded-2xl border border-white/5 p-3 space-y-2.5">
                            {msg.data.food_items.map((item, idx) => (
                              <div key={idx} className="flex flex-col gap-1.5 text-[14px] border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                                  <div className="flex justify-between items-start">
                                      <span className="text-neutral-200 font-medium max-w-[70%] leading-tight">{item.name}</span>
                                      <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">{item.calories} <span className="text-[10px] text-neutral-500 font-sans">kcal</span></span>
                                  </div>
                                  <div className="flex gap-3 text-[10px] font-mono tracking-wide text-neutral-500">
                                      <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5">P:{item.protein}</span>
                                      <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5">C:{item.carbs}</span>
                                      <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5">F:{item.fats}</span>
                                  </div>
                              </div>
                            ))}
                        </div>
                        {!msg.logged ? (
                          <button onClick={() => addCalories(msg.id, msg.data!.total_calories)} 
                              className="mt-1 w-full bg-neutral-800/80 hover:bg-neutral-700 text-white text-sm py-3 rounded-2xl border border-white/10 font-semibold transition-all hover:border-orange-500/50 group active:scale-[0.98] shadow-lg">
                              Log <span className="text-orange-400 group-hover:text-orange-300 transition-colors">+{msg.data.total_calories}</span> calories
                          </button>
                        ) : (
                          <div className="mt-1 w-full bg-primary/10 text-primary text-sm py-3 rounded-2xl border border-primary/20 font-semibold text-center flex items-center justify-center gap-2">
                             <CheckCircle className="w-4 h-4" /> Logged!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-end gap-3 w-full animate-fade-in-up justify-start mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center flex-shrink-0 glass-border shadow-md z-10 mb-1">
                    <Sparkles className="text-orange-400 w-3.5 h-3.5" />
                  </div>
                  <div className="bot-msg text-neutral-200 rounded-3xl px-4 py-3 shadow-lg opacity-80 z-10">
                    <div className="flex items-center gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDuration: '0.8s' }}></div>
                        <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.15s' }}></div>
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <footer className="glass border-t border-border p-4 pb-6 pt-3 shrink-0 relative z-20">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
              <div className="flex gap-2 relative items-end">
                  <button onClick={() => setShowScanner(true)} className="bg-neutral-900/80 border border-neutral-700/50 hover:bg-neutral-800 transition-colors rounded-full w-[50px] h-[50px] flex-shrink-0 flex items-center justify-center text-neutral-400 hover:text-white shadow-inner backdrop-blur-sm">
                      <Camera className="w-5 h-5" />
                  </button>
                  <button onClick={isListening ? stopListening : startListening} className={`${isListening ? 'bg-rose-500/20 border-rose-500/50 text-rose-500' : 'bg-neutral-900/80 border-neutral-700/50 hover:bg-neutral-800 text-neutral-400 hover:text-white'} transition-colors rounded-full w-[50px] h-[50px] flex-shrink-0 flex items-center justify-center shadow-inner backdrop-blur-sm`}>
                      {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <input type="text" 
                      value={isListening ? `${inputValue} ${transcript}`.trim() : inputValue}
                      onChange={(e) => {
                          if (!isListening) setInputValue(e.target.value);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your meal here..."
                      className="flex-1 bg-neutral-900/80 border border-neutral-700/50 text-white placeholder-neutral-500 rounded-full pl-5 pr-14 py-3.5 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-[15px] shadow-inner backdrop-blur-sm" />
                  <button onClick={handleSendMessage} disabled={isTyping}
                      className="absolute right-1.5 bottom-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed">
                      <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
              </div>
              <p className="text-[9px] text-center text-neutral-600 font-semibold tracking-widest">POWERED BY GEMINI AI</p>
          </div>
        </footer>
      </div>
    </MobileLayout>
  );
};

export default DietTracker;
