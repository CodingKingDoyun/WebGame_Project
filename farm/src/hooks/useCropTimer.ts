// 📁 src/hooks/useCropTimer.ts
import { useEffect } from 'react';

type CropTile = {
  cropName: string;
  growTime: number;
  remainingTime: number;
  isReady: boolean;
  upgrades: {
    speed: number;
    yield: number;
  };
};

type TileData = { type: 'empty' } | ({ type: 'crop' } & CropTile);

type UseCropTimerProps = {
  tiles: TileData[][];
  setTiles: React.Dispatch<React.SetStateAction<TileData[][]>>;
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

export const useCropTimer = ({ tiles, setTiles, inventory, setInventory }: UseCropTimerProps) => {
  useEffect(() => {
    const interval = setInterval(() => {
      setTiles((prevTiles) =>
        prevTiles.map((row) =>
          row.map((tile) => {
            if (tile.type === 'crop') {
              const speedMultiplier = 1 + (tile.upgrades.speed * 0.2);
              const newTime = tile.remainingTime - speedMultiplier;
              
              // 수확 완료 시 자동 수확
              if (newTime <= 0 && !tile.isReady) {
                // 인벤토리에 작물 추가
                setInventory(prev => ({
                  ...prev,
                  [tile.cropName]: (prev[tile.cropName] || 0) + (1 + tile.upgrades.yield)
                }));
                
                // 새로운 성장 사이클 시작
                return {
                  ...tile,
                  remainingTime: tile.growTime,
                  isReady: false,
                };
              }
              
              return {
                ...tile,
                remainingTime: Math.max(0, newTime),
                isReady: newTime <= 0,
              };
            }
            return tile;
          })
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [setTiles, setInventory]);
};
