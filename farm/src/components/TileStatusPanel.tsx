// 📁 src/components/TileStatusPanel.tsx
import React, { useState } from 'react';
import './TileStatusPanel.css';

interface TileStatusPanelProps {
  cropName: string;
  growTime: number;
  remainingTime: number;
  onRemove: () => void;
  onClose: () => void;
  onUpgrade: (type: 'speed' | 'yield') => void;
}

const TileStatusPanel: React.FC<TileStatusPanelProps> = ({
  cropName,
  growTime,
  remainingTime,
  onRemove,
  onClose,
  onUpgrade,
}) => {
  const [showUpgrades, setShowUpgrades] = useState(false);

  return (
    <div className="tile-status-panel">
      <h3 className="tile-status-title">{cropName} 상태</h3>
      
      <div className="tile-status-info">
        <p>성장 시간: {growTime}초</p>
        <p>남은 시간: {remainingTime}초</p>
      </div>

      <div className="tile-status-buttons">
        <button 
          onClick={onRemove}
          className="tile-status-button"
        >
          작물 제거
        </button>
        <button 
          onClick={() => setShowUpgrades(!showUpgrades)}
          className="tile-status-button secondary"
        >
          {showUpgrades ? '업그레이드 닫기' : '업그레이드 열기'}
        </button>
        <button 
          onClick={onClose}
          className="tile-status-button close"
        >
          닫기
        </button>
      </div>

      {showUpgrades && (
        <div className="tile-upgrades">
          <h4>업그레이드</h4>
          <div className="upgrade-buttons">
            <button 
              onClick={() => onUpgrade('speed')}
              className="upgrade-button"
            >
              🌱 성장 속도 증가
            </button>
            <button 
              onClick={() => onUpgrade('yield')}
              className="upgrade-button"
            >
              🌾 수확량 증가
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TileStatusPanel;
