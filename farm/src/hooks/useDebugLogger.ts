// 📁 src/hooks/useDebugLogger.ts
import { useState } from "react";

export const useDebugLogger = () => {
  const [showDebug, setShowDebug] = useState(false);
  const toggleDebug = () => setShowDebug(prev => !prev);
  return { showDebug, toggleDebug };
};
