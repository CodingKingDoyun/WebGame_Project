// 📁 src/components/FarmTile.tsx
import React from 'react';
import './FarmTile.css';

type FarmTileProps = {
  row: number;
  col: number;
  type: 'empty' | 'crop';
  cropName?: string;
  onClick: () => void;
};

const cropEmojis: Record<string, string> = {
  감자: '🥔',
  사과: '🍎',
  포도: '🍇',
};

const FarmTile: React.FC<FarmTileProps> = ({ row, col, type, cropName, onClick }) => {
  const isMarketTile = row === 5 && col === 5;

  let content = '';
  if (isMarketTile) {
    content = '🏪';
  } else if (type === 'crop' && cropName) {
    content = cropEmojis[cropName] || '🌱';
  }

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
        backgroundColor: isMarketTile ? '#f9e79f' : '#fff',
        cursor: 'pointer',
      }}
    >
      {content}
    </div>
  );
};

export default FarmTile;