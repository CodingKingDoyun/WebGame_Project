import React, { useRef, useState } from "react";
import "./Dice3D.css";

interface Dice3DProps {
  onRoll: (number: number) => void;
  disabled?: boolean;
}

const Dice3D: React.FC<Dice3DProps> = ({ onRoll, disabled }) => {
  const rollSound = useRef(new Audio("/roll.mp3"));
  const [isAnimating, setIsAnimating] = useState(false);
  const [rotationStyle, setRotationStyle] = useState(
    "rotateX(0deg) rotateY(0deg)"
  );

  const getRotationForFace = (face: number) => {
    switch (face) {
      case 1:
        return { x: 0, y: 0 };
      case 2:
        return { x: 0, y: -90 };
      case 3:
        return { x: 0, y: -180 };
      case 4:
        return { x: 0, y: 90 };
      case 5:
        return { x: -90, y: 0 };
      case 6:
        return { x: 90, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const rollDice = () => {
    if (disabled || isAnimating) return;

    if (navigator.vibrate) {
      navigator.vibrate(80); // 80ms 동안 진동
    }

    rollSound.current.currentTime = 0;
    rollSound.current.play();
    setIsAnimating(true);
    const result = Math.floor(Math.random() * 6) + 1;
    const base = getRotationForFace(result);

    // 추가 회전으로 자연스럽게
    const extraX = Math.floor(Math.random() * 4) * 360;
    const extraY = Math.floor(Math.random() * 4) * 360;

    const finalRotation = `rotateX(${base.x + extraX}deg) rotateY(${
      base.y + extraY
    }deg)`;
    setRotationStyle(finalRotation);

    setTimeout(() => {
      onRoll(result);
      setIsAnimating(false);
    }, 600);
  };

  return (
    <div className="dice-container">
      <div className="scene">
        <div
          className="dice"
          style={{
            transform: rotationStyle,
            transition: "transform 0.6s ease-in-out",
          }}
          onClick={rollDice}
        >
          {[1, 2, 3, 4, 5, 6].map((face) => (
            <div key={face} className={`face face-${face}`}>
              {face}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dice3D;
