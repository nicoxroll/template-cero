import { useRef, useState, type FC, type MouseEvent, type ReactNode, type CSSProperties, type ChangeEvent } from 'react';
import { Edit3, Check, X, Upload, ImageIcon, Loader2 } from 'lucide-react';
import { useLiveCMS } from '../../lib/LiveCMSContext';
import { uploadImage } from '../../data/storage';

// ── Botón Flotante de Edición de Sección ─────────────────────────────────────
export const EditPencilButton: FC<{
  onClick: (e: MouseEvent) => void;
  position?: string;
  label?: string;
}> = ({ onClick, position = 'top-4 right-4', label = 'Editar Sección' }) => {
  const { isEditMode } = useLiveCMS();
  if (!isEditMode) return null;

  return (
    <div
      className={`absolute ${position} z-40 transition-all duration-300 opacity-90 hover:opacity-100 hover:scale-105`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick(e);
        }}
        type="button"
        title={label}
        className="focus-ring flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded shadow-[0_4px_20px_rgba(20,184,166,0.4)] border border-brand-400/50 font-mono font-medium uppercase text-[11px] tracking-wider transition-all hover:bg-brand-600 active:scale-95 cursor-pointer backdrop-blur-md"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
    </div>
  );
};

// ── Barra Flotante Inferior de Guardado y Descarte ────────────────────────────
export const InlineEditBar: FC<{
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  sectionLabel?: string;
}> = ({ onSave, onCancel, isSaving, sectionLabel }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 bg-ink-fixed/95 text-white rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-6 py-3.5 border border-brand-500/40 backdrop-blur-2xl animate-[fade-in_0.3s_ease-out] font-sans">
      {/* Esquinas arquitectónicas */}
      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-brand-400" />
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-400" />
      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-brand-400" />
      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-brand-400" />

      <div className="flex flex-col items-start pr-4 border-r border-white/15">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-400 font-mono">
          PUNTO CERO // CMS LIVE
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-white">
          {sectionLabel || 'EDITANDO SECCIÓN'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaving}
          type="button"
          className="flex items-center gap-2 px-5 py-2 bg-brand-500 text-white font-medium uppercase text-xs tracking-wider rounded transition-all hover:bg-brand-600 shadow-[0_0_15px_rgba(20,184,166,0.4)] active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          <span>{isSaving ? 'GUARDANDO...' : 'GUARDAR'}</span>
        </button>

        <button
          onClick={onCancel}
          type="button"
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 text-white/80 hover:text-white font-medium uppercase text-xs tracking-wider rounded hover:bg-white/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          <span>DESCARTAR</span>
        </button>
      </div>
    </div>
  );
};

