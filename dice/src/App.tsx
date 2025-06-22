import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import Dice3D from "./Dice3D";
import "./App.css";

interface HistoryEntry {
  number: number;
  delta: number;
  selected: number;
}

const App: React.FC = () => {
  const winSound = useRef(new Audio("/congrats.mp3"));
  const [money, setMoney] = useState<number>(() => {
    const stored = localStorage.getItem("money");
    return stored ? JSON.parse(stored) : 1000;
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const stored = localStorage.getItem("history");
    return stored ? JSON.parse(stored) : [];
  });

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    localStorage.setItem("money", JSON.stringify(money));
    localStorage.setItem("history", JSON.stringify(history));
  }, [money, history]);

  return (
    <div className="game-container">
      <div className="sidebar">
        <h2>이전 결과값</h2>
        <ul className="history">
          {history.map((entry, idx) => (
            <li key={idx} className="history-entry">
              <span>
                {entry.number}{" "}
                <span className="selected-note">
                  (선택한 숫자: {entry.selected})
                </span>
              </span>
              <span className={entry.delta >= 0 ? "gain" : "loss"}>
                {entry.delta >= 0 ? `+${entry.delta}` : `${entry.delta}`}만원
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="main">
        <h1>현재 돈: {money}만원</h1>
        <h3>주사위를 굴려 부자가 된다면 얼마나 좋을까</h3>

        <Dice3D
          onRoll={(newRoll) => {
            if (selectedNumber === null || rolling || money < 100) return; // ✅ 보호 조건 중복 방지
            setRolling(true); // ✅ 결과 계산 중엔 다시 못 굴리게
            setMoney((prev) => prev - 100); // 비용 차감
            let delta = -100;

            if (newRoll === selectedNumber) {
              delta = 500;
              setMoney((prev) => prev + 500);
              confetti({
                particleCount: 150,
                spread: 90,
                origin: { x: 0.6, y: 0.65 },
              });
              winSound.current.currentTime = 0;
              winSound.current.play();
            }

            setHistory((prev) => {
              const updated = [
                { number: newRoll, delta, selected: selectedNumber! },
                ...prev,
              ];
              return updated.slice(0, 10);
            });

            setRolling(false); // ✅ transitionend 로부터 호출된 후 즉시 rolling 해제
          }}
          disabled={selectedNumber === null || rolling || money < 100}
        />
        <div className="number-picker">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedNumber(num)}
              className={selectedNumber === num ? "selected" : ""}
            >
              {num}
            </button>
          ))}
        </div>

        <p className="reward-info">숫자를 고르고 그 숫자가 나오면 +500만원</p>

        <button
          className="reset-button"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
        >
          🔄 게임 초기화
        </button>
      </div>
    </div>
  );
};

export default App;
