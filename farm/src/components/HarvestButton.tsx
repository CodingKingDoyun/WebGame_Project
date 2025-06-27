// components/HarvestButton.tsx
interface Props {
  onHarvest: () => void;
}

export default function HarvestButton({ onHarvest }: Props) {
  return (
    <button onClick={onHarvest}>💪 수확하기</button>
  );
}
