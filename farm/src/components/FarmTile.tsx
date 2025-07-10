// 📁 src/components/FarmTile.tsx
import React from 'react';
import './FarmTile.css';
import { CROP_LIST } from '../constants/crops';

type FarmTileProps = {
  row: number;
  col: number;
  type: 'empty' | 'crop';
  cropName?: string;
  isReady?: boolean;
  remainingTime?: number;
  growTime?: number;
  onClick: () => void;
};

const FarmTile: React.FC<FarmTileProps> = ({ 
  row, 
  col, 
  type, 
  cropName, 
  isReady = false, 
  remainingTime = 0, 
  growTime = 1, 
  onClick 
}) => {
  const isMarketTile = row === 5 && col === 5;

  let content = '';
  let backgroundColor = '#F5DEB3';
  
  // 성장 진행도 계산 (먼저 계산)
  const progress = type === 'crop' ? ((growTime - remainingTime) / growTime) * 100 : 0;
  
  if (type === 'crop' && cropName) {
    const cropInfo = CROP_LIST.find(c => c.name === cropName);
    content = cropInfo?.icon || '🌱';
    // 자동 재배 시스템: 진행도에 따른 배경색 변화
    if (remainingTime <= 2) {
      backgroundColor = '#90EE90'; // 곧 수확될 작물 (연한 초록)
    } else {
      backgroundColor = '#DEB887'; // 성장 중인 작물 (갈색)
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: '40px',
        height: '40px',
        border: '0.5px solid gray',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* 성장 진행바 */}
      {type === 'crop' && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: `${progress}%`,
            height: '4px',
            backgroundColor: isReady ? '#32CD32' : '#228B22',
            transition: 'width 0.5s ease',
          }}
        />
      )}
      {/* 수확 완료 표시 */}
      {isReady && (
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            fontSize: '8px',
          }}
        >
          ✨
        </div>
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{content}</span>
    </div>
  );
};

export default FarmTile;