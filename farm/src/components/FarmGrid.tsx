import React, { useState, useEffect } from 'react';
import FarmTile from './FarmTile';
import SeedSelectionModal from './SeedSelectionModal';
import MarketModal from './MarketModal';
import TileStatusPanel from './TileStatusPanel';
import { useCropTimer } from '../hooks/useCropTimer';

interface CropInfo {
  name: string;
  icon: string;
  price: number;
  growTime: number;
}

interface TileState {
  id: number;
  row: number;
  col: number;
  type: 'empty' | 'crop';
  cropName?: string;
  isReady?: boolean;
  remainingTime?: number;
  growTime?: number;
}

const CROP_LIST: CropInfo[] = [
  { name: '당근', icon: '🥕', price: 5, growTime: 10 },
  { name: '옥수수', icon: '🌽', price: 8, growTime: 15 },
  { name: '토마토', icon: '🍅', price: 12, growTime: 20 },
  { name: '사과', icon: '🍎', price: 20, growTime: 30 },
];

const FarmGrid: React.FC = () => {
  const [tiles, setTiles] = useState<TileState[]>(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      row: Math.floor(i / 4),
      col: i % 4,
      type: 'empty' as const,
      cropName: undefined,
      isReady: false,
      remainingTime: 0,
      growTime: 0,
    }))
  );

  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [gold, setGold] = useState(100);

  // 사용 가능한 작물 목록 (SeedSelectionModal용)
  const availableCrops = CROP_LIST.map(crop => ({
    name: crop.name,
    seedCount: 999, // 무제한 씨앗 (또는 실제 씨앗 수량으로 변경 가능)
    price: crop.price,
    icon: crop.icon,
  }));

  // 타이머 시스템 (간소화된 자동 타이머)
  useEffect(() => {
    const interval = setInterval(() => {
      setTiles(prev => prev.map(tile => {
        if (tile.type === 'crop' && tile.remainingTime && tile.remainingTime > 0) {
          const newRemainingTime = tile.remainingTime - 1;
          const isReady = newRemainingTime <= 0;
          
          // 자동 수확 및 재배 (임시로 모든 작물에 적용)
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
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTileClick = (tileId: number) => {
    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    if (tile.type === 'crop' && tile.isReady) {
      // 수확
      harvestCrop(tileId);
    } else if (tile.type === 'empty') {
      // 씨앗 심기
      setSelectedTileId(tileId);
      setShowSeedModal(true);
    }
  };

  const harvestCrop = (tileId: number) => {
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.type !== 'crop' || !tile.isReady || !tile.cropName) return;

    // 인벤토리에 추가
    setInventory(prev => ({
      ...prev,
      [tile.cropName!]: (prev[tile.cropName!] || 0) + 1
    }));

    // 타일을 비우기
    setTiles(prev =>
      prev.map(t =>
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
      )
    );
  };

  const plantSeed = (cropName: string) => {
    if (selectedTileId === null) return;

    const cropInfo = CROP_LIST.find(c => c.name === cropName);
    if (!cropInfo) return;

    setTiles(prev =>
      prev.map(tile =>
        tile.id === selectedTileId
          ? {
              ...tile,
              type: 'crop' as const,
              cropName,
              isReady: false,
              remainingTime: cropInfo.growTime,
              growTime: cropInfo.growTime,
            }
          : tile
      )
    );

    setShowSeedModal(false);
    setSelectedTileId(null);
  };

  const handleMarketClick = () => {
    setShowMarketModal(true);
  };

  const sellCrop = (cropName: string, quantity: number) => {
    const cropInfo = CROP_LIST.find(c => c.name === cropName);
    if (!cropInfo) return;
    
    const totalPrice = cropInfo.price * quantity;
    
    // 골드 추가
    setGold(prev => prev + totalPrice);
    
    // 인벤토리에서 제거
    setInventory(prev => {
      const newInventory = { ...prev };
      newInventory[cropName] = Math.max(0, (newInventory[cropName] || 0) - quantity);
      if (newInventory[cropName] === 0) {
        delete newInventory[cropName];
      }
      return newInventory;
    });
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '10px',
          marginBottom: '20px'
        }}>
          {tiles.map(tile => (
            <FarmTile
              key={tile.id}
              row={tile.row}
              col={tile.col}
              type={tile.type}
              cropName={tile.cropName}
              isReady={tile.isReady}
              remainingTime={tile.remainingTime}
              growTime={tile.growTime}
              onClick={() => handleTileClick(tile.id)}
            />
          ))}
        </div>

        {/* 시장 타일 */}
        <div 
          onClick={handleMarketClick}
          style={{
            width: '100px',
            height: '100px',
            backgroundColor: '#8B4513',
            border: '2px solid #654321',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '24px',
            margin: '10px 0'
          }}
        >
          🏪
        </div>
        <div style={{ color: '#ffd700', fontSize: '14px' }}>시장 (판매)</div>
      </div>

      {/* 우측 패널 */}
      <div style={{ width: '300px' }}>
        <div style={{ 
          backgroundColor: '#333', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ffd700' }}>
            골드: {gold}원
          </h3>
        </div>

        <div style={{ 
          backgroundColor: '#333', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>인벤토리</h3>
          {Object.keys(inventory).length === 0 ? (
            <p style={{ color: '#888' }}>인벤토리가 비어있습니다</p>
          ) : (
            Object.entries(inventory).map(([cropName, quantity]) => {
              const cropInfo = CROP_LIST.find(c => c.name === cropName);
              return (
                <div key={cropName} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px',
                  backgroundColor: '#444',
                  borderRadius: '4px',
                  marginBottom: '5px'
                }}>
                  <span>{cropInfo?.icon} {cropName}</span>
                  <span>{quantity}개</span>
                </div>
              );
            })
          )}
        </div>

        {/* TileStatusPanel은 선택된 타일이 있을 때만 표시 */}
        {selectedTileId !== null && tiles.find(t => t.id === selectedTileId)?.type === 'crop' && (
          <TileStatusPanel
            cropName={tiles.find(t => t.id === selectedTileId)?.cropName || ''}
            growTime={tiles.find(t => t.id === selectedTileId)?.growTime || 0}
            remainingTime={tiles.find(t => t.id === selectedTileId)?.remainingTime || 0}
            onRemove={() => {
              if (selectedTileId !== null) {
                setTiles(prev => prev.map(t => 
                  t.id === selectedTileId 
                    ? { ...t, type: 'empty' as const, cropName: undefined, isReady: false, remainingTime: 0, growTime: 0 }
                    : t
                ));
                setSelectedTileId(null);
              }
            }}
            onClose={() => setSelectedTileId(null)}
            onUpgrade={(type) => {
              // 업그레이드 로직 (나중에 구현)
              console.log(`Upgrade ${type} for tile ${selectedTileId}`);
            }}
          />
        )}
      </div>

      {showSeedModal && (
        <SeedSelectionModal
          crops={availableCrops}
          onSelect={plantSeed}
          onClose={() => {
            setShowSeedModal(false);
            setSelectedTileId(null);
          }}
        />
      )}

      {showMarketModal && (
        <MarketModal
          inventory={inventory}
          cropList={CROP_LIST}
          onSell={sellCrop}
          onClose={() => setShowMarketModal(false)}
          gold={gold}
        />
      )}
    </div>
  );
};

export default FarmGrid;