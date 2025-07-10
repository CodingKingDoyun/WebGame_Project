// 📁 src/hooks/useGameState.ts
import { useState, useCallback } from 'react';
import { TileState } from '../types/farm';
import { CROP_LIST, GRID_SIZE, GRID_COLUMNS } from '../constants/crops';

export const useGameState = () => {
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

  const harvestCrop = useCallback((tileId: number) => {
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.type !== 'crop' || !tile.isReady || !tile.cropName) return null;

    console.log('🌾 작물 수확:', tile.cropName);

    const newInventory = {
      ...inventory,
      [tile.cropName]: (inventory[tile.cropName] || 0) + 1
    };

    const newTiles = tiles.map(t =>
      t.id === tileId
        ? {
            ...t,
            type: 'empty' as const,
            cropName: undefined,
            isReady: false,
            remainingTime: 0,
            growTime: 0,
          }
        : t
    );

    setInventory(newInventory);
    setTiles(newTiles);

    return { newTiles, newInventory, newGold: gold };
  }, [tiles, inventory, gold]);

  const plantSeed = useCallback((tileId: number, cropName: string) => {
    const cropInfo = CROP_LIST.find(c => c.name === cropName);
    if (!cropInfo) return null;

    console.log('🌱 씨앗 심기:', cropName, '타일:', tileId);

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
    return { newTiles, newInventory: inventory, newGold: gold };
  }, [tiles, inventory, gold]);

  const sellCrop = useCallback((cropName: string, quantity: number) => {
    const cropInfo = CROP_LIST.find(c => c.name === cropName);
    if (!cropInfo) return null;
    
    console.log('💰 작물 판매:', cropName, 'x', quantity);
    
    const totalPrice = cropInfo.price * quantity;
    const newGold = gold + totalPrice;
    
    const newInventory = { ...inventory };
    newInventory[cropName] = Math.max(0, (newInventory[cropName] || 0) - quantity);
    if (newInventory[cropName] === 0) {
      delete newInventory[cropName];
    }

    setGold(newGold);
    setInventory(newInventory);

    return { newTiles: tiles, newInventory, newGold };
  }, [tiles, inventory, gold]);

  const removeTile = useCallback((tileId: number) => {
    console.log('🗑️ 타일 제거:', tileId);
    
    const newTiles = tiles.map(t => 
      t.id === tileId 
        ? { ...t, type: 'empty' as const, cropName: undefined, isReady: false, remainingTime: 0, growTime: 0 }
        : t
    );

    setTiles(newTiles);
    return { newTiles, newInventory: inventory, newGold: gold };
  }, [tiles, inventory, gold]);

  const updateGameState = useCallback((
    newTiles: TileState[], 
    newInventory: Record<string, number>, 
    newGold: number
  ) => {
    setTiles(newTiles);
    setInventory(newInventory);
    setGold(newGold);
  }, []);

  return {
    tiles,
    inventory,
    gold,
    setTiles,
    setInventory,
    setGold,
    harvestCrop,
    plantSeed,
    sellCrop,
    removeTile,
    updateGameState
  };
};
