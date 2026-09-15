import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isAuthenticated, subscribeSessionExpired } from '../components/admin/shell/adminAuth';
import { siteContentRepo, SITE_CONTENT_UPDATED_EVENT } from '../data';

interface LiveCMSContextType {
  isEditMode: boolean;
  activeSectionId: string | null;
  isAdmin: boolean;
  content: Record<string, string>;
  getContent: (key: string, defaultValue: string) => string;
  updateContentLocally: (key: string, value: string) => void;
  saveSectionContent: (entries: Record<string, string>) => Promise<void>;
  toggleEditMode: () => void;
  startEditingSection: (sectionId: string) => void;
  stopEditingSection: () => void;
  refreshContent: () => Promise<void>;
}

const LiveCMSContext = createContext<LiveCMSContextType | undefined>(undefined);

export function LiveCMSProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAuthenticated());
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, string>>(() => siteContentRepo.getSync());

  // Mantener al día si el usuario es admin y los contenidos
  useEffect(() => {
    const checkAuth = () => {
      const authed = isAuthenticated();
      setIsAdmin(authed);
      if (!authed && isEditMode) {
        setIsEditMode(false);
        setActiveSectionId(null);
      }
    };

    checkAuth();
    const unsubscribeSession = subscribeSessionExpired(() => {
      setIsAdmin(false);
      setIsEditMode(false);
      setActiveSectionId(null);
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'puntocero:v1:site-content') {
        setContent(siteContentRepo.getSync());
      }
      checkAuth();
    };

    const onCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, string>>;
      if (customEvent.detail) {
        setContent(customEvent.detail);
      } else {
        setContent(siteContentRepo.getSync());
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(SITE_CONTENT_UPDATED_EVENT, onCustomUpdate);
    window.addEventListener('focus', checkAuth);

    return () => {
      unsubscribeSession();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SITE_CONTENT_UPDATED_EVENT, onCustomUpdate);
      window.removeEventListener('focus', checkAuth);
    };
  }, [isEditMode]);

  const toggleEditMode = () => {
    if (!isAuthenticated()) return;
    setIsEditMode((prev) => {
      if (prev) {
        setActiveSectionId(null);
      }
      return !prev;
    });
  };

  const startEditingSection = (sectionId: string) => {
    if (!isAuthenticated() || !isEditMode) return;
    setActiveSectionId(sectionId);
  };

  const stopEditingSection = () => {
    setActiveSectionId(null);
  };

  const getContent = (key: string, defaultValue: string): string => {
    if (content && typeof content[key] === 'string') {
      return content[key];
    }
    return defaultValue;
  };

  const updateContentLocally = (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const saveSectionContent = async (entries: Record<string, string>) => {
    const updated = await siteContentRepo.updateMany(entries);
    setContent(updated);
  };

  const refreshContent = async () => {
    const fresh = await siteContentRepo.getAll();
    setContent(fresh);
  };

  return (
    <LiveCMSContext.Provider
      value={{
        isEditMode,
        activeSectionId,
        isAdmin,
        content,
        getContent,
        updateContentLocally,
        saveSectionContent,
        toggleEditMode,
        startEditingSection,
        stopEditingSection,
        refreshContent,
      }}
    >
      {children}
    </LiveCMSContext.Provider>
  );
}

export function useLiveCMS() {
  const context = useContext(LiveCMSContext);
  if (!context) {
    throw new Error('useLiveCMS must be used within a LiveCMSProvider');
  }
  return context;
}
