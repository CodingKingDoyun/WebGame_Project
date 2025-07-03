// 📁 src/components/FarmGrid.tsx
import React, { useState } from 'react';
import FarmTile from './FarmTile';
import SeedSelectionModal from './SeedSelectionModal';
import TileStatusPanel from './TileStatusPanel';
import { useCropTimer } from '../hooks/useCropTimer';

const GRID_SIZE = 11;

export type TileData =
  | { type: 'empty' }
  | {
      type: 'crop';
      cropName: string;
      growTime: number;
      remainingTime: number;
      upgrades: {
        speed: number;
        yield: number;
      };
    };

const cropList = [
  { name: '감자', seedCount: 5, price: 10, icon: '🥔', growTime: 10 },
  { name: '사과', seedCount: 2, price: 20, icon: '🍎', growTime: 20 },
  { name: '포도', seedCount: 3, price: 15, icon: '🍇', growTime: 15 },
];

const FarmGrid: React.FC = () => {
  const [tiles, setTiles] = useState<TileData[][]>(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill({ type: 'empty' }))
  );

  useCropTimer({ tiles, setTiles });

  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);

  const handleTileClick = (row: number, col: number) => {
    const tile = tiles[row][col];

    if (row === 5 && col === 5) {
      alert('시장 타일입니다!');
      return;
    }

    setSelectedTile({ row, col });
    if (tile.type === 'empty') {
      setShowSeedModal(true);
    } else {
      setShowStatusPanel(true);
    }
  };

  const handleSelectCrop = (cropName: string) => {
    if (!selectedTile) return;
    const crop = cropList.find((c) => c.name === cropName);
    if (!crop) return;

    const newTiles = tiles.map((row) => [...row]);
    newTiles[selectedTile.row][selectedTile.col] = {
      type: 'crop',
      cropName: crop.name,
      growTime: crop.growTime,
      remainingTime: crop.growTime,
      upgrades: { speed: 0, yield: 0 },
    };
    setTiles(newTiles);
    setShowSeedModal(false);
    setSelectedTile(null);
  };

  const handleRemoveCrop = () => {
    if (!selectedTile) return;
    const newTiles = tiles.map((row) => [...row]);
    newTiles[selectedTile.row][selectedTile.col] = { type: 'empty' };
    setTiles(newTiles);
    setShowStatusPanel(false);
    setSelectedTile(null);
  };

  const handleUpgrade = (type: 'speed' | 'yield') => {
    if (!selectedTile) return;
    const newTiles = tiles.map((row) => [...row]);
    const tile = newTiles[selectedTile.row][selectedTile.col];
    if (tile.type === 'crop') {
      tile.upgrades[type]++;
    }
    setTiles(newTiles);
  };

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 40px)`,
          gap: '2px',
        }}
      >
        {tiles.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <FarmTile
              key={`${rowIndex}-${colIndex}`}
              row={rowIndex}
              col={colIndex}
              type={tile.type === 'crop' ? 'crop' : 'empty'}
              cropName={tile.type === 'crop' ? tile.cropName : undefined}
              onClick={() => handleTileClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
      {showSeedModal && selectedTile && (
        <SeedSelectionModal
          crops={cropList}
          onSelect={handleSelectCrop}
          onClose={() => setShowSeedModal(false)}
        />
      )}
      {showStatusPanel && selectedTile && (
        <TileStatusPanel
          cropName={(tiles[selectedTile.row][selectedTile.col] as any).cropName}
          growTime={(tiles[selectedTile.row][selectedTile.col] as any).growTime}
          remainingTime={(tiles[selectedTile.row][selectedTile.col] as any).remainingTime}
          onRemove={handleRemoveCrop}
          onUpgrade={handleUpgrade}
          onClose={() => setShowStatusPanel(false)}
        />
      )}
    </>
  );
};

export default FarmGrid;
