// 📁 src/components/MarketModal.tsx
import React, { useState } from 'react';

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
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxHeight: '600px',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #8B4513',
          paddingBottom: '12px',
        }}>
          <h2 style={{ margin: 0, color: '#8B4513', fontSize: '24px' }}>🏪 농작물 시장</h2>
          <div style={{
            backgroundColor: '#FFD700',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '2px solid #DAA520',
            fontWeight: 'bold',
            color: '#8B4513',
          }}>
            💰 {gold}G
          </div>
        </div>

        {!selectedCrop ? (
          // 작물 선택 화면
          <div>
            <h3 style={{ color: '#8B4513', marginBottom: '16px' }}>판매할 작물을 선택하세요:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(inventory).map(([cropName, count]) => {
                const cropInfo = cropList.find(c => c.name === cropName);
                if (!cropInfo || count === 0) return null;
                
                return (
                  <div
                    key={cropName}
                    onClick={() => handleCropSelect(cropName)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#f9f9f9',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e8f5e8';
                      e.currentTarget.style.borderColor = '#8B4513';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                      e.currentTarget.style.borderColor = '#ddd';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{cropInfo.icon}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>{cropName}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          개당 {cropInfo.price}G
                        </div>
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#e8f5e8',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      color: '#2d5a2d',
                    }}>
                      {count}개 보유
                    </div>
                  </div>
                );
              })}
            </div>
            
            {Object.values(inventory).every(count => count === 0) && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                fontSize: '16px',
              }}>
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
              style={{
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              ← 뒤로가기
            </button>
            
            <div style={{
              textAlign: 'center',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '2px solid #ddd',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {selectedCropInfo?.icon}
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#8B4513' }}>
                {selectedCrop}
              </h3>
              <div style={{ color: '#666' }}>
                개당 {selectedCropInfo?.price}G | 보유: {maxQuantity}개
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#8B4513',
              }}>
                판매 수량:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                  style={{
                    backgroundColor: '#f0f0f0',
                    border: '2px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{
                    width: '80px',
                    padding: '8px',
                    textAlign: 'center',
                    border: '2px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '16px',
                  }}
                />
                <button
                  onClick={() => setSellQuantity(Math.min(maxQuantity, sellQuantity + 1))}
                  style={{
                    backgroundColor: '#f0f0f0',
                    border: '2px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  +
                </button>
                <button
                  onClick={() => setSellQuantity(maxQuantity)}
                  style={{
                    backgroundColor: '#e8f5e8',
                    border: '2px solid #8B4513',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#8B4513',
                  }}
                >
                  전체
                </button>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              border: '2px solid #ffeaa7',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8B4513' }}>
                총 판매 금액: {totalPrice}G
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSell}
                disabled={sellQuantity > maxQuantity || sellQuantity <= 0}
                style={{
                  flex: 1,
                  backgroundColor: sellQuantity > maxQuantity || sellQuantity <= 0 ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: sellQuantity > maxQuantity || sellQuantity <= 0 ? 'not-allowed' : 'pointer',
                }}
              >
                💰 판매하기
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            marginTop: '16px',
            cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default MarketModal;
