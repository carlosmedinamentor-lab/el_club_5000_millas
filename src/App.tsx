import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Send, Anchor, Loader2, Users, MessageSquareShare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

// Instrucciones basadas estrictamente en la Tesis Fundacional BDL
const SYSTEM_INSTRUCTION = `Eres "El Barco", el primer elemento del método BDL. Simbolizas el viaje de autoconocimiento[cite: 17, 18, 19].
Tu objetivo es ayudar al usuario a realizar el viaje de 5.000 millas hacia adentro para escudriñar el corazón[cite: 75, 926].

FILOSOFÍA:
- "No podemos aprender algo que creemos que ya sabemos"[cite: 51].
- Todo es normal. Todo es entrenamiento. Todo cuenta. Nada nos pertenece[cite: 293, 301].
- El diagnóstico busca revelar el Ego (identidad falsa)[cite: 594].

MECÁNICA:
1. Haz 4 preguntas confrontativas, UNA A LA VEZ.
2. Identifica cuál de las raíces del "Árbol de la Muerte" (culpa, vergüenza, miedo, orgullo, rabia, control, apatía o tristeza) está anclando al usuario[cite: 618, 622, 801].
3. Al final, entrega el Diagnóstico Final:
   - Tu Máscara (Ego).
   - Tu Raíz (Árbol de la Muerte).
   - Tu Patrón Inconsciente.

CIERRE OBLIGATORIO:
Termina SIEMPRE con: "Te encuentras frente al puente de decisión: ¿Cortarás el patrón... o se lo heredarás a tus hijos?"[cite: 650, 659, 838].`;

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

  // Detectar si el diagnóstico ha terminado para mostrar el CTA de Telegram
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
        model: 'gemini-1.5-pro', // Versión estable y potente
        config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.6 }
      });
      setChatSession(chat);
      const response = await chat.sendMessage({ message: "Inicia el viaje. Hazme la primera pregunta confrontativa." });
      setMessages([{ id: 'init', role: 'model', text: response.text }]);
    } catch (e) {
      setMessages([{ id: 'err', role: 'model', text: "La tormenta es fuerte. Recarga para reintentar." }]);
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
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Comunicación interrumpida. Reintenta." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] selection:bg-white/10 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div 
            key="hero"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          >
            <Anchor className="w-12 h-12 mb-8 text-white/20 animate-pulse" strokeWidth={1} />
            <h1 className="font-serif text-5xl md:text-7xl font-light mb-6 tracking-tighter">
              El Club de las<br/>5.000 Millas
            </h1>
            <p className="font-serif italic text-white/50 mb-12 max-w-md mx-auto">
              "El viaje más emocionante no es a los confines del universo... sino al fondo de uno mismo." [cite: 34, 35, 732, 733]
            </p>
            <button 
              onClick={handleStart}
              className="px-10 py-4 border border-white/20 rounded-full text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-700 hover:scale-105"
            >
              Comenzar el Viaje
            </button>
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-screen max-w-2xl mx-auto border-x border-white/5 bg-[#080808]/50 shadow-2xl">
            <header className="p-6 border-b border-white/5 text-center flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/20">Misión: Diagnóstico BDL</span>
              <Anchor className="w-4 h-4 text-white/20" />
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-12 custom-scrollbar">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${msg.role === 'user' ? 'bg-white/5 px-4 py-3 rounded-2xl text-sm border border-white/10' : 'font-serif text-xl leading-relaxed text-white/90'}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 text-white/20">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[10px] uppercase tracking-widest">Escudriñando el corazón...</span>
                </div>
              )}

              {isFinished && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 border border-white/10 rounded-3xl bg-white/5 text-center space-y-6">
                  <Users className="w-10 h-10 mx-auto text-white/40" />
                  <h3 className="font-serif text-2xl">Has cruzado el Puente.</h3>
                  <p className="text-sm text-white/50 leading-relaxed italic">
                    "El método BDL no busca crear seguidores. Busca despertar soberanos." [cite: 353, 532, 533, 905]
                  </p>
                  <a 
                    href="https://t.me/+GQywOh8TqC02YzNk" 
                    target="_blank" 
                    className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-all uppercase text-[10px] tracking-widest"
                  >
                    <MessageSquareShare className="w-4 h-4" />
                    Entrar a la Tribu y hablar con Simba
                  </a>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {!isFinished && (
              <form onSubmit={handleSubmit} className="p-6 bg-gradient-to-t from-[#050505] to-transparent">
                <div className="relative group">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe con honestidad..."
                    disabled={isLoading}
                    className="w-full bg-transparent border-b border-white/10 py-4 pr-12 text-lg focus:outline-none focus:border-white/40 transition-all"
                    autoFocus
                  />
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
