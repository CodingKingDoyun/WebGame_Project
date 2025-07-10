// 📁 src/types/farm.ts
export interface CropInfo {
  name: string;
  icon: string;
  price: number;
  growTime: number;
}

export interface TileState {
  id: number;
  row: number;
  col: number;
  type: 'empty' | 'crop';
  cropName?: string;
  isReady?: boolean;
  remainingTime?: number;
  growTime?: number;
}

export interface AvailableCrop {
  name: string;
  seedCount: number;
  price: number;
  icon: string;
}
