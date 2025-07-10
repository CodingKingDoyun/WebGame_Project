// 📁 src/components/DebugPanel.tsx
import React, { useState } from 'react';
import './DebugPanel.css';

interface DebugInfo {
  lastSaveAttempt: string;
  lastSaveSuccess: string;
  saveError: string;
  totalSaveAttempts: number;
  successfulSaves: number;
  currentData: string;
  offlineHarvests?: string;
  autoHarvests?: string;
  manualHarvests?: string;
  lastHarvestTime?: string;
}

interface DebugPanelProps {
  debugInfo: DebugInfo;
  onManualSave?: () => void;
  onTestSave?: () => void;
  isVisible?: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  debugInfo, 
  onManualSave,
  isVisible = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  const successRate = debugInfo.totalSaveAttempts > 0 
    ? ((debugInfo.successfulSaves / debugInfo.totalSaveAttempts) * 100).toFixed(1)
    : '0';

  return (
    <div className="debug-panel">
      <div className="debug-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="debug-title">🐛 디버그 정보</span>
        <span className="debug-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="debug-content">
          <div className="debug-section">
            <h4>저장 상태</h4>
            <div className="debug-stat">
              <span className="debug-label">총 저장 시도:</span>
              <span className="debug-value">{debugInfo.totalSaveAttempts}</span>
            </div>
            <div className="debug-stat">
              <span className="debug-label">성공한 저장:</span>
              <span className="debug-value">{debugInfo.successfulSaves}</span>
            </div>
            <div className="debug-stat">
              <span className="debug-label">성공률:</span>
              <span className={`debug-value ${parseFloat(successRate) < 100 ? 'warning' : 'success'}`}>
                {successRate}%
              </span>
            </div>
          </div>

          <div className="debug-section">
            <h4>최근 활동</h4>
            <div className="debug-stat">
              <span className="debug-label">마지막 시도:</span>
              <span className="debug-value small">{debugInfo.lastSaveAttempt || '없음'}</span>
            </div>
            <div className="debug-stat">
              <span className="debug-label">마지막 성공:</span>
              <span className="debug-value small">{debugInfo.lastSaveSuccess || '없음'}</span>
            </div>
          </div>

          {debugInfo.saveError && (
            <div className="debug-section error">
              <h4>❌ 오류</h4>
              <div className="debug-error">{debugInfo.saveError}</div>
            </div>
          )}

          <div className="debug-section">
            <h4>현재 데이터</h4>
            <div className="debug-current-data">{debugInfo.currentData || '데이터 없음'}</div>
          </div>

          {/* 수확 정보 섹션 추가 */}
          {(debugInfo.offlineHarvests || debugInfo.autoHarvests || debugInfo.manualHarvests) && (
            <div className="debug-section">
              <h4>🌾 수확 정보</h4>
              {debugInfo.lastHarvestTime && (
                <div className="debug-stat">
                  <span className="debug-label">마지막 수확:</span>
                  <span className="debug-value small">{debugInfo.lastHarvestTime}</span>
                </div>
              )}
              {debugInfo.offlineHarvests && (
                <div className="debug-stat">
                  <span className="debug-label">오프라인 수확:</span>
                  <span className="debug-value small">{debugInfo.offlineHarvests}</span>
                </div>
              )}
              {debugInfo.autoHarvests && (
                <div className="debug-stat">
                  <span className="debug-label">최근 자동 수확:</span>
                  <span className="debug-value small">{debugInfo.autoHarvests}</span>
                </div>
              )}
              {debugInfo.manualHarvests && (
                <div className="debug-stat">
                  <span className="debug-label">최근 수동 수확:</span>
                  <span className="debug-value small">{debugInfo.manualHarvests}</span>
                </div>
              )}
            </div>
          )}

          {onManualSave && (
            <div className="debug-section">
              <button 
                className="debug-save-button"
                onClick={onManualSave}
              >
                🔄 수동 저장 시도
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
