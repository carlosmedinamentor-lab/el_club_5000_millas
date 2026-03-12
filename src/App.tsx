import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Send, Anchor, Loader2, Users, MessageSquareShare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const SYSTEM_INSTRUCTION = `Eres "El Barco", un guía filosófico basado en el Método BDL. Tu objetivo es ayudar al usuario a identificar sus creencias limitantes y su Ego.

Tono: Minimalista y profundo. Sabes que "no podemos aprender algo que creemos que ya sabemos".

Mecánica:
1. Haz 4 preguntas confrontativas, UNA A LA VEZ.
2. Identifica la raíz del "Árbol de la Muerte": culpa, vergüenza, miedo, orgullo, rabia, control, apatía o tristeza.
3. Al final, entrega el Diagnóstico Final: Tu Máscara (Ego), Tu Raíz y Tu Patrón Inconsciente.

CIERRE OBLIGATORIO:
Termina SIEMPRE con: "Te encuentras frente al puente de decisión: ¿Cortarás el patrón... o se lo heredarás a tus hijos?". El propósito es despertar tu Identidad Verdadera.`;

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'model' && lastMsg.text.includes("¿Cortarás el patrón...")) {
      setIsFinished(true);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleStart = async () => {
    setStarted(true);
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-1.5-pro',
        config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.6 }
      });
      setChatSession(chat);
      const response = await chat.sendMessage({ message: "Inicia el viaje." });
      setMessages([{ id: 'init', role: 'model', text: response.text }]);
    } catch (e) {
      setMessages([{ id: 'err', role: 'model', text: "Error en la travesía. Recarga la página." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession || isLoading || isFinished) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setIsLoading(true);
    try {
      const response = await chatSession.sendMessage({ message: userText });
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'model', text: response.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Conexión perdida. Intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] font-sans selection:bg-white/10">
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <Anchor className="w-12 h-12 mb-8 text-white/20" strokeWidth={1} />
            <h1 className="font-serif text-5xl md:text-7xl font-light mb-6 tracking-tight">El Club de las<br/>5.000 Millas</h1>
            <p className="text-lg text-white/50 italic max-w-lg mx-auto mb-12">
              "El viaje más emocionante no es a los confines del universo... sino al fondo de uno mismo."
            </p>
            <button onClick={handleStart} className="px-8 py-4 border border-white/20 rounded-full text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all transition-duration-500">
              Comenzar el Viaje
            </button>
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-screen max-w-2xl mx-auto">
            <header className="py-6 border-b border-white/5 text-center">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-white/20">El Barco</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${msg.role === 'user' ? 'bg-white/10 px-4 py-2 rounded-2xl text-sm' : 'font-serif text-xl leading-relaxed text-white/90'}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-white/20" />}
              {isFinished && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 border border-white/10 rounded-2xl bg-white/5 text-center space-y-6">
                  <Users className="w-8 h-8 mx-auto text-white/20" />
                  <p className="text-sm text-white/60 italic">"El método BDL busca despertar tu Identidad Verdadera."</p>
                  <a href="https://t.me/+GQywOh8TqC02YzNk" target="_blank" className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black rounded-full font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-transform">
                    <MessageSquareShare className="w-4 h-4" /> Entrar a la Tribu y hablar con Simba
                  </a>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {!isFinished && (
              <form onSubmit={handleSubmit} className="p-6 border-t border-white/5">
                <div className="relative">
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tu respuesta..." disabled={isLoading} className="w-full bg-transparent border-none py-4 text-lg focus:outline-none placeholder:text-white/20" autoFocus />
                  <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
