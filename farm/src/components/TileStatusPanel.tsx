// 📁 src/components/TileStatusPanel.tsx
import React, { useState } from 'react';

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
    <div style={{
      position: 'absolute',
      top: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#fff',
      border: '2px solid #333',
      padding: '16px',
      width: '300px',
      zIndex: 100,
    }}>
      <h3>{cropName} 상태</h3>
      <p>성장 시간: {growTime}초</p>
      <p>남은 시간: {remainingTime}초</p>

      <button onClick={onRemove}>작물 제거</button>
      <button onClick={() => setShowUpgrades(!showUpgrades)} style={{ marginLeft: '8px' }}>
        {showUpgrades ? '업그레이드 닫기' : '업그레이드 열기'}
      </button>
      <button onClick={onClose} style={{ marginLeft: '8px' }}>닫기</button>

      {showUpgrades && (
        <div style={{ marginTop: '12px', borderTop: '1px solid #aaa', paddingTop: '8px' }}>
          <h4>업그레이드</h4>
          <button onClick={() => onUpgrade('speed')}>🌱 성장 속도 증가</button>
          <button onClick={() => onUpgrade('yield')} style={{ marginLeft: '8px' }}>🌾 수확량 증가</button>
        </div>
      )}
    </div>
  );
};

export default TileStatusPanel;
