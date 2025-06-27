// components/SellButton.tsx
interface Props {
  onSell: () => void;
}

export default function SellButton({ onSell }: Props) {
  return (
    <button onClick={onSell}>💰 감자 판매하기</button>
  );
}
