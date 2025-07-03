// 📁 src/hooks/useCropTimer.ts
import { useEffect } from 'react';

type CropTile = {
  cropName: string;
  growTime: number;
  remainingTime: number;
  upgrades: {
    speed: number;
    yield: number;
  };
};

type TileData = { type: 'empty' } | ({ type: 'crop' } & CropTile);

type UseCropTimerProps = {
  tiles: TileData[][];
  setTiles: React.Dispatch<React.SetStateAction<TileData[][]>>;
};

export const useCropTimer = ({ tiles, setTiles }: UseCropTimerProps) => {
  useEffect(() => {
    const interval = setInterval(() => {
      setTiles((prevTiles) =>
        prevTiles.map((row) =>
          row.map((tile) => {
            if (tile.type === 'crop') {
              const newTime = tile.remainingTime - 1;
              return {
                ...tile,
                remainingTime: newTime <= 0 ? tile.growTime : newTime,
              };
            }
            return tile;
          })
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [setTiles]);
};
