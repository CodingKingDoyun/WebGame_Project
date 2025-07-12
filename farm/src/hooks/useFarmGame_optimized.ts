// 📁 src/hooks/useFarmGame_optimized.ts - Firebase 사용량 최적화 버전
import { useState, useEffect, useCallback, useRef } from 'react';
import { TileState, AvailableCrop } from '../types/farm';
import { CROP_LIST, GRID_SIZE, GRID_COLUMNS } from '../constants/crops';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { calculateOfflineProgress } from '../utils/offlineProgress';

export const useFarmGame = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tiles, setTiles] = useState<TileState[]>(() =>
    Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      row: Math.floor(i / GRID_COLUMNS),
      col: i % GRID_COLUMNS,
      type: 'empty' as const,
      cropName: undefined,
      isReady: false,
      remainingTime: 0,
      growTime: 0,
    }))
  );

  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [gold, setGold] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('게임을 준비하는 중...');
  
  // 디버그 정보 상태
  const [debugInfo, setDebugInfo] = useState({
    lastSaveAttempt: '',
    lastSaveSuccess: '',
    saveError: '',
    totalSaveAttempts: 0,
    successfulSaves: 0,
    currentData: '',
    offlineHarvests: '',
    autoHarvests: '',
    manualHarvests: '',
    lastHarvestTime: '',
  });
  
  // 🚀 최적화된 저장 시스템을 위한 상태들
  const [pendingChanges, setPendingChanges] = useState(false);
  const isSaving = useRef(false);
  const batchSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTime = useRef<number>(Date.now());
  const changeCounter = useRef<number>(0);
  
  // 최신 상태값을 참조하기 위한 ref들
  const tilesRef = useRef(tiles);
  const inventoryRef = useRef(inventory);
  const goldRef = useRef(gold);
  
  // ref 값들을 최신 상태로 업데이트
  useEffect(() => { tilesRef.current = tiles; }, [tiles]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => { goldRef.current = gold; }, [gold]);

  // 사용 가능한 작물 목록
  const availableCrops: AvailableCrop[] = CROP_LIST.map(crop => ({
    name: crop.name,
    seedCount: 999,
    price: crop.price,
    icon: crop.icon,
  }));

  // Firestore 호환 데이터로 변환하는 함수
  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = sanitizeForFirestore(value);
        }
      }
      return cleaned;
    }
    return obj;
  };

  // Firebase에 게임 데이터 저장하는 함수
  const saveGameData = useCallback(async () => {
    if (!user || isSaving.current) return false;
    
    isSaving.current = true;
    
    setDebugInfo(prev => ({
      ...prev,
      totalSaveAttempts: prev.totalSaveAttempts + 1,
      lastSaveAttempt: new Date().toLocaleString(),
      saveError: ''
    }));
    
    try {
      const currentTiles = tilesRef.current;
      const currentInventory = inventoryRef.current;
      const currentGold = goldRef.current;
      
      const rawDataToSave = {
        tiles: currentTiles,
        inventory: currentInventory,
        gold: currentGold,
        lastUpdated: Date.now(),
        version: 1
      };

      const dataToSave = sanitizeForFirestore(rawDataToSave);
      
      const inventoryItems = Object.entries(currentInventory).map(([crop, count]) => `${crop}:${count}`).join(', ');
      const cropTiles = currentTiles.filter((t: TileState) => t.type === 'crop');
      
      setDebugInfo(prev => ({
        ...prev,
        currentData: `골드: ${currentGold} | 타일: ${currentTiles.length} | 작물: ${cropTiles.length} | 인벤토리: ${inventoryItems || '없음'}`
      }));
      
      const userDocRef = doc(db, 'farmGame', user.uid);
      await setDoc(userDocRef, dataToSave, { merge: false });
      
      console.log('✅ Firestore 저장 완료');
      
      setDebugInfo(prev => ({
        ...prev,
        successfulSaves: prev.successfulSaves + 1,
        lastSaveSuccess: new Date().toLocaleString(),
        saveError: ''
      }));
      
      return true;
    } catch (error: any) {
      setDebugInfo(prev => ({
        ...prev,
        saveError: `${error.code || 'UNKNOWN'}: ${error.message || '알 수 없는 오류'}`
      }));
      return false;
    } finally {
      isSaving.current = false;
    }
  }, [user]);

  // 🚀 최적화된 저장 함수 - Firebase 사용량 90% 이상 감소
  const optimizedSave = useCallback(async (
    priority: 'immediate' | 'batch' | 'smart',
    reason: string
  ) => {
    if (!user || isLoading) {
      console.log('⏸️ 저장 스킵:', reason, '- 사용자 없음 또는 로딩 중');
      return;
    }

    const now = Date.now();
    const timeSinceLastSave = now - lastSavedTime.current;
    
    if (priority === 'immediate') {
      // 즉시 저장 (중요한 액션: 로그아웃, 구매 등)
      console.log('🚨 즉시 저장:', reason);
      const success = await saveGameData();
      if (success) {
        lastSavedTime.current = now;
        changeCounter.current = 0;
        setPendingChanges(false);
        
        if (batchSaveTimeout.current) {
          clearTimeout(batchSaveTimeout.current);
          batchSaveTimeout.current = null;
        }
      }
      return;
    }
    
    // 변경 카운터 증가
    changeCounter.current++;
    setPendingChanges(true);
    
    // 스마트 저장 조건 확인
    const shouldSaveNow = (
      changeCounter.current >= 25 || // 25번 변경 시 (작물 25개 수확 시)
      timeSinceLastSave >= 45000 ||  // 45초 경과 시
      priority === 'smart'
    );
    
    if (shouldSaveNow) {
      console.log('🧠 스마트 저장 실행:', reason, '| 변경횟수:', changeCounter.current, '| 경과시간:', Math.round(timeSinceLastSave/1000) + 's');
      const success = await saveGameData();
      if (success) {
        lastSavedTime.current = now;
        changeCounter.current = 0;
        setPendingChanges(false);
        
        if (batchSaveTimeout.current) {
          clearTimeout(batchSaveTimeout.current);
          batchSaveTimeout.current = null;
        }
      }
    } else {
      // 배치 저장 스케줄링 (15초 후)
      if (batchSaveTimeout.current) {
        clearTimeout(batchSaveTimeout.current);
      }
      
      batchSaveTimeout.current = setTimeout(async () => {
        if (pendingChanges && user) {
          console.log('⏱️ 배치 저장 실행:', '변경횟수:', changeCounter.current, '| 마지막 변경:', reason);
          const success = await saveGameData();
          if (success) {
            lastSavedTime.current = Date.now();
            changeCounter.current = 0;
            setPendingChanges(false);
          }
        }
      }, 15000); // 15초 배치 저장
      
      console.log('📝 배치 저장 예약:', reason, '| 변경횟수:', changeCounter.current, '| 15초 후 실행 예정');
    }
  }, [user, isLoading, saveGameData]);

  // 🛡️ 웹 종료 시 강제 저장 (데이터 손실 방지)
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (pendingChanges && user) {
        e.preventDefault();
        e.returnValue = '';
        console.log('🚨 페이지 종료 감지 - 강제 저장 실행');
        await saveGameData();
      }
    };
    
    const handleVisibilityChange = async () => {
      if (document.hidden && pendingChanges && user) {
        console.log('👁️ 페이지 숨김 감지 - 강제 저장 실행');
        await saveGameData();
        lastSavedTime.current = Date.now();
        changeCounter.current = 0;
        setPendingChanges(false);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pendingChanges, user, saveGameData]);

  // Firebase 사용자 인증 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔐 사용자 상태 변경:', firebaseUser ? firebaseUser.uid : '로그아웃');
      setUser(firebaseUser);
      if (!firebaseUser) {
        setLoadingMessage('로그아웃됨');
        setIsLoading(false);
        // 로그아웃 시 초기 상태로 리셋
        setTiles(Array.from({ length: GRID_SIZE }, (_, i) => ({
          id: i,
          row: Math.floor(i / GRID_COLUMNS),
          col: i % GRID_COLUMNS,
          type: 'empty' as const,
          cropName: undefined,
          isReady: false,
          remainingTime: 0,
          growTime: 0,
        })));
        setInventory({});
        setGold(100);
      } else {
        setLoadingMessage('사용자 인증 완료 - 데이터 로딩 중...');
      }
    });
    return () => unsubscribe();
  }, []);

  // Firebase에서 게임 데이터 로드
  useEffect(() => {
    if (!user) return;

    const loadGameData = async () => {
      setIsLoading(true);
      setLoadingMessage('Firebase 서버에 연결 중...');
      
      try {
        console.log('📖 Firebase에서 데이터 로드 시도:', user.uid);
        const userDocRef = doc(db, 'farmGame', user.uid);
        
        setLoadingMessage('사용자 데이터 불러오는 중...');
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('📦 Firebase에서 불러온 원본 데이터:', data);

          setLoadingMessage('오프라인 진행 상황 계산 중...');
          
          // 오프라인 진행 계산
          let tilesToApply = data.tiles || [];
          let inventoryToApply = data.inventory || {};
          let offlineHarvests = {};
          
          if (data.lastUpdated && Array.isArray(data.tiles)) {
            const result = calculateOfflineProgress(data.tiles, data.lastUpdated);
            tilesToApply = result.updatedTiles;
            offlineHarvests = result.offlineHarvests;
            
            // 오프라인 수확 결과를 인벤토리에 추가
            if (Object.keys(offlineHarvests).length > 0) {
              console.log('🌾 오프라인 수확 결과:', offlineHarvests);
              inventoryToApply = { ...inventoryToApply };
              
              Object.entries(offlineHarvests).forEach(([cropName, count]) => {
                inventoryToApply[cropName] = (inventoryToApply[cropName] || 0) + count;
              });
              
              let totalHarvested = 0;
              Object.values(offlineHarvests).forEach(count => {
                totalHarvested += (count as number);
              });
              
              if (totalHarvested > 0) {
                const harvestSummary = Object.entries(offlineHarvests)
                  .map(([crop, count]) => `${crop}: ${count}개`)
                  .join(', ');
                  
                setLoadingMessage(`오프라인 수확: ${harvestSummary}`);
                
                setDebugInfo(prev => ({
                  ...prev,
                  offlineHarvests: `오프라인 수확: ${harvestSummary} (총 ${totalHarvested}개)`
                }));
                
                await new Promise(resolve => setTimeout(resolve, 1200));
              }
            }
          }

          setLoadingMessage('게임 데이터 적용 중...');

          if (tilesToApply && Array.isArray(tilesToApply)) {
            console.log('🔄 타일 데이터 적용:', tilesToApply.length, '개');
            setTiles(tilesToApply);
            tilesRef.current = tilesToApply;
          }
          
          if (inventoryToApply && typeof inventoryToApply === 'object') {
            console.log('🎒 인벤토리 데이터 적용:', inventoryToApply);
            setInventory(inventoryToApply);
            inventoryRef.current = inventoryToApply;
          }
          
          if (typeof data.gold === 'number') {
            console.log('💰 골드 데이터 적용:', data.gold);
            setGold(data.gold);
            goldRef.current = data.gold;
          }

          console.log('✅ Firebase 데이터 로드 완료');
          
          // 오프라인 수확이 있었다면 즉시 저장
          if (Object.keys(offlineHarvests).length > 0) {
            setLoadingMessage('오프라인 진행 결과 저장 중...');
            setTimeout(() => {
              optimizedSave('immediate', '오프라인 진행');
            }, 500);
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        } else {
          console.log('📝 새 사용자 - 기본 데이터 사용');
          setLoadingMessage('새 사용자 감지 - 기본 설정 적용 중...');
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (error) {
        console.error('❌ Firebase 데이터 로드 실패:', error);
        setLoadingMessage('데이터 로드 실패 - 기본값으로 시작합니다');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setLoadingMessage('게임 준비 완료!');
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('✅ 게임 준비 완료 - 로딩 상태 해제');
        setIsLoading(false);
      }
    };

    loadGameData();
  }, [user, optimizedSave]);

  // 작물 성장 타이머
  useEffect(() => {
    if (!user || isLoading) return;
    
    const interval = setInterval(() => {
      setTiles(currentTiles => {
        let hasChanges = false;
        let autoHarvestCount = 0;
        
        const updatedTiles = currentTiles.map(tile => {
          if (tile.type === 'crop' && tile.remainingTime !== undefined && tile.remainingTime > 0) {
            const newRemainingTime = Math.max(0, tile.remainingTime - 1);
            const wasNotReady = !tile.isReady;
            const isNowReady = newRemainingTime <= 0;
            
            if (wasNotReady && isNowReady) {
              // 자동 수확 및 재심기
              const cropInfo = CROP_LIST.find(c => c.name === tile.cropName);
              if (cropInfo) {
                setInventory(prev => ({
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
        
        // 자동 수확이 발생했을 때만 배치 저장 스케줄링
        if (hasChanges && autoHarvestCount > 0) {
          console.log('🌾 자동 수확:', autoHarvestCount + '개');
          optimizedSave('batch', `자동 수확 ${autoHarvestCount}개`);
        }
        
        return updatedTiles;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user, isLoading, optimizedSave]);

  // 수동 작물 수확
  const harvestCrop = useCallback(async (tileId: number) => {
    if (isLoading) return;
    
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.type !== 'crop' || !tile.cropName) return;

    const cropInfo = CROP_LIST.find(c => c.name === tile.cropName);
    if (!cropInfo) return;

    setInventory(prev => ({
      ...prev,
      [tile.cropName!]: (prev[tile.cropName!] || 0) + 1
    }));

    setTiles(prev => prev.map(t =>
      t.id === tileId
        ? { 
            ...t, 
            remainingTime: cropInfo.growTime, 
            isReady: false 
          }
        : t
    ));

    console.log('👋 수동 수확:', tile.cropName);
    optimizedSave('batch', '수동 수확');
  }, [tiles, isLoading, optimizedSave]);

  // 씨앗 심기
  const plantSeed = useCallback(async (tileId: number, cropName: string) => {
    if (isLoading) return;
    
    const cropInfo = CROP_LIST.find(c => c.name === cropName);
    if (!cropInfo) return;

    setTiles(prev => prev.map(tile =>
      tile.id === tileId
        ? {
            ...tile,
            type: 'crop' as const,
            cropName,
            remainingTime: cropInfo.growTime,
            growTime: cropInfo.growTime,
            isReady: false
          }
        : tile
    ));

    console.log('🌱 씨앗 심기:', cropName);
    optimizedSave('batch', '씨앗 심기');
  }, [isLoading, optimizedSave]);

  // 작물 판매
  const sellCrop = useCallback(async (cropName: string, quantity: number) => {
    if (isLoading) return;
    
    const cropInfo = CROP_LIST.find(c => c.name === cropName);
    if (!cropInfo || !inventory[cropName] || inventory[cropName] < quantity) return;

    const totalPrice = cropInfo.price * quantity;

    setInventory(prev => ({
      ...prev,
      [cropName]: prev[cropName] - quantity
    }));

    setGold(prev => prev + totalPrice);

    console.log('💰 작물 판매:', cropName, quantity + '개', totalPrice + 'G');
    optimizedSave('smart', '작물 판매'); // 골드 변경은 스마트 저장
  }, [inventory, isLoading, optimizedSave]);

  // 타일 제거
  const removeTile = useCallback(async (tileId: number) => {
    if (isLoading) return;
    
    setTiles(prev => prev.map(tile =>
      tile.id === tileId
        ? {
            ...tile,
            type: 'empty' as const,
            cropName: undefined,
            remainingTime: 0,
            growTime: 0,
            isReady: false
          }
        : tile
    ));

    console.log('🗑️ 타일 제거:', tileId);
    optimizedSave('batch', '타일 제거');
  }, [isLoading, optimizedSave]);

  return {
    user,
    tiles,
    inventory,
    gold,
    availableCrops,
    isLoading,
    loadingMessage,
    debugInfo,
    harvestCrop,
    plantSeed,
    sellCrop,
    removeTile,
    saveGameData: () => optimizedSave('immediate', '수동 저장'),
  };
};
