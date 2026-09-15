import { useState, useRef, useEffect } from 'react';
import { Share2, Check, Copy, MessageCircle } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  dark?: boolean;
}

export default function ShareButton({
  title,
  text,
  url,
  className = '',
  dark = false,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || title;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleShare = async () => {
    trackEvent('share_click', { title, url: shareUrl });

    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: unknown) {
        // Si el usuario canceló el share nativo, no hacemos nada
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: abrir menú de opciones
    setMenuOpen((prev) => !prev);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setMenuOpen(false);
      }, 2000);
    } catch {
      // Fallback manual
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setMenuOpen(false);
      }, 2000);
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${title} — ${shareUrl}`,
  )}`;

  const btnThemeCls = dark
    ? 'border-white/30 bg-black/20 text-white hover:bg-white hover:text-brand-900'
    : 'border-line bg-paper text-ink hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-300';

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Compartir"
        className={`focus-ring inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-medium uppercase tracking-widest backdrop-blur-md transition-colors duration-300 ${btnThemeCls} ${className}`}
      >
        <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span>Compartir</span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-label="Opciones para compartir"
          className="absolute right-0 top-full mt-2 w-52 z-30 bg-paper/95 border border-line shadow-xl backdrop-blur-md p-1 animate-[fade-in_0.2s_ease-out_both]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-light text-ink hover:bg-paper-soft hover:text-brand-700 dark:hover:text-brand-300 transition-colors text-left"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ¡Enlace copiado!
                </span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-ink-soft shrink-0" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-light text-ink hover:bg-paper-soft hover:text-brand-700 dark:hover:text-brand-300 transition-colors text-left"
          >
            <MessageCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Enviar por WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
}
