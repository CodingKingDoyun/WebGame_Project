// 📁 src/components/FarmSidebar.tsx
import React from 'react';
import TileStatusPanel from './TileStatusPanel';
import { TileState } from '../types/farm';
import { CROP_LIST } from '../constants/crops';

interface FarmSidebarProps {
  gold: number;
  inventory: Record<string, number>;
  selectedTileId: number | null;
  tiles: TileState[];
  onRemoveTile: (tileId: number) => void;
  onCloseSelectedTile: () => void;
  onUpgrade: (type: string) => void;
  debugInfo?: any; // 디버그 정보 추가
  onManualSave?: () => void; // 수동 저장 버튼용
}

const FarmSidebar: React.FC<FarmSidebarProps> = ({
  gold,
  inventory,
  selectedTileId,
  tiles,
  onRemoveTile,
  onCloseSelectedTile,
  onUpgrade,
  debugInfo,
  onManualSave,
}) => {
  return (
    <div style={{ width: '300px' }}>
      {/* 골드 표시 */}
      <div style={{ 
        backgroundColor: '#333', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#ffd700' }}>
          💰 {gold}G
        </h3>
      </div>

      {/* 인벤토리 */}
      <div style={{ 
        backgroundColor: '#333', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>인벤토리</h3>
        {Object.keys(inventory).length === 0 ? (
          <p style={{ color: '#888' }}>인벤토리가 비어있습니다</p>
        ) : (
          Object.entries(inventory).map(([cropName, quantity]) => {
            const cropInfo = CROP_LIST.find(c => c.name === cropName);
            return (
              <div key={cropName} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px',
                backgroundColor: '#444',
                borderRadius: '4px',
                marginBottom: '5px'
              }}>
                <span>{cropInfo?.icon} {cropName}</span>
                <span>{quantity}개</span>
              </div>
            );
          })
        )}
      </div>

      {/* 디버그 정보 표시 */}
      {debugInfo && (
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #444'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ffd700', fontSize: '14px' }}>
            🔧 저장 상태
          </h4>
          <div style={{ fontSize: '12px', color: '#ccc' }}>
            <p style={{ margin: '4px 0' }}>
              <strong>저장 시도:</strong> {debugInfo.totalSaveAttempts}회
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>성공:</strong> {debugInfo.successfulSaves}회
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>마지막 시도:</strong> {debugInfo.lastSaveAttempt || '없음'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>마지막 성공:</strong> {debugInfo.lastSaveSuccess || '없음'}
            </p>
            {debugInfo.saveError && (
              <p style={{ margin: '4px 0', color: '#ff6b6b' }}>
                <strong>오류:</strong> {debugInfo.saveError}
              </p>
            )}
            {debugInfo.currentData && (
              <p style={{ margin: '4px 0', fontSize: '11px', wordBreak: 'break-all' }}>
                <strong>현재 데이터:</strong> {debugInfo.currentData}
              </p>
            )}
            {debugInfo.offlineHarvests && (
              <p style={{ margin: '4px 0', fontSize: '11px', color: '#90EE90' }}>
                <strong>🌾 {debugInfo.offlineHarvests}</strong>
              </p>
            )}
          </div>
          {onManualSave && (
            <button 
              onClick={onManualSave}
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: '#4ade80',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              🔄 수동 저장
            </button>
          )}
        </div>
      )}

      {/* TileStatusPanel은 선택된 타일이 있을 때만 표시 */}
      {selectedTileId !== null && tiles.find(t => t.id === selectedTileId)?.type === 'crop' && (
        <TileStatusPanel
          cropName={tiles.find(t => t.id === selectedTileId)?.cropName || ''}
          growTime={tiles.find(t => t.id === selectedTileId)?.growTime || 0}
          remainingTime={tiles.find(t => t.id === selectedTileId)?.remainingTime || 0}
          onRemove={() => {
            if (selectedTileId !== null) {
              onRemoveTile(selectedTileId);
              onCloseSelectedTile();
            }
          }}
          onClose={onCloseSelectedTile}
          onUpgrade={(type) => {
            // 업그레이드 로직 (나중에 구현)
            onUpgrade(type);
            console.log(`Upgrade ${type} for tile ${selectedTileId}`);
          }}
        />
      )}
    </div>
  );
};

export default FarmSidebar;
