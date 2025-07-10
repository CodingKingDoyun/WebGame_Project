import React, { useState } from 'react';
import FarmTile from './FarmTile';
import FarmSidebar from './FarmSidebar';
import MarketTile from './MarketTile';
import SeedSelectionModal from './SeedSelectionModal';
import MarketModal from './MarketModal';
import { DebugPanel } from './DebugPanel';
import { useFarmGame } from '../hooks/useFarmGame';
import { useFarmUI } from '../hooks/useFarmUI';
import { CROP_LIST } from '../constants/crops';

const FarmGrid: React.FC = () => {
  // 디버그 패널 표시 여부 상태
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // 게임 로직 훅
  const {
    user,
    tiles,
    inventory,
    gold,
    availableCrops,
    isLoading,
    harvestCrop,
    plantSeed,
    sellCrop,
    removeTile,
    debugInfo,
    saveGameData,
    loadingMessage, // 로딩 메시지 추가
  } = useFarmGame();

  // UI 상태 관리 훅
  const {
    selectedTileId,
    showSeedModal,
    showMarketModal,
    setSelectedTileId,
    openSeedModal,
    closeSeedModal,
    openMarketModal,
    closeMarketModal,
    closeSelectedTile,
  } = useFarmUI();

  const handleTileClick = (tileId: number) => {
    // 로딩 중에는 타일 클릭 차단
    if (isLoading) {
      console.log('⏸️ 로딩 중이므로 타일 클릭이 차단됩니다');
      return;
    }
    
    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    if (tile.type === 'crop') {
      // 작물 타일: 수확하고 자동 재배 시작 또는 타일 정보 확인
      if (tile.remainingTime && tile.remainingTime <= 2) {
        // 거의 완성된 작물은 수확 가능
        harvestCrop(tileId);
      } else {
        // 성장 중인 작물은 정보 확인
        setSelectedTileId(tileId);
      }
    } else if (tile.type === 'empty') {
      // 빈 타일: 씨앗 심고 자동 재배 시작
      openSeedModal(tileId);
    }
  };

  const handlePlantSeed = (cropName: string) => {
    // 로딩 중에는 씨앗 심기 차단
    if (isLoading) {
      console.log('⏸️ 로딩 중이므로 씨앗 심기가 차단됩니다');
      return;
    }
    
    if (selectedTileId !== null) {
      plantSeed(selectedTileId, cropName);
    }
    closeSeedModal();
  };

  const handleUpgrade = (type: string) => {
    // 업그레이드 로직 (나중에 구현)
    console.log(`Upgrade ${type} for tile ${selectedTileId}`);
  };

  // 디버그 패널 토글 함수
  const toggleDebugPanel = () => {
    setShowDebugPanel(!showDebugPanel);
  };

  // 수동 저장 함수
  const handleManualSave = async () => {
    await saveGameData();
  };

  // 로딩 중이거나 로그인하지 않은 경우
  if (isLoading) {
    return (
      <div className="farm-container">
        <div 
          className="loading-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            color: 'white'
          }}
        >
          <div 
            className="loading-spinner"
            style={{
              width: '60px',
              height: '60px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #4CAF50',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}
          />
          <div 
            className="loading-message"
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '12px',
              color: '#4CAF50'
            }}
          >
            🌱 {loadingMessage || '농장 데이터를 불러오는 중...'}
          </div>
          <div 
            className="loading-description"
            style={{
              fontSize: '14px',
              color: '#ccc',
              textAlign: 'center',
              maxWidth: '350px',
              lineHeight: '1.5'
            }}
          >
            데이터 로딩이 완료될 때까지 잠시만 기다려주세요.<br/>
            <strong style={{ color: '#ff9800' }}>로딩 중에는 게임을 플레이할 수 없습니다.</strong>
          </div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="farm-container">
        <div className="loading-message">
          🔐 농장을 이용하려면 먼저 로그인해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="farm-container">
      {/* 디버그 패널 토글 버튼 */}
      <button 
        onClick={toggleDebugPanel}
        disabled={isLoading}
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          background: isLoading ? '#999' : (showDebugPanel ? '#f44336' : '#4CAF50'),
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 1001,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          opacity: isLoading ? 0.5 : 1
        }}
      >
        {showDebugPanel ? '🐛 디버그 끄기' : '🐛 디버그 켜기'}
      </button>

      {/* 디버그 패널 */}
      <DebugPanel 
        debugInfo={debugInfo}
        onManualSave={handleManualSave}
        isVisible={showDebugPanel}
      />

      <div className="farm-main" style={{ opacity: isLoading ? 0.3 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
        <div className="farm-grid">
          {tiles.map(tile => (
            <FarmTile
              key={tile.id}
              row={tile.row}
              col={tile.col}
              type={tile.type}
              cropName={tile.cropName}
              isReady={tile.isReady}
              remainingTime={tile.remainingTime}
              growTime={tile.growTime}
              onClick={() => handleTileClick(tile.id)}
            />
          ))}
        </div>

        {/* 시장 타일 */}
        <MarketTile onClick={() => {
          if (isLoading) {
            console.log('⏸️ 로딩 중이므로 마켓 접근이 차단됩니다');
            return;
          }
          openMarketModal();
        }} />
      </div>

      {/* 우측 패널 */}
      <FarmSidebar
        gold={gold}
        inventory={inventory}
        selectedTileId={selectedTileId}
        tiles={tiles}
        onRemoveTile={(tileId) => {
          if (isLoading) {
            console.log('⏸️ 로딩 중이므로 타일 제거가 차단됩니다');
            return;
          }
          removeTile(tileId);
        }}
        onCloseSelectedTile={closeSelectedTile}
        onUpgrade={handleUpgrade}
        debugInfo={debugInfo}
        onManualSave={() => {
          if (isLoading) {
            console.log('⏸️ 로딩 중이므로 수동 저장이 차단됩니다');
            return;
          }
          saveGameData && saveGameData();
        }}
      />

      {showSeedModal && (
        <SeedSelectionModal
          crops={availableCrops}
          onSelect={handlePlantSeed}
          onClose={closeSeedModal}
        />
      )}

      {showMarketModal && (
        <MarketModal
          inventory={inventory}
          cropList={CROP_LIST}
          onSell={(cropName, quantity) => {
            if (isLoading) {
              console.log('⏸️ 로딩 중이므로 작물 판매가 차단됩니다');
              return;
            }
            sellCrop(cropName, quantity);
          }}
          onClose={closeMarketModal}
          gold={gold}
        />
      )}
    </div>
  );
};

export default FarmGrid;