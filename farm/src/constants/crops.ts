// 📁 src/constants/crops.ts
import { CropInfo } from '../types/farm';

export const CROP_LIST: CropInfo[] = [
  { name: '당근', icon: '🥕', price: 5, growTime: 10 },
  { name: '옥수수', icon: '🌽', price: 8, growTime: 15 },
  { name: '토마토', icon: '🍅', price: 12, growTime: 20 },
  { name: '사과', icon: '🍎', price: 20, growTime: 30 },
];

export const GRID_SIZE = 150; // 15x10 = 150
export const GRID_COLUMNS = 15;
export const GRID_ROWS = 10;
