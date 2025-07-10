// 📁 src/services/firebaseService.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { TileState } from '../types/farm';
import { GRID_SIZE, GRID_COLUMNS } from '../constants/crops';

export interface GameData {
  tiles: TileState[];
  inventory: Record<string, number>;
  gold: number;
  lastUpdated: number;
  version?: number;
}

export class FirebaseService {
  static async loadGameData(userId: string): Promise<GameData | null> {
    try {
      console.log('📖 Firebase에서 데이터 로드 시도:', userId);
      const userDocRef = doc(db, 'farmGame', userId);
      const docSnapshot = await getDoc(userDocRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log('📦 Firebase에서 불러온 데이터:', {
          tiles: data.tiles?.length || 0,
          inventory: Object.keys(data.inventory || {}).length,
          gold: data.gold || 0,
          lastUpdated: new Date(data.lastUpdated || Date.now()).toLocaleString()
        });

        return {
          tiles: data.tiles || [],
          inventory: data.inventory || {},
          gold: data.gold || 100,
          lastUpdated: data.lastUpdated || Date.now(),
          version: data.version || 1
        };
      }
      
      return null;
    } catch (error) {
      console.error("❌ Firebase 데이터 로드 실패:", error);
      throw error;
    }
  }

  static async saveGameData(
    userId: string, 
    gameData: Omit<GameData, 'lastUpdated' | 'version'>
  ): Promise<void> {
    try {
      console.log('💾 Firebase에 저장 시도:', { 
        tiles: gameData.tiles.filter(t => t.type === 'crop').length + '개 작물', 
        inventory: Object.keys(gameData.inventory).length + '개 아이템', 
        gold: gameData.gold + 'G' 
      });
      
      const userDocRef = doc(db, 'farmGame', userId);
      const dataToSave: GameData = {
        ...gameData,
        lastUpdated: Date.now(),
        version: 1
      };
      
      await setDoc(userDocRef, dataToSave);
      console.log('✅ Firebase 저장 성공');
    } catch (error) {
      console.error("❌ Firebase 저장 실패:", error);
      throw error;
    }
  }

  static createInitialGameData(): Omit<GameData, 'lastUpdated' | 'version'> {
    return {
      tiles: Array.from({ length: GRID_SIZE }, (_, i) => ({
        id: i,
        row: Math.floor(i / GRID_COLUMNS),
        col: i % GRID_COLUMNS,
        type: 'empty' as const,
        cropName: undefined,
        isReady: false,
        remainingTime: 0,
        growTime: 0,
      })),
      inventory: {},
      gold: 100
    };
  }
}
