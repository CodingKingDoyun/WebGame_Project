// 📁 src/hooks/useAutoSave.ts
import { useEffect, useRef, useCallback } from 'react';
import { TileState } from '../types/farm';
import { FirebaseService } from '../services/firebaseService';

interface UseAutoSaveProps {
  user: any;
  isLoading: boolean;
  tiles: TileState[];
  inventory: Record<string, number>;
  gold: number;
}

export const useAutoSave = ({ user, isLoading, tiles, inventory, gold }: UseAutoSaveProps) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveGameData = useCallback(async (
    tilesToSave?: TileState[],
    inventoryToSave?: Record<string, number>,
    goldToSave?: number
  ) => {
    if (!user) {
      console.log('❌ 사용자가 로그인되지 않아 저장 중단');
      return false;
    }
    
    try {
      await FirebaseService.saveGameData(user.uid, {
        tiles: tilesToSave || tiles,
        inventory: inventoryToSave || inventory,
        gold: goldToSave !== undefined ? goldToSave : gold
      });
      return true;
    } catch (error) {
      console.error("❌ Firebase 저장 실패:", error);
      alert('데이터 저장에 실패했습니다. 인터넷 연결을 확인해주세요.');
      return false;
    }
  }, [user, tiles, inventory, gold]);

  // 디바운스된 저장
  useEffect(() => {
    if (!user || isLoading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      console.log('💾 디바운스 저장 실행');
      saveGameData();
    }, 1000); // 1초로 변경

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [tiles, inventory, gold, user, isLoading, saveGameData]);

  // 주기적 자동 저장
  useEffect(() => {
    if (!user || isLoading) return;
    
    autoSaveIntervalRef.current = setInterval(async () => {
      console.log('⏰ 자동 저장 실행');
      await saveGameData();
    }, 30000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [user, isLoading, saveGameData]);

  return { saveGameData };
};
