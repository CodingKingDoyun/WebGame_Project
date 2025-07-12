// 📁 src/hooks/useCropTimer.ts
import { useEffect, useRef } from 'react';
import { TileState } from '../types/farm';
import { CROP_LIST } from '../constants/crops';

interface UseCropTimerProps {
  user: any;
  isLoading: boolean;
  tiles: TileState[];
  setTiles: React.Dispatch<React.SetStateAction<TileState[]>>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  optimizedSave: (priority: 'immediate' | 'batch' | 'smart', reason: string) => void;
}

export const useCropTimer = ({ 
  user, 
  isLoading, 
  tiles, 
  setTiles, 
  setInventory, 
  optimizedSave 
}: UseCropTimerProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);
  const lastAutoSaveTime = useRef<number>(0);
  const accumulatedHarvests = useRef<number>(0); // 누적 수확 카운터 (Firebase 최적화용)
  
  // 최신 상태값을 참조하기 위한 ref들 - 초기값 설정
  const tilesRef = useRef(tiles);
  const setTilesRef = useRef(setTiles);
  const setInventoryRef = useRef(setInventory);
  const optimizedSaveRef = useRef(optimizedSave);
  
  // ref 값들을 최신 상태로 업데이트 - 단일 useEffect로 통합하여 최적화
  useEffect(() => {
    tilesRef.current = tiles;
    setTilesRef.current = setTiles;
    setInventoryRef.current = setInventory;
    optimizedSaveRef.current = optimizedSave;
  }); // 의존성 배열 없이 매 렌더링마다 업데이트하되, 타이머는 영향받지 않음

  // 안정적인 타이머 콜백 함수 - 함수 내부에서 직접 정의하여 의존성 제거
  const timerCallback = () => {
    // 타이머 상태 검증
    if (!isRunningRef.current) {
      console.warn('⚠️ 타이머가 중지 상태인데 콜백이 실행됨');
      return;
    }
    
    setTilesRef.current(currentTiles => {
      let hasChanges = false;
      let autoHarvestCount = 0;
      
      const updatedTiles = currentTiles.map(tile => {
        if (tile.type === 'crop' && tile.remainingTime !== undefined && tile.remainingTime > 0) {
          const newRemainingTime = Math.max(0, tile.remainingTime - 1);
          const wasNotReady = !tile.isReady;
          const isNowReady = newRemainingTime <= 0; // 0초가 되어야 수확
          
          if (wasNotReady && isNowReady) {
            // 자동 수확 및 재심기
            const cropInfo = CROP_LIST.find(c => c.name === tile.cropName);
            if (cropInfo) {
              setInventoryRef.current(prev => ({
                ...prev,
                [tile.cropName!]: (prev[tile.cropName!] || 0) + 1
              }));
              autoHarvestCount++;
              hasChanges = true;
              
              // 즉시 재심기
              return {
                ...tile,
                remainingTime: cropInfo.growTime,
                isReady: false
              };
            }
          }
          
          return {
            ...tile,
            remainingTime: newRemainingTime,
            isReady: isNowReady
          };
        }
        return tile;
      });
      
      // Firebase 최적화: 누적 수확 시스템
      if (hasChanges && autoHarvestCount > 0) {
        accumulatedHarvests.current += autoHarvestCount;
        const now = Date.now();
        const timeSinceLastSave = now - lastAutoSaveTime.current;
        
        // 조건부 저장: 60초 경과 OR 누적 수확 50개 이상
        const shouldSave = timeSinceLastSave > 60000 || accumulatedHarvests.current >= 50;
        
        if (shouldSave) {
          console.log(`🌾 Firebase 최적화 저장: 누적 ${accumulatedHarvests.current}개 수확`);
          optimizedSaveRef.current('smart', `누적 수확 ${accumulatedHarvests.current}개`);
          lastAutoSaveTime.current = now;
          accumulatedHarvests.current = 0; // 카운터 리셋
        } else {
          const remainingTime = Math.round((60000 - timeSinceLastSave) / 1000);
          const remainingCount = 50 - accumulatedHarvests.current;
          console.log(`🌾 수확 누적 중: ${accumulatedHarvests.current}/50개 (${remainingTime}초 또는 ${remainingCount}개 더 필요)`);
        }
      }
      
      return updatedTiles;
    });
  };

  useEffect(() => {
    // 타이머 시작 조건 체크
    const shouldRunTimer = user && !isLoading;
    
    if (!shouldRunTimer) {
      console.log('⏸️ 작물 타이머 중지:', !user ? '사용자 없음' : '로딩 중');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        isRunningRef.current = false;
      }
      return;
    }
    
    // 이미 실행 중이면 중복 실행 방지 (타이머 안정성 보장)
    if (isRunningRef.current && intervalRef.current) {
      console.log('✅ 작물 타이머 이미 안정적으로 실행 중');
      return;
    }
    
    // 기존 타이머가 있다면 정리 (안전장치)
    if (intervalRef.current) {
      console.log('🔄 기존 타이머 정리 후 재시작');
      clearInterval(intervalRef.current);
    }
    
    console.log('▶️ 작물 타이머 시작 (안정 모드)');
    isRunningRef.current = true;
    
    intervalRef.current = setInterval(timerCallback, 1000);

    return () => {
      console.log('⏹️ 작물 타이머 정리');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isRunningRef.current = false;
    };
  }, [user?.uid, isLoading]); // 사용자와 로딩 상태만 감지하여 최대한 안정화

  // 페이지 강제종료 시 저장 (beforeunload 이벤트)
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log(`🚨 페이지 종료 감지 - 긴급 저장 (누적 수확: ${accumulatedHarvests.current}개)`);
      
      // 즉시 저장 (동기식)
      try {
        optimizedSaveRef.current('immediate', `페이지 종료 저장 (누적: ${accumulatedHarvests.current}개)`);
        accumulatedHarvests.current = 0; // 카운터 리셋
        console.log('✅ 페이지 종료 저장 완료');
      } catch (error) {
        console.error('❌ 페이지 종료 저장 실패:', error);
      }
      
      // 브라우저에게 저장 중임을 알림 (선택사항)
      event.preventDefault();
      event.returnValue = '게임 데이터를 저장 중입니다...';
      return '게임 데이터를 저장 중입니다...';
    };

    const handleVisibilityChange = () => {
      if (document.hidden && accumulatedHarvests.current > 0) {
        console.log(`🔒 페이지 숨김 감지 - 누적 저장 (${accumulatedHarvests.current}개)`);
        optimizedSaveRef.current('batch', `페이지 숨김 저장 (누적: ${accumulatedHarvests.current}개)`);
        accumulatedHarvests.current = 0; // 카운터 리셋
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // 이벤트 리스너 정리
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.uid]);
};
