// 📁 src/components/SeedSelectionModal.tsx
import React from 'react';

interface CropOption {
  name: string;
  seedCount: number;
  price: number;
  icon: string; // 이모지 또는 이미지 경로
}

interface SeedSelectionModalProps {
  crops: CropOption[];
  onSelect: (cropName: string) => void;
  onClose: () => void;
}

const SeedSelectionModal: React.FC<SeedSelectionModalProps> = ({ crops, onSelect, onClose }) => {
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
      <h3>씨앗 선택</h3>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {crops.map((crop) => (
          <div
            key={crop.name}
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', cursor: 'pointer' }}
            onClick={() => onSelect(crop.name)}
          >
            <span>{crop.icon} {crop.name}</span>
            <span>{crop.seedCount}개 | {crop.price}₩</span>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ marginTop: '10px' }}>닫기</button>
    </div>
  );
};

export default SeedSelectionModal;