// ── Wrapper Editable de Sección ──────────────────────────────────────────────
export const EditableSectionWrapper: FC<{
  sectionId: string;
  sectionLabel: string;
  children: (isEditingThisSection: boolean) => ReactNode;
  onSave: () => Promise<void>;
  onCancel?: () => void;
  className?: string;
  pencilPosition?: string;
}> = ({
  sectionId,
  sectionLabel,
  children,
  onSave,
  onCancel,
  className = '',
  pencilPosition = 'top-4 right-4',
}) => {
  const { isEditMode, activeSectionId, startEditingSection, stopEditingSection } = useLiveCMS();
  const [isSaving, setIsSaving] = useState(false);

  const isEditingThisSection = isEditMode && activeSectionId === sectionId;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      // Pequeña pausa para transición suave
      await new Promise((res) => setTimeout(res, 500));
      stopEditingSection();
    } catch (err) {
      console.error('Error al guardar sección:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    stopEditingSection();
  };

  return (
    <div
      className={`relative transition-all duration-300 ${
        isEditingThisSection
          ? 'ring-2 ring-brand-500/80 border border-brand-500/40 rounded-xl bg-brand-950/10 p-2 md:p-3 my-2'
          : isEditMode
          ? 'hover:ring-1 hover:ring-brand-500/40 transition-all rounded-lg'
          : ''
      } ${className}`}
    >
      {/* Overlay de Carga Fullscreen al Guardar */}
      {isSaving && (
        <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center text-white space-y-5 animate-[fade-in_0.25s_ease-out]">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-brand-400 border-t-transparent animate-spin shadow-[0_0_25px_rgba(20,184,166,0.6)]" />
          </div>
          <div className="text-center space-y-2 max-w-sm px-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-400 block font-mono">
              PUNTO CERO // CMS LIVE
            </span>
            <h3 className="text-xl font-light uppercase text-white tracking-wide">
              GUARDANDO CAMBIOS...
            </h3>
            <p className="text-xs text-neutral-300 font-light leading-relaxed">
              Sincronizando modificaciones en vivo de {sectionLabel}.
            </p>
          </div>
        </div>
      )}

      {/* Esquinas arquitectónicas cuando la sección está activa */}
      {isEditingThisSection && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-400 pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-400 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-400 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-400 pointer-events-none" />
        </>
      )}

      {/* Botón de edición cuando el modo está activo pero no en esta sección */}
      {isEditMode && !isEditingThisSection && (
        <EditPencilButton
          onClick={() => startEditingSection(sectionId)}
          label={`Editar ${sectionLabel}`}
          position={pencilPosition}
        />
      )}

      {/* Renderizado de los hijos pasando si esta sección está en edición */}
      {children(isEditingThisSection)}

      {/* Barra flotante inferior cuando esta sección está activa */}
      {isEditingThisSection && (
        <InlineEditBar
          sectionLabel={sectionLabel}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

// ── Componente de Texto Editable In-situ ──────────────────────────────────────
export const EditableText: FC<{
  value: string;
  isEditing: boolean;
  onChange: (val: string) => void;
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
  multiline?: boolean;
}> = ({ value, isEditing, onChange, className = '', as: Tag = 'span', multiline = false }) => {
  if (!isEditing) {
    return <Tag className={className}>{value}</Tag>;
  }

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={`${className} border-b-2 border-brand-400 bg-brand-950/20 text-brand-100 px-2 py-1 outline-none rounded-none focus:ring-1 focus:ring-brand-400 transition-all font-sans resize-y w-full`}
      />
    );
  }

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const text = e.currentTarget.textContent?.trim();
        if (text !== undefined && text !== value) {
          onChange(text);
        }
      }}
      className={`${className} border-b-2 border-brand-400 focus:outline-none focus:bg-brand-950/30 px-1 rounded-none transition-all cursor-text shadow-[0_0_12px_rgba(20,184,166,0.3)] text-brand-200 outline-none`}
    >
      {value}
    </Tag>
  );
};

// ── Componente de Imagen Editable In-situ ─────────────────────────────────────
export const EditableImage: FC<{
  src?: string;
  value?: string;
  isEditing: boolean;
  onUrlChange?: (newUrl: string) => void;
  onChange?: (newUrl: string) => void;
  className?: string;
  alt?: string;
  style?: CSSProperties;
  label?: string;
}> = ({
  src,
  value,
  isEditing,
  onUrlChange,
  onChange,
  className = '',
  alt = '',
  style,
  label,
}) => {
  const currentSrc = src ?? value ?? '';
  const handleChange = (newUrl: string) => {
    if (onUrlChange) onUrlChange(newUrl);
    if (onChange) onChange(newUrl);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isEditing) {
    return <img src={currentSrc} alt={alt} className={className} style={style} />;
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      handleChange(url);
    } catch (err) {
      console.error('Error al subir imagen:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualUrl = (e: MouseEvent) => {
    e.stopPropagation();
    const promptVal = window.prompt('O ingrese la URL directa de la imagen:', currentSrc);
    if (promptVal && promptVal.trim()) {
      handleChange(promptVal.trim());
    }
  };

  return (
    <div className="relative group/edit-img overflow-hidden cursor-pointer w-full h-full rounded shadow-lg border border-brand-500/40">
      {currentSrc ? (
        <img src={currentSrc} alt={alt} className={className || 'w-full h-32 object-cover'} style={style} />
      ) : (
        <div className="w-full h-32 bg-ink/20 flex items-center justify-center text-ink-soft text-xs">Sin imagen</div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm opacity-90 group-hover/edit-img:opacity-100 transition-all flex flex-col items-center justify-center p-3 text-center border-2 border-brand-400 z-30"
      >
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-brand-300 font-semibold mb-1 truncate max-w-full">
            {label}
          </span>
        )}
        {isUploading ? (
          <div className="flex items-center gap-2 text-brand-300 font-bold text-xs uppercase tracking-widest animate-pulse">
            <Upload className="w-4 h-4 animate-spin" /> SUBIENDO...
          </div>
        ) : (
          <div className="space-y-1 text-white">
            <ImageIcon className="w-5 h-5 mx-auto text-brand-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider block bg-brand-500 text-white px-2.5 py-1 rounded shadow">
              CAMBIAR IMAGEN
            </span>
            <button
              type="button"
              onClick={handleManualUrl}
              className="text-[9px] underline text-brand-200 hover:text-white block mt-0.5"
            >
              o pegar URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
