// 📁 src/context/FarmContext.tsx
import { createContext, useContext } from "react";

export interface FarmState {
  user: any;
  gold: number;
  tiles: any[];
  inventory: Record<string, number>;
  connectionStatus: string;
  lastSavedTime: number;
}

export const FarmContext = createContext<FarmState | null>(null);

export const useFarmContext = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error("useFarmContext must be used within a FarmProvider");
  }
  return context;
};
