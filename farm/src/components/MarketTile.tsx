// 📁 src/components/MarketTile.tsx
import React from 'react';
import './MarketTile.css';

interface MarketTileProps {
  onClick: () => void;
}

const MarketTile: React.FC<MarketTileProps> = ({ onClick }) => {
  return (
    <div className="market-tile-container">
      <div 
        onClick={onClick}
        className="market-tile"
      >
        📦
      </div>
      <div className="market-tile-label"></div>
    </div>
  );
};

export default MarketTile;
