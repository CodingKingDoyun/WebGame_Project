// 📁 src/components/SeedSelectionModal.tsx
import React from 'react';
import { AvailableCrop } from '../types/farm';
import './SeedSelectionModal.css';

interface SeedSelectionModalProps {
  crops: AvailableCrop[];
  onSelect: (cropName: string) => void;
  onClose: () => void;
}

const SeedSelectionModal: React.FC<SeedSelectionModalProps> = ({ 
  crops, 
  onSelect, 
  onClose 
}) => {
  return (
    <div className="seed-selection-modal">
      <div className="seed-modal-content">
        <div className="seed-modal-header">
          <h3 className="seed-modal-title">🌱 씨앗 선택</h3>
        </div>
        
        <div className="seed-list">
          {crops.map((crop) => (
            <div
              key={crop.name}
              className="seed-item"
              onClick={() => onSelect(crop.name)}
            >
              <div className="seed-item-info">
                <span className="seed-item-icon">{crop.icon}</span>
                <div className="seed-item-details">
                  <div className="seed-item-name">{crop.name}</div>
                  <div className="seed-item-price">{crop.price}원</div>
                </div>
              </div>
              <div className="seed-item-count">{crop.seedCount}개</div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={onClose}
          className="seed-close-button"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default SeedSelectionModal;