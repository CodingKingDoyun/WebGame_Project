// 📁 src/components/MarketModal.tsx
import React, { useState } from 'react';
import './MarketModal.css';

interface CropInfo {
  name: string;
  icon: string;
  price: number;
}

interface MarketModalProps {
  inventory: Record<string, number>;
  cropList: CropInfo[];
  onSell: (cropName: string, quantity: number) => void;
  onClose: () => void;
  gold: number;
}

const MarketModal: React.FC<MarketModalProps> = ({ 
  inventory, 
  cropList, 
  onSell, 
  onClose, 
  gold 
}) => {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);

  const handleCropSelect = (cropName: string) => {
    setSelectedCrop(cropName);
    setSellQuantity(1);
  };

  const handleSell = () => {
    if (selectedCrop && sellQuantity > 0) {
      onSell(selectedCrop, sellQuantity);
      setSelectedCrop(null);
      setSellQuantity(1);
    }
  };

  const selectedCropInfo = cropList.find(c => c.name === selectedCrop);
  const maxQuantity = selectedCrop ? inventory[selectedCrop] || 0 : 0;
  const totalPrice = selectedCropInfo ? selectedCropInfo.price * sellQuantity : 0;

  return (
    <div className="market-modal-overlay">
      <div className="market-modal-content">
        <div className="market-modal-header">
          <h2 className="market-modal-title">🏪 농작물 시장</h2>
          <div className="market-gold-display">
            💰 {gold}G
          </div>
        </div>

        {!selectedCrop ? (
          // 작물 선택 화면
          <div>
            <h3 style={{ color: '#8B4513', marginBottom: '16px' }}>판매할 작물을 선택하세요:</h3>
            <div className="market-crop-list">
              {Object.entries(inventory).map(([cropName, count]) => {
                const cropInfo = cropList.find(c => c.name === cropName);
                if (!cropInfo || count === 0) return null;
                
                return (
                  <div
                    key={cropName}
                    onClick={() => handleCropSelect(cropName)}
                    className="market-crop-item"
                  >
                    <div className="market-crop-info">
                      <span className="market-crop-icon">{cropInfo.icon}</span>
                      <div className="market-crop-details">
                        <div className="market-crop-name">{cropName}</div>
                        <div className="market-crop-price">
                          개당 {cropInfo.price}G
                        </div>
                      </div>
                    </div>
                    <div className="market-crop-count">
                      {count}개 보유
                    </div>
                  </div>
                );
              })}
            </div>
            
            {Object.values(inventory).every(count => count === 0) && (
              <div className="market-empty-message">
                판매할 작물이 없습니다! 🌱<br/>
                농장에서 작물을 기른 후 다시 오세요.
              </div>
            )}
          </div>
        ) : (
          // 수량 선택 화면
          <div>
            <button
              onClick={() => setSelectedCrop(null)}
              className="market-back-button"
            >
              ← 뒤로가기
            </button>
            
            <div className="market-selected-crop">
              <div className="market-selected-icon">
                {selectedCropInfo?.icon}
              </div>
              <h3 className="market-selected-name">
                {selectedCrop}
              </h3>
              <div className="market-selected-info">
                개당 {selectedCropInfo?.price}G | 보유: {maxQuantity}개
              </div>
            </div>

            <div className="market-quantity-section">
              <label className="market-quantity-label">
                판매 수량:
              </label>
              <div className="market-quantity-controls">
                <button
                  onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                  className="market-quantity-button"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="market-quantity-input"
                />
                <button
                  onClick={() => setSellQuantity(Math.min(maxQuantity, sellQuantity + 1))}
                  className="market-quantity-button"
                >
                  +
                </button>
                <button
                  onClick={() => setSellQuantity(maxQuantity)}
                  className="market-max-button"
                >
                  전체
                </button>
              </div>
            </div>

            <div className="market-total-price">
              <div className="market-total-amount">
                총 판매 금액: {totalPrice}G
              </div>
            </div>

            <div className="market-action-buttons">
              <button
                onClick={handleSell}
                disabled={sellQuantity > maxQuantity || sellQuantity <= 0}
                className="market-sell-button"
              >
                💰 판매하기
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="market-close-button"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default MarketModal;
