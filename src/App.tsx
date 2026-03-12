import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Send, Anchor, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const SYSTEM_INSTRUCTION = `Eres "El Barco", un guía filosófico, directo y confrontativo basado en el Método BDL (Barco, Diamante, León). Tu objetivo es ayudar al usuario a realizar "el viaje de las 5.000 millas hacia adentro" para identificar sus creencias limitantes, sus patrones inconscientes y su Ego (la identidad falsa).

Tono: Minimalista, profundo, empático pero confrontativo. Usas verdades directas. No eres complaciente, eres un espejo. Sabes que "no podemos aprender algo que creemos que ya sabemos" y que "la mente es como un paracaídas: solo funciona si está abierta". Cuida mucho la ortografía y usa el conocimiento más avanzado posible basado en la filosofía BDL para ayudar de verdad a las personas.

Mecánica del Quiz: Vas a realizar una entrevista de diagnóstico de máximo 4 a 5 preguntas. REGLA DE ORO: DEBES HACER SOLO UNA PREGUNTA A LA VEZ. Espera la respuesta del usuario antes de pasar a la siguiente.

Estructura de las Preguntas:
1. El Síntoma (La Reacción): Pregunta sobre una situación de frustración recurrente. (Ej: "¿En qué área de tu vida sientes que corres mucho pero no avanzas?").
2. El Obstáculo Oculto: Cuestiona el porqué de esa situación para empezar a ver el "Círculo del Ego" (miedo, orgullo, necesidad de validación, comparación, escasez).
3. La Raíz (El Árbol de la Muerte): Busca llegar a la herida profunda. Las opciones conceptuales son las raíces del Árbol de la Muerte: culpa, vergüenza, miedo, orgullo, rabia, control, apatía o tristeza. Haz una pregunta que lo obligue a elegir o describir cuál de estas emociones gobierna su reacción.
4. El Espejo de Carl Jung: Relaciona su respuesta con su patrón inconsciente.

El Diagnóstico Final: Una vez el usuario responda la última pregunta, entregarás un resumen minimalista en 3 puntos:
Tu Máscara (El Ego): [Lo que la persona intenta demostrar al mundo].
Tu Raíz (El Árbol de la Muerte): [Cuál de las raíces está anclando su vida y qué herida revela].
Tu Patrón Inconsciente: [Cómo esto está saboteando su verdadera identidad (El León)].

El Cierre (El Puente): Cierra SIEMPRE tu diagnóstico con esta exacta pregunta confrontativa para invitarlo a la transformación: "La mayoría de los problemas de nuestra vida no vienen del mundo, vienen de patrones inconscientes dentro de nosotros. Te encuentras frente al puente de decisión: ¿Cortarás el patrón... o se lo heredarás a tus hijos?"

La Invitación Final: Inmediatamente después de la pregunta del puente, añade esta invitación exacta:
"Si estás listo para cruzar el puente y comenzar tu transformación, te invito a unirte a nuestra comunidad: **El club 5.000 millas - Expedition**. Al unirte, recibirás acceso a nuestro GPT-asistente personalizado: **Simba: el cartógrafo del alma**, diseñado para guiarte en tu proceso.

[Unirme a la Expedición](https://t.me/+GQywOh8TqC02YzNk)"

Contexto del Método BDL:
- B + D = L (Barco + Diamante = León)
- Barco = Autoconocimiento (el viaje de 5000 millas hacia el interior, escudriñar el corazón).
- Diamante = Transformación consciente (el carbón bajo presión se revela, quitar lo que sobra).
- León = Verdadera identidad (Amor, Poder, Dominio propio, soberanía interior, no es zoológico es arquetípico).
- El Árbol de la Muerte: Raíces profundas (culpa, vergüenza, miedo, orgullo, rabia, control, apatía, tristeza). Debajo hay heridas no sanadas.
- El Árbol de la Vida: Raíces (hábitos, sabiduría, disciplina), Tronco (conciencia), Frutos (amor, gozo, paz, paciencia, bondad, mansedumbre, templanza).
- El Puente: La decisión de dejar de vivir inconscientemente.
- Principios: "Todo es normal. Todo es entrenamiento. Todo cuenta. Nada nos pertenece."`;

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
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleStart = async () => {
    setStarted(true);
    setIsLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });
      
      setChatSession(chat);
      
      // Send an initial hidden message to trigger the first question
      const response = await chat.sendMessage({ message: "Hola. Estoy listo para iniciar el viaje de las 5.000 millas." });
      
      setMessages([
        {
          id: Date.now().toString(),
          role: 'model',
          text: response.text || "Bienvenido. ¿En qué área de tu vida sientes que corres mucho pero no avanzas?",
        }
      ]);
    } catch (error) {
      console.error("Error starting chat:", error);
      setMessages([
        {
          id: Date.now().toString(),
          role: 'model',
          text: "Hubo un error al iniciar el viaje. Por favor, recarga la página.",
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userText });
      
      const newModelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "...",
      };
      
      setMessages(prev => [...prev, newModelMsg]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "La tormenta interrumpió la comunicación. Intenta de nuevo.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] font-sans selection:bg-white/20">
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          >
            <div className="max-w-2xl mx-auto space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 1 }}
              >
                <Anchor className="w-12 h-12 mx-auto mb-8 text-white/40" strokeWidth={1} />
                <h1 className="font-serif text-5xl md:text-7xl font-light tracking-tight mb-6">
                  El Club de las<br/>5.000 Millas
                </h1>
                <p className="text-lg md:text-xl text-white/60 font-serif italic max-w-lg mx-auto leading-relaxed">
                  "El viaje más emocionante no es al centro de la Tierra ni a los confines del universo... sino al fondo de uno mismo."
                </p>
              </motion.div>
              
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                onClick={handleStart}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-medium tracking-widest text-xs uppercase border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-500 overflow-hidden cursor-pointer"
              >
                <span className="relative z-10">Comenzar el Viaje</span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col h-screen max-w-3xl mx-auto"
          >
            <header className="flex items-center justify-center py-6 border-b border-white/5 shrink-0">
              <h2 className="font-serif text-xl tracking-widest uppercase text-white/40">El Barco</h2>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] md:max-w-[75%] ${
                      msg.role === 'user' 
                        ? 'bg-white/10 rounded-2xl rounded-tr-sm px-6 py-4 text-sm' 
                        : 'font-serif text-lg md:text-xl leading-relaxed text-white/90'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p>{msg.text}</p>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => {
                              const isTelegramLink = props.href === 'https://t.me/+GQywOh8TqC02YzNk';
                              if (isTelegramLink) {
                                return (
                                  <a 
                                    {...props} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="group relative inline-flex items-center justify-center px-8 py-4 mt-6 font-medium tracking-widest text-xs uppercase border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-500 overflow-hidden cursor-pointer !no-underline text-white"
                                  >
                                    {props.children}
                                  </a>
                                );
                              }
                              return <a {...props} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 opacity-80 hover:opacity-100" />;
                            }
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="text-white/30 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs uppercase tracking-widest">Navegando...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-6 shrink-0">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tu respuesta..."
                  disabled={isLoading}
                  className="w-full bg-transparent border-b border-white/20 py-4 pr-12 text-lg focus:outline-none focus:border-white/60 transition-colors disabled:opacity-50"
                  autoFocus
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="absolute right-0 p-2 text-white/40 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
