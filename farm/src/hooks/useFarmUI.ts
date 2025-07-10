// 📁 src/hooks/useFarmUI.ts
import { useState } from 'react';

export const useFarmUI = () => {
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);

  const openSeedModal = (tileId: number) => {
    setSelectedTileId(tileId);
    setShowSeedModal(true);
  };

  const closeSeedModal = () => {
    setShowSeedModal(false);
    setSelectedTileId(null);
  };

  const openMarketModal = () => {
    setShowMarketModal(true);
  };

  const closeMarketModal = () => {
    setShowMarketModal(false);
  };

  const closeSelectedTile = () => {
    setSelectedTileId(null);
  };

  return {
    selectedTileId,
    showSeedModal,
    showMarketModal,
    setSelectedTileId,
    openSeedModal,
    closeSeedModal,
    openMarketModal,
    closeMarketModal,
    closeSelectedTile,
  };
};
