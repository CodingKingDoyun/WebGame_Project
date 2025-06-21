import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";

interface HistoryEntry {
  number: number;
  delta: number;
}

const App: React.FC = () => {
  const [money, setMoney] = useState<number>(() => {
    const stored = localStorage.getItem("money");
    return stored ? JSON.parse(stored) : 1000;
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const stored = localStorage.getItem("history");
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [showNumber, setShowNumber] = useState(false);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    const storedMoney = localStorage.getItem("money");
    const storedHistory = localStorage.getItem("history");

    if (storedMoney) setMoney(JSON.parse(storedMoney));
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem("money", JSON.stringify(money));
    localStorage.setItem("history", JSON.stringify(history));
  }, [money, history]);

  const rollDice = () => {
    if (rolling || money < 100) return;
    if (selectedNumber === null) {
      alert("숫자를 먼저 선택하세요!");
      return;
    }

    setRolling(true);
    setMoney((prev) => prev - 100);
    setShowNumber(false);
    setRotation((prev) => prev + 360);

    const newRoll = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setDiceResult(newRoll);
      setShowNumber(true);
      setRolling(false);

      let delta = -100;
      if (newRoll === selectedNumber) {
        delta = 500;
        setMoney((prev) => prev + 500);
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { x: 0.59, y: 0.6 },
        });
        const audio = new Audio("/congrats.mp3");
        audio.play().catch((e) => console.error("Audio play failed", e));
      }

      setHistory((prev) => {
        const updated = [{ number: newRoll, delta }, ...prev];
        return updated.slice(0, 10);
      });
    }, 1000);
  };

  return (
    <div className="game-container">
      {" "}
      <div className="sidebar">
        {" "}
        <h2>이전 결과값</h2>{" "}
        <ul className="history">
          {" "}
          {history.map((entry, idx) => (
            <li key={idx} className="history-entry">
              {" "}
              <span>{entry.number}</span>{" "}
              <span className={entry.delta >= 0 ? "gain" : "loss"}>
                {" "}
                {entry.delta >= 0
                  ? `+${entry.delta}`
                  : `${entry.delta}`}만원{" "}
              </span>{" "}
            </li>
          ))}{" "}
        </ul>{" "}
      </div>
      <div className="main">
        <h1>현재 돈: {money}만원</h1>
        <h3>주사위를 굴려 부자가 된다면 얼마나 좋을까</h3>
        <div className="dice-wrapper" onClick={rollDice}>
          <div
            className="dice-inner"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 1s ease-in-out",
            }}
          >
            <img src="/dice.png" alt="주사위" className="dice-img" />
            {showNumber && diceResult !== null && (
              <div className="dice-number">{diceResult}</div>
            )}
          </div>
        </div>

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
      <style>{`
    .game-container {
      display: flex;
      min-height: 100vh;
      font-family: sans-serif;
      background: #121212;
      color: #eeeeee;
    }

    .sidebar {
      width: 200px;
      padding: 20px;
      border-right: 2px solid #444;
      background: #1a1a1a;
    }

    .sidebar h2 {
      font-size: 18px;
      margin-bottom: 10px;
    }

    .history {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .history-entry {
      background: #1a1a1a;
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 16px;
      border-bottom: 1px dashed #444;
    }

    .gain {
      color: green;
    }

    .loss {
      color: red;
    }

    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: 40px;
    }

    .dice-wrapper {
      width: 150px;
      height: 150px;
      perspective: 600px;
      cursor: pointer;
    }

    .dice-inner {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
    }

    .dice-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      user-select: none;
    }

    .dice-number {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 100px;
      font-weight: bold;
      color:rgb(207, 255, 196);
      text-shadow: 2px 2px 4px #00000066;
      pointer-events: none;
      animation: pop-in 0.4s ease;
    }

    @keyframes pop-in {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
      }
      60% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
      }
    }

    .number-picker button {
      margin: 0 5px;
      padding: 10px 15px;
      font-size: 18px;
      border: 2px solid #ccc;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: #2c2c2c;
      border-color: #555;
      color: #eee;
    }

    .number-picker button.selected {
      background-color: #0d6efd;
      color: white;
      border-color: #0d6efd;
    }

    .reward-info {
      font-size: 16px;
      color: #aaa;
    }
  `}</style>
    </div>
  );
};

export default App;
