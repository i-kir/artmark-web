import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClipStatus } from '@/types';

interface ClipKey {
  targetType: 'museum' | 'exhibition';
  targetId: string;
}

interface ClipContextType {
  setClipStatus: (targetType: 'museum' | 'exhibition', targetId: string, status: ClipStatus) => void;
  getClipStatus: (targetType: 'museum' | 'exhibition', targetId: string) => ClipStatus;
  getClipsByStatus: (status: ClipStatus) => ClipKey[];
}

const ClipContext = createContext<ClipContextType | undefined>(undefined);

const STORAGE_KEY = '@artmark_clips';

export const ClipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store clips as a dictionary where key is `${targetType}_${targetId}` and value is ClipStatus
  const [clips, setClips] = useState<Record<string, ClipStatus>>({});

  useEffect(() => {
    const loadClips = () => {
      try {
        const storedClips = localStorage.getItem(STORAGE_KEY);
        if (storedClips) {
          setClips(JSON.parse(storedClips));
        }
      } catch (error) {
        console.error('Failed to load clips from localStorage', error);
      }
    };
    
    loadClips();
  }, []);

  const makeKey = (targetType: 'museum' | 'exhibition', targetId: string) => `${targetType}_${targetId}`;

  const setClipStatus = (targetType: 'museum' | 'exhibition', targetId: string, status: ClipStatus) => {
    const key = makeKey(targetType, targetId);
    
    const newClips = { ...clips };
    
    if (status === 'none') {
      delete newClips[key];
    } else {
      newClips[key] = status;
    }
    
    setClips(newClips);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClips));
    } catch (error) {
      console.error('Failed to save clips to localStorage', error);
    }
  };

  const getClipStatus = (targetType: 'museum' | 'exhibition', targetId: string): ClipStatus => {
    const key = makeKey(targetType, targetId);
    return clips[key] || 'none';
  };

  const getClipsByStatus = (status: ClipStatus): ClipKey[] => {
    return Object.entries(clips)
      .filter(([_, clipStatus]) => clipStatus === status)
      .map(([key, _]) => {
        const [targetType, targetId] = key.split('_');
        return { 
          targetType: targetType as 'museum' | 'exhibition', 
          targetId 
        };
      });
  };

  return (
    <ClipContext.Provider value={{ setClipStatus, getClipStatus, getClipsByStatus }}>
      {children}
    </ClipContext.Provider>
  );
};

export const useClip = () => {
  const context = useContext(ClipContext);
  if (context === undefined) {
    throw new Error('useClip must be used within a ClipProvider');
  }
  return context;
};

// Export an alias
export const useClips = useClip;
