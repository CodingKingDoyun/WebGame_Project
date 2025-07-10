// 📁 src/utils/offlineProgress.ts
import { TileState } from '../types/farm';

export const calculateOfflineProgress = (
  tiles: TileState[], 
  lastUpdated: number
): { 
  updatedTiles: TileState[], 
  offlineHarvests: Record<string, number> 
} => {
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);
  console.log('⏰ 오프라인 시간:', elapsedSeconds, '초 (', Math.floor(elapsedSeconds / 60), '분)');

  const offlineHarvests: Record<string, number> = {};

  const updatedTiles = tiles.map((tile: TileState) => {
    if (tile.type === 'crop' && tile.remainingTime !== undefined && tile.growTime) {
      let currentRemainingTime = tile.remainingTime;
      let totalElapsedTime = elapsedSeconds;
      let completedCycles = 0;

      // 오프라인 동안 완료된 성장 사이클들을 계산
      while (totalElapsedTime >= currentRemainingTime && currentRemainingTime > 0) {
        // 한 사이클 완료
        totalElapsedTime -= currentRemainingTime;
        completedCycles++;
        
        // 수확 기록
        if (tile.cropName) {
          offlineHarvests[tile.cropName] = (offlineHarvests[tile.cropName] || 0) + 1;
        }
        
        // 다음 사이클 시작 (자동 재배)
        currentRemainingTime = tile.growTime;
      }
      
      // 마지막 사이클의 남은 시간 계산
      const finalRemainingTime = Math.max(0, currentRemainingTime - totalElapsedTime);
      
      if (completedCycles > 0 && tile.cropName) {
        console.log(`🌾 오프라인 수확: ${tile.cropName} x${completedCycles}`);
      }
      
      return {
        ...tile,
        remainingTime: finalRemainingTime,
        isReady: finalRemainingTime <= 0
      };
    }
    return tile;
  });

  return { updatedTiles, offlineHarvests };
};
