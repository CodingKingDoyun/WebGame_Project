// 📁 src/hooks/useCropGrowth.ts
import { useEffect } from 'react';
import { TileState } from '../types/farm';

interface UseCropGrowthProps {
  user: any;
  isLoading: boolean;
  tiles: TileState[];
  setTiles: React.Dispatch<React.SetStateAction<TileState[]>>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export const useCropGrowth = ({ 
  user, 
  isLoading, 
  tiles, 
  setTiles, 
  setInventory 
}: UseCropGrowthProps) => {
  useEffect(() => {
    if (!user || isLoading) return;
    
    const interval = setInterval(() => {
      setTiles(prev => {
        const updatedTiles = prev.map(tile => {
          if (tile.type === 'crop' && tile.remainingTime && tile.remainingTime > 0) {
            const newRemainingTime = tile.remainingTime - 1;
            const isReady = newRemainingTime <= 0;
            
            // 자동 수확 및 재배
            if (isReady) {
              // 인벤토리에 추가
              setInventory(prevInv => ({
                ...prevInv,
                [tile.cropName!]: (prevInv[tile.cropName!] || 0) + 1
              }));
              
              // 다시 심기
              return {
                ...tile,
                isReady: false,
                remainingTime: tile.growTime || 10
              };
            }
            
            return {
              ...tile,
              remainingTime: newRemainingTime,
              isReady
            };
          }
          return tile;
        });
        
        return updatedTiles;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user, isLoading, setTiles, setInventory]);
};
