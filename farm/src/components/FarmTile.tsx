// 📁 src/components/FarmTile.tsx
import React from 'react';
import './FarmTile.css';
import { CROP_LIST } from '../constants/crops';

type FarmTileProps = {
  row: number;
  col: number;
  type: 'empty' | 'crop';
  cropName?: string;
  isReady?: boolean;
  remainingTime?: number;
  growTime?: number;
  onClick: () => void;
};

const FarmTile: React.FC<FarmTileProps> = ({ 
  row, 
  col, 
  type, 
  cropName, 
  isReady = false, 
  remainingTime = 0, 
  growTime = 1, 
  onClick 
}) => {
  const isMarketTile = row === 5 && col === 5;

  let content = '';
  let backgroundColor = '#F5DEB3';
  
  // 성장 진행도 계산 (먼저 계산)
  const progress = type === 'crop' ? ((growTime - remainingTime) / growTime) * 100 : 0;
  
  // 작물별 고유 배경색 결정 함수
  const getCropBackgroundColor = (cropName?: string): string => {
    switch (cropName) {
      case '당근':
        return '#ffae80ff'; // 부드러운 연한 오렌지 (당근색)
      case '옥수수':
        return '#fff395ff'; // 부드러운 연한 노란색 (옥수수색)
      case '토마토':
        return '#ff988dff'; // 부드러운 연한 빨간색 (토마토색)
      case '사과':
        return '#b0ff9eff'; // 부드러운 연한 초록색 (사과색)
      default:
        return '#F5DEB3'; // 기본 밀색
    }
  };
  
  // 성장 단계별 이모지 결정 함수
  const getGrowthStageEmoji = (progress: number, cropName?: string): string => {
    if (progress >= 85) {
      // 85-100%: 최종 작물 이모지
      const cropInfo = CROP_LIST.find(c => c.name === cropName);
      return cropInfo?.icon || '🌱';
    } else if (progress >= 40) {
      // 40-84%: 화분에 심어진 식물
      return '🌿';
    } else {
      // 0-39%: 새싹
      return '🌱';
    }
  };
  
  if (type === 'crop' && cropName) {
    content = getGrowthStageEmoji(progress, cropName);
    // 작물별 고유 배경색 적용 (성장 시간과 무관하게 일정)
    backgroundColor = getCropBackgroundColor(cropName);
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: '40px',
        height: '40px',
        border: '0.5px solid gray',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* 성장 진행바 */}
      {type === 'crop' && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: `${progress}%`,
            height: '4px',
            backgroundColor: isReady ? '#32CD32' : '#228B22',
            transition: 'width 0.5s ease',
          }}
        />
      )}
      {/* 수확 완료 표시 */}
      {isReady && (
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            fontSize: '8px',
          }}
        >
          ✨
        </div>
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{content}</span>
    </div>
  );
};

export default FarmTile;