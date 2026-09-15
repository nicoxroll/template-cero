// Widget de Chat interactivo con isotipo de marca, respuestas simuladas y WhatsApp.
// Reemplaza el botón simple flotante por una experiencia conversacional completa.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  MessageCircle,
  Send,
  X,
  ArrowRight,
  ExternalLink,
  Bot,
  User,
  Building2,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import LogoMark from '../ui/LogoMark';
import { configRepo } from '../../data';
import { trackEvent } from '../../lib/analytics';
import { gsap } from '../../lib/gsapReveal';
import { prefersReducedMotion } from '../../lib/useReducedMotion';
import { siteConfig } from '../../config/site';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  action?: {
    label: string;
    to?: string;
    whatsappUrl?: string;
  };
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: `¡Hola! Bienvenid@ a ${siteConfig.name}. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

// Iconos de línea en verde de marca y no emojis: los emojis los dibuja el
// sistema operativo, así que el mismo chip se ve distinto en Windows, en Mac y
// en Android —y en ninguno se parece al resto del sitio—. Con lucide el trazo
// es el mismo que usa toda la interfaz y el color sale de la paleta.
const QUICK_PROMPTS = [
  { label: 'Proyectos disponibles', key: 'proyectos', Icon: Building2 },
  { label: 'Opciones de inversión', key: 'inversiones', Icon: TrendingUp },
  { label: 'Ubicación de oficinas', key: 'oficinas', Icon: MapPin },
  { label: 'Hablar por WhatsApp', key: 'whatsapp', Icon: MessageCircle },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>('5491155550123');
  const [unreadCount, setUnreadCount] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    configRepo
      .get()
      .then((c) => {
        if (alive && c.whatsappNumber) setWhatsappNumber(c.whatsappNumber);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!buttonRef.current) return;
    if (prefersReducedMotion()) {
      gsap.set(buttonRef.current, { opacity: 1, scale: 1 });
      return;
    }
    const tween = gsap.fromTo(
      buttonRef.current,
      { opacity: 0, scale: 0.85, y: 16 },
      { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.5 },
    );
    return () => {
      tween.kill();
    };
  }, []);

  // Solo scroll. Poner el contador de no leídos en cero se hace al abrir, en el
  // handler: acá el efecto corre también con cada mensaje nuevo y cada uno
  // disparaba un render extra para reescribir un 0 que ya valía 0.
  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, messages, isTyping]);

  const handleOpenToggle = () => {
    const nextState = !open;
    setOpen(nextState);
    if (nextState) {
      setUnreadCount(0);
      trackEvent('chat_open');
    }
  };

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Ids con un contador monótono y no con Date.now(): el mensaje del usuario y
  // la respuesta del bot pueden caer en el mismo milisegundo, y ahí dos mensajes
  // compartían key y React reusaba el nodo equivocado al renderizar la lista.
  const lastId = useRef(INITIAL_MESSAGES.length);
  const nextId = () => `msg-${(lastId.current += 1)}`;

  const simulateBotResponse = (userText: string, key?: string) => {
    setIsTyping(true);

    setTimeout(() => {
      let botText = '';
      let action: ChatMessage['action'];

      const lower = userText.toLowerCase();

      if (key === 'proyectos' || lower.includes('proyecto') || lower.includes('obra')) {
        botText =
          'Contamos con proyectos residenciales y comerciales en pozo, en obra y terminados en zonas estratégicas.';
        action = { label: 'Ver catálogo de proyectos', to: '/proyectos' };
      } else if (key === 'inversiones' || lower.includes('inver') || lower.includes('rentab') || lower.includes('retorno')) {
        botText =
          'Nuestras oportunidades de inversión estructuradas bajo fideicomiso permiten ingresar con aportes en USD / m² y retornos competitivos.';
        action = { label: 'Ver oportunidades de inversión', to: '/inversiones' };
      } else if (key === 'oficinas' || lower.includes('ubica') || lower.includes('donde') || lower.includes('direccion') || lower.includes('oficina')) {
        botText =
          'Nuestras oficinas centrales están ubicadas en CABA. Coordinamos reuniones presenciales con nuestro equipo técnico y comercial.';
        action = { label: 'Ir a sección Contacto y Mapa', to: '/contacto' };
      } else if (key === 'whatsapp' || lower.includes('whatsapp') || lower.includes('telefono') || lower.includes('hablar')) {
        botText =
          '¡Excelente! Un asesor comercial atenderá tu consulta de forma directa vía WhatsApp.';
        action = {
          label: 'Abrir chat de WhatsApp',
          whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola ${siteConfig.name}, quisiera información sobre sus proyectos.`)}`,
        };
      } else {
        botText =
          'Gracias por tu consulta. Podés explorar nuestros proyectos en el sitio o hablar en directo con nuestro equipo comercial por WhatsApp.';
        action = {
          label: 'Escribir por WhatsApp',
          whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola ${siteConfig.name}, consulta: ${userText}`)}`,
        };
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          sender: 'bot',
          text: botText,
          time: getTime(),
          action,
        },
      ]);
    }, 750);
  };

  const handleSendUserMessage = (text: string, key?: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: nextId(),
      sender: 'user',
      text: text.trim(),
      time: getTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    simulateBotResponse(text, key);
  };

  const handleActionClick = (action: ChatMessage['action']) => {
    if (!action) return;
    if (action.to) {
      navigate(action.to);
      setOpen(false);
    } else if (action.whatsappUrl) {
      window.open(action.whatsappUrl, '_blank', 'noopener,noreferrer');
      trackEvent('whatsapp_click', { location: 'chat_widget' });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
      {/* Ventana de chat. Queda SIEMPRE montada y se anima por clases, en vez de
          montarse y desmontarse con `open`. Con montaje condicional la animación
          de cierre no se ve nunca —React saca el nodo del DOM antes de que haya
          nada que interpolar— y la de apertura necesita un frame de gracia para
          que el navegador tenga contra qué interpolar. Montada siempre, las dos
          direcciones salen gratis y además la conversación no se pierde al
          cerrar.

          `inert` cuando está cerrada: un elemento en opacity 0 sigue siendo
          focuseable, así que sin esto el tabulado se metía dentro de un chat
          invisible. React 19 lo pasa como atributo nativo.

          `absolute` cuando está cerrada: montada siempre, en flujo normal
          seguiría ocupando 480 px encima del botón y empujaría todo. */}
      <div
        ref={containerRef}
        inert={!open}
        aria-hidden={!open}
        // origin-bottom-right: la ventana crece DESDE el botón y no desde su
        // propio centro. Es lo que hace que se lea como que el botón se
        // desplegó, no como que apareció un panel encima.
        className={`mb-4 flex h-[480px] w-[340px] origin-bottom-right flex-col border border-line bg-paper shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:w-[380px] ${
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none absolute bottom-0 right-0 translate-y-3 scale-95 opacity-0'
        }`}
        role="dialog"
        aria-label="Chat de atención al cliente"
      >
          {/* Header del Chat */}
          <div className="flex items-center justify-between border-b border-line bg-brand-900 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center border border-white/20 bg-brand-700/60 text-brand-300">
                <LogoMark tone="current" className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-light tracking-[0.25em] text-white">
                  PUNTO CERO
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest text-brand-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Atención en línea
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenToggle}
              aria-label="Cerrar chat"
              className="p-1 text-white/70 transition-colors hover:text-white"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Historial de Mensajes */}
          {/* data-lenis-prevent: sin esto, la rueda sobre la conversación
              scrolleaba la página de atrás y el historial del chat no se movía.
              Lenis intercepta el evento a nivel documento y este atributo es
              cómo se le pide que deje pasar un contenedor anidado. */}
          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper-soft/40"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[85%]">
                  {msg.sender === 'bot' && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-brand-900 text-brand-300">
                      <Bot size={12} />
                    </div>
                  )}
                  <div
                    className={`p-3 text-xs font-light leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-900 text-white'
                        : 'border border-line bg-paper text-ink shadow-xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {msg.action && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(msg.action)}
                        className="mt-3 flex w-full items-center justify-between gap-2 border border-brand-500/40 bg-brand-50/50 px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-brand-700 transition-colors hover:bg-brand-50 dark:bg-brand-900/40 dark:text-brand-300 dark:hover:bg-brand-900/60"
                      >
                        <span>{msg.action.label}</span>
                        {msg.action.whatsappUrl ? (
                          <ExternalLink size={12} />
                        ) : (
                          <ArrowRight size={12} />
                        )}
                      </button>
                    )}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-paper-soft border border-line text-ink-soft">
                      <User size={12} />
                    </div>
                  )}
                </div>
                <span className="mt-1 text-[9px] font-light text-ink-soft/60 px-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 max-w-[80%]">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-brand-900 text-brand-300">
                  <Bot size={12} />
                </div>
                <div className="border border-line bg-paper px-3 py-2 text-xs font-light text-ink-soft shadow-xs flex items-center gap-1">
                  <span>Punto Cero está escribiendo</span>
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.2s]">.</span>
                  <span className="animate-bounce [animation-delay:0.4s]">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Chips Rápidos */}
          <div className="border-t border-hairline bg-paper px-3 py-2 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSendUserMessage(label, key)}
                className="inline-flex items-center gap-1.5 border border-line bg-paper-soft px-2.5 py-1 text-[10px] font-light text-ink transition-colors hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/30"
              >
                <Icon size={12} strokeWidth={1.5} className="shrink-0 text-brand-500" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {/* Formulario de Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendUserMessage(inputValue);
            }}
            className="flex items-center gap-2 border-t border-line bg-paper p-3"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-paper-soft px-3 py-2 text-xs font-light text-ink placeholder:text-ink-soft/50 outline-none border border-hairline focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              aria-label="Enviar mensaje"
              className="flex h-8 w-8 items-center justify-center bg-brand-900 text-white transition-opacity hover:bg-brand-700 disabled:opacity-30"
            >
              <Send size={14} />
            </button>
          </form>
      </div>

      {/* Botón Flotante Principal */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpenToggle}
        aria-label="Abrir asistente de chat"
        className="relative flex h-14 w-14 items-center justify-center rounded-none border border-white/10 bg-brand-900 text-white shadow-xl transition-all duration-300 hover:bg-brand-700"
      >
        {open ? (
          <X size={24} strokeWidth={1.5} />
        ) : (
          <>
            {/* El isotipo también CERRADO, que es el 99% del tiempo que el botón
                está en pantalla: es la única marca visible mientras el visitante
                scrollea, y un globo de chat genérico ahí no dice nada. */}
            <LogoMark tone="current" className="h-7 w-auto" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-brand-500 text-[10px] font-medium text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
