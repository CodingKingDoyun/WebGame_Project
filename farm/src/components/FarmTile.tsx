// 📁 src/components/FarmTile.tsx
import React from 'react';
import './FarmTile.css';

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

const cropEmojis: Record<string, string> = {
  감자: '🥔',
  사과: '🍎',
  포도: '🍇',
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
  let backgroundColor = '#fff';
  
  if (isMarketTile) {
    content = '🏪';
    backgroundColor = '#f9e79f';
  } else if (type === 'crop' && cropName) {
    content = cropEmojis[cropName] || '🌱';
    // 수확 가능할 때 배경색 변경
    backgroundColor = isReady ? '#90EE90' : '#deb887';
  }

  // 성장 진행도 계산
  const progress = type === 'crop' ? ((growTime - remainingTime) / growTime) * 100 : 0;

  return (
    <div
      onClick={onClick}
      style={{
        width: '40px',
        height: '40px',
        border: '1px solid gray',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
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