// 📁 src/hooks/useFarmGame.ts
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
  
  // 디버그 정보 상태 추가
  const [debugInfo, setDebugInfo] = useState({
    lastSaveAttempt: '',
    lastSaveSuccess: '',
    saveError: '',
    totalSaveAttempts: 0,
    successfulSaves: 0,
    currentData: '',
    offlineHarvests: '', // 오프라인 수확 정보
    autoHarvests: '', // 자동 수확 정보
    manualHarvests: '', // 수동 수확 정보
    lastHarvestTime: '', // 마지막 수확 시간
  });
  
  // 저장 중복 방지를 위한 ref
  const isSaving = useRef(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // 최신 상태값을 참조하기 위한 ref들
  const tilesRef = useRef(tiles);
  const inventoryRef = useRef(inventory);
  const goldRef = useRef(gold);
  
  // ref 값들을 최신 상태로 업데이트
  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);
  
  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);
  
  useEffect(() => {
    goldRef.current = gold;
  }, [gold]);

  // 사용 가능한 작물 목록
  const availableCrops: AvailableCrop[] = CROP_LIST.map(crop => ({
    name: crop.name,
    seedCount: 999,
    price: crop.price,
    icon: crop.icon,
  }));

  // Firestore 호환 데이터로 변환하는 함수 (undefined 값 제거)
  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeForFirestore);
    }
    
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

  // Firebase에 게임 데이터 저장하는 함수 - ref를 사용해서 의존성 제거
  const saveGameData = useCallback(async () => {
    if (!user || isSaving.current) {
      setDebugInfo(prev => ({
        ...prev,
        saveError: `저장 조건 불충족 - 사용자: ${!!user}, 저장중: ${isSaving.current}`,
        lastSaveAttempt: new Date().toLocaleString()
      }));
      return false;
    }
    
    isSaving.current = true;
    
    // 저장 시도 카운트 증가
    setDebugInfo(prev => ({
      ...prev,
      totalSaveAttempts: prev.totalSaveAttempts + 1,
      lastSaveAttempt: new Date().toLocaleString(),
      saveError: ''
    }));
    
    try {
      // ref에서 최신 상태값 가져오기
      const currentTiles = tilesRef.current;
      const currentInventory = inventoryRef.current;
      const currentGold = goldRef.current;
      
      // 저장할 데이터 구성 - undefined 값 제거
      const rawDataToSave = {
        tiles: currentTiles,
        inventory: currentInventory,
        gold: currentGold,
        lastUpdated: Date.now(),
        version: 1
      };

      // Firestore 호환 데이터로 변환 (undefined 제거)
      const dataToSave = sanitizeForFirestore(rawDataToSave);

      // 데이터 유효성 검사
      if (!Array.isArray(currentTiles)) {
        throw new Error('tiles가 배열이 아닙니다: ' + typeof currentTiles);
      }
      
      if (typeof currentGold !== 'number') {
        throw new Error('gold가 숫자가 아닙니다: ' + typeof currentGold);
      }
      
      if (typeof currentInventory !== 'object' || currentInventory === null) {
        throw new Error('inventory가 객체가 아닙니다: ' + typeof currentInventory);
      }

      // undefined 값이 있는지 검사
      const hasUndefined = JSON.stringify(rawDataToSave).includes('undefined');
      if (hasUndefined) {
        console.warn('⚠️ undefined 값이 감지되어 제거됨');
      }

      // 더 자세한 디버그 정보 업데이트
      const inventoryItems = Object.entries(currentInventory).map(([crop, count]) => `${crop}:${count}`).join(', ');
      const cropTiles = currentTiles.filter((t: TileState) => t.type === 'crop');
      const readyCrops = cropTiles.filter((t: TileState) => t.isReady).length;
      
      setDebugInfo(prev => ({
        ...prev,
        currentData: `골드: ${currentGold} | 타일: ${currentTiles.length} | 작물: ${cropTiles.length} (완성: ${readyCrops}) | 인벤토리: ${inventoryItems || '없음'}`
      }));
      
      console.log('🔄 저장할 데이터:', {
        user: user.uid,
        tilesCount: currentTiles.length,
        gold: currentGold,
        inventory: currentInventory,
        cropTiles: cropTiles.length,
        sanitizedData: dataToSave, // 정제된 데이터 로깅
        hasUndefined: hasUndefined
      });
      
      const userDocRef = doc(db, 'farmGame', user.uid);
      
      // 더 안전한 저장을 위해 기존 데이터와 병합하지 않고 완전 덮어쓰기
      await setDoc(userDocRef, dataToSave, { merge: false });
      
      console.log('✅ Firestore 저장 완료');
      
      // 저장 후 실제로 저장된 데이터 확인
      try {
        const savedDoc = await getDoc(userDocRef);
        if (savedDoc.exists()) {
          const savedData = savedDoc.data();
          console.log('📖 저장된 데이터 확인:', {
            gold: savedData.gold,
            inventoryKeys: Object.keys(savedData.inventory || {}),
            tilesCount: savedData.tiles?.length || 0,
            lastUpdated: new Date(savedData.lastUpdated).toLocaleString()
          });
          
          // 저장된 데이터와 저장하려던 데이터 비교
          const isGoldSame = savedData.gold === currentGold;
          const isInventorySame = JSON.stringify(savedData.inventory) === JSON.stringify(currentInventory);
          const isTilesSame = savedData.tiles?.length === currentTiles.length;
          
          setDebugInfo(prev => ({
            ...prev,
            currentData: prev.currentData + ` | 검증: 골드${isGoldSame ? '✓' : '✗'} 인벤토리${isInventorySame ? '✓' : '✗'} 타일${isTilesSame ? '✓' : '✗'}`
          }));
        }
      } catch (verifyError) {
        console.warn('⚠️ 저장 검증 실패:', verifyError);
      }
      
      // 성공 시 디버그 정보 업데이트
      setDebugInfo(prev => ({
        ...prev,
        successfulSaves: prev.successfulSaves + 1,
        lastSaveSuccess: new Date().toLocaleString(),
        saveError: ''
      }));
      
      return true;
    } catch (error: any) {
      // 실패 시 디버그 정보 업데이트
      setDebugInfo(prev => ({
        ...prev,
        saveError: `${error.code || 'UNKNOWN'}: ${error.message || '알 수 없는 오류'}`
      }));
      return false;
    } finally {
      isSaving.current = false;
    }
  }, [user]); // 의존성을 user만 남김 - ref 사용으로 상태 의존성 제거

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
        
        // 로딩 단계 업데이트
        setLoadingMessage('사용자 데이터 불러오는 중...');
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('📦 Firebase에서 불러온 원본 데이터:', data);

          // 로딩 단계 업데이트
          setLoadingMessage('오프라인 진행 상황 계산 중...');
          
          // 오프라인 진행 계산
          let tilesToApply = data.tiles || [];
          let inventoryToApply = data.inventory || {};
          let offlineHarvests = {};
          
          if (data.lastUpdated && Array.isArray(data.tiles)) {
            const result = calculateOfflineProgress(
              data.tiles, 
              data.lastUpdated
            );
            
            tilesToApply = result.updatedTiles;
            offlineHarvests = result.offlineHarvests;
            
            // 오프라인 수확 결과를 인벤토리에 추가
            if (Object.keys(offlineHarvests).length > 0) {
              console.log('🌾 오프라인 수확 결과:', offlineHarvests);
              inventoryToApply = { ...inventoryToApply };
              
              Object.entries(offlineHarvests).forEach(([cropName, count]) => {
                inventoryToApply[cropName] = (inventoryToApply[cropName] || 0) + count;
              });
                   // 오프라인 수확이 있었다면 표시
          if (Object.keys(offlineHarvests).length > 0) {
            let totalHarvested = 0;
            Object.values(offlineHarvests).forEach(count => {
              totalHarvested += (count as number);
            });
            
            if (totalHarvested > 0) {
              const harvestSummary = Object.entries(offlineHarvests)
                .map(([crop, count]) => `${crop}: ${count}개`)
                .join(', ');
                
              setLoadingMessage(`오프라인 수확: ${harvestSummary}`);
              
              // 디버그 정보에 오프라인 수확 결과 추가
              setDebugInfo(prev => ({
                ...prev,
                offlineHarvests: `오프라인 수확: ${harvestSummary} (총 ${totalHarvested}개)`
              }));
              
              // 잠시 오프라인 수확 결과 보여주기
              await new Promise(resolve => setTimeout(resolve, 1200));
            }
          }
            }
          }

          setLoadingMessage('게임 데이터 적용 중...');

          // 데이터 유효성 검증 및 적용
          if (tilesToApply && Array.isArray(tilesToApply)) {
            console.log('🔄 타일 데이터 적용:', tilesToApply.length, '개');
            setTiles(tilesToApply);
            tilesRef.current = tilesToApply;
            setLoadingMessage('농장 타일 데이터 적용 완료');
          }
          
          if (inventoryToApply && typeof inventoryToApply === 'object') {
            console.log('🎒 인벤토리 데이터 적용:', inventoryToApply);
            setInventory(inventoryToApply);
            inventoryRef.current = inventoryToApply;
            setLoadingMessage('인벤토리 데이터 적용 완료');
          }
          
          if (typeof data.gold === 'number') {
            console.log('💰 골드 데이터 적용:', data.gold);
            setGold(data.gold);
            goldRef.current = data.gold;
            setLoadingMessage('골드 데이터 적용 완료');
          }

          console.log('✅ Firebase 데이터 로드 완료');
          isInitialLoading.current = false;
          loadCompleteTime.current = Date.now();
          
          setLoadingMessage('데이터 로드 완료! 게임 준비 중...');
          
          // 데이터 초기화 완료 후 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 오프라인 수확이 있었다면 즉시 저장
          if (Object.keys(offlineHarvests).length > 0) {
            setLoadingMessage('오프라인 진행 결과 저장 중...');
            // 3초 후에 오프라인 진행 결과 저장
            setTimeout(() => {
              saveImmediately('오프라인 진행');
            }, 500);
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        } else {
          console.log('📝 새 사용자 - 기본 데이터 사용');
          setLoadingMessage('새 사용자 감지 - 기본 설정 적용 중...');
          isInitialLoading.current = false;
          loadCompleteTime.current = Date.now();
          // 새 사용자는 기본값 그대로 사용 (저장은 나중에)
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (error) {
        console.error('❌ Firebase 데이터 로드 실패:', error);
        setLoadingMessage('데이터 로드 실패 - 기본값으로 시작합니다');
        // 오류가 발생해도 게임을 계속할 수 있도록 기본값 사용
        isInitialLoading.current = false;
        loadCompleteTime.current = Date.now();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        // 데이터 로딩이 완전히 끝난 후 단계별 완료 메시지
        setLoadingMessage('게임 준비 완료!');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log('✅ 게임 준비 완료 - 로딩 상태 해제');
        setIsLoading(false);
      }
    };

    loadGameData();
  }, [user]); // saveGameData 의존성 제거

  // 데이터 로드 완료 후 자동 저장 지연을 위한 ref
  const isInitialLoading = useRef(true);
  const loadCompleteTime = useRef<number>(0);

  // 즉시 자동저장 함수 (중요한 변경사항용)
  const saveImmediately = useCallback(async (reason: string) => {
    if (!user || isLoading || isSaving.current) {
      console.log('⏸️ 즉시 저장 스킵:', reason, '- 조건 불충족');
      return;
    }
    
    // 데이터 로드 완료 후 3초 이내에는 자동 저장 방지 (새로고침 경합 방지)
    const timeSinceLoad = Date.now() - loadCompleteTime.current;
    if (timeSinceLoad < 3000) {
      console.log('⏸️ 데이터 로드 후 3초 대기 중... (즉시 저장 지연):', reason);
      return;
    }
    
    console.log('🚀 즉시 저장 실행 (' + reason + ') - 현재 인벤토리:', Object.keys(inventoryRef.current).length, '종류');
    const success = await saveGameData();
    if (success) {
      console.log('✅ 즉시 저장 성공 (' + reason + ')');
    } else {
      console.error('❌ 즉시 저장 실패 (' + reason + ')');
    }
  }, [user, isLoading, saveGameData]);

  // 디바운스된 자동 저장 - useCallback으로 함수 메모이제이션
  const debouncedSave = useCallback(async () => {
    if (!user || isLoading || isSaving.current) return;
    
    // 데이터 로드 완료 후 3초 이내에는 자동 저장 방지 (새로고침 경합 방지)
    const timeSinceLoad = Date.now() - loadCompleteTime.current;
    if (timeSinceLoad < 3000) {
      console.log('⏸️ 데이터 로드 후 3초 대기 중... (자동 저장 지연)');
      return;
    }
    
    console.log('💾 디바운스 저장 실행 - 현재 상태:', { 
      tilesCount: tilesRef.current.length, 
      cropCount: tilesRef.current.filter(t => t.type === 'crop').length,
      inventoryItems: Object.keys(inventoryRef.current).length, 
      gold: goldRef.current 
    });
    await saveGameData();
  }, [user, isLoading, saveGameData]);

  useEffect(() => {
    if (!user || isLoading) return;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    // 데이터 로드 완료 후 3초 지연
    if (isInitialLoading.current) {
      loadCompleteTime.current = Date.now();
      isInitialLoading.current = false;
    } else {
      const elapsed = Date.now() - loadCompleteTime.current;
      const delay = Math.max(0, 3000 - elapsed); // 최소 0ms 지연
      saveTimeout.current = setTimeout(debouncedSave, delay);
    }

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [debouncedSave]);

  // 작물 성장 타이머
  useEffect(() => {
    if (!user || isLoading) return;
    
    const interval = setInterval(() => {
      setTiles(prev => {
        let inventoryUpdates: Record<string, number> = {};
        let hasHarvests = false;
        let updatedTiles = prev;
        
        const newTiles = prev.map(tile => {
          if (tile.type === 'crop' && tile.remainingTime && tile.remainingTime > 0) {
            const newRemainingTime = tile.remainingTime - 1;
            
            if (newRemainingTime <= 0 && tile.cropName) {
              // 작물 완성 시 즉시 수확 및 자동 재배
              inventoryUpdates[tile.cropName] = (inventoryUpdates[tile.cropName] || 0) + 1;
              hasHarvests = true;
              
              console.log('🌾 자동 수확:', tile.cropName, '(타일:', tile.id, ')');
              
              // 새로운 성장 사이클 즉시 시작 (자동 재배)
              return {
                ...tile,
                isReady: false,
                remainingTime: tile.growTime || 10
              };
            }
            
            return {
              ...tile,
              remainingTime: newRemainingTime,
              isReady: false // 항상 false로 유지 (자동 재배이므로)
            };
          }
          return tile;
        });
        
        // 인벤토리 업데이트가 있다면 즉시 처리
        if (Object.keys(inventoryUpdates).length > 0) {
          // 수확된 작물 수 계산
          const totalHarvested = Object.values(inventoryUpdates).reduce((sum, count) => sum + count, 0);
          
          // 인벤토리 업데이트
          setInventory(prevInv => {
            const newInv = { ...prevInv };
            Object.entries(inventoryUpdates).forEach(([crop, count]) => {
              newInv[crop] = (newInv[crop] || 0) + count;
            });
            // ref도 즉시 업데이트
            inventoryRef.current = newInv;
            return newInv;
          });
          
          // 타일 ref도 즉시 업데이트
          tilesRef.current = newTiles;
          
          console.log('🎉 자동 수확 완료:', totalHarvested, '개 작물 수확');
          
          // 디버그 정보 업데이트
          const harvestSummary = Object.entries(inventoryUpdates)
            .map(([crop, count]) => `${crop}: ${count}개`)
            .join(', ');
          
          setDebugInfo(prev => ({
            ...prev,
            autoHarvests: harvestSummary,
            lastHarvestTime: new Date().toLocaleString()
          }));
          
          // 자동 수확 시 즉시 저장 (debounce 타이머 클리어)
          if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
          }
          // 비동기로 즉시 저장 실행 (타이머 블록하지 않음)
          setTimeout(() => {
            saveImmediately('자동 수확');
          }, 0);
        }
        
        return newTiles;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user, isLoading, saveImmediately]);

  // 수동 수확 및 자동 재배 시작
  const harvestCrop = async (tileId: number) => {
    // 로딩 중에는 액션 차단
    if (isLoading) {
      console.log('⏸️ 로딩 중이므로 수확 액션이 차단됩니다');
      return;
    }
    
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.type !== 'crop' || !tile.cropName) return;

    console.log('🌾 수동 수확 및 자동 재배 시작:', tile.cropName, '(타일:', tileId, ')');

    const newInventory = {
      ...inventory,
      [tile.cropName]: (inventory[tile.cropName] || 0) + 1
    };

    // 수확 후 즉시 같은 작물로 자동 재배 시작
    const newTiles = tiles.map(t =>
      t.id === tileId
        ? {
            ...t,
            type: 'crop' as const,
            cropName: tile.cropName, // 같은 작물로 자동 재배
            isReady: false,
            remainingTime: tile.growTime || 10,
            growTime: tile.growTime || 10,
          }
        : t
    );

    // 상태 업데이트
    setInventory(newInventory);
    setTiles(newTiles);

    // ref에 최신값 즉시 업데이트
    tilesRef.current = newTiles;
    inventoryRef.current = newInventory;
    
    console.log('✅ 수동 수확 완료:', tile.cropName, '1개 수확, 자동 재배 시작');
    
    // 디버그 정보 업데이트
    setDebugInfo(prev => ({
      ...prev,
      manualHarvests: `${tile.cropName}: 1개`,
      lastHarvestTime: new Date().toLocaleString()
    }));
    
    // 수동 수확 시 즉시 저장 (debounce 타이머 클리어)
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    await saveImmediately('수동 수확');
  };

  const plantSeed = async (tileId: number, cropName: string) => {
    // 로딩 중에는 액션 차단
    if (isLoading) {
      console.log('⏸️ 로딩 중이므로 씨앗 심기 액션이 차단됩니다');
      return;
    }
    
    const cropInfo = CROP_LIST.find(c => c.name === cropName);
    if (!cropInfo) return;

    console.log('🌱 씨앗 심기:', cropName, '(타일:', tileId, ')');

    const newTiles = tiles.map(tile =>
      tile.id === tileId
        ? {
            ...tile,
            type: 'crop' as const,
            cropName,
            isReady: false,
            remainingTime: cropInfo.growTime,
            growTime: cropInfo.growTime,
          }
        : tile
    );

    setTiles(newTiles);

    // ref에 최신값 즉시 업데이트
    tilesRef.current = newTiles;
    
    console.log('✅ 씨앗 심기 완료:', cropName, '성장 시간:', cropInfo.growTime, '초');
    
    // 씨앗 심기 시 즉시 저장 (debounce 타이머 클리어)
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    await saveImmediately('씨앗 심기');
  };

  const sellCrop = async (cropName: string, quantity: number) => {
    // 로딩 중에는 액션 차단
    if (isLoading) {
      console.log('⏸️ 로딩 중이므로 작물 판매 액션이 차단됩니다');
      return;
    }
    
    const cropInfo = CROP_LIST.find(c => c.name === cropName);
    if (!cropInfo) return;
    
    console.log('💰 작물 판매:', cropName, 'x', quantity, '=', cropInfo.price * quantity, 'G');
    
    const totalPrice = cropInfo.price * quantity;
    const newGold = gold + totalPrice;
    
    const newInventory = { ...inventory };
    newInventory[cropName] = Math.max(0, (newInventory[cropName] || 0) - quantity);
    if (newInventory[cropName] === 0) {
      delete newInventory[cropName];
    }

    setGold(newGold);
    setInventory(newInventory);

    // ref에 최신값 즉시 업데이트
    goldRef.current = newGold;
    inventoryRef.current = newInventory;
    
    console.log('✅ 작물 판매 완료. 새 골드:', newGold, 'G');
    
    // 작물 판매 시 즉시 저장 (debounce 타이머 클리어)
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    await saveImmediately('작물 판매');
  };

  const removeTile = async (tileId: number) => {
    // 로딩 중에는 액션 차단
    if (isLoading) {
      console.log('⏸️ 로딩 중이므로 타일 제거 액션이 차단됩니다');
      return;
    }
    
    console.log('🗑️ 타일 제거 (타일:', tileId, ')');
    
    const newTiles = tiles.map(t => 
      t.id === tileId 
        ? { ...t, type: 'empty' as const, cropName: undefined, isReady: false, remainingTime: 0, growTime: 0 }
        : t
    );

    setTiles(newTiles);

    // ref에 최신값 즉시 업데이트
    tilesRef.current = newTiles;
    
    console.log('✅ 타일 제거 완료');
    
    // 타일 제거 시 즉시 저장 (debounce 타이머 클리어)
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    await saveImmediately('타일 제거');
  };

  return {
    user,
    tiles,
    inventory,
    gold,
    availableCrops,
    isLoading,
    harvestCrop,
    plantSeed,
    sellCrop,
    removeTile,
    debugInfo, // 디버그 정보 추가
    saveGameData, // 수동 저장을 위해 함수도 노출
    saveImmediately, // 즉시 저장 함수 추가
    loadingMessage, // 로딩 메시지 추가
  };
};
