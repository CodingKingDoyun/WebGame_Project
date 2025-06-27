// components/PotatoStatus.tsx
interface Props {
  potato: number;
  gold: number;
}

export default function PotatoStatus({ potato, gold }: Props) {
  return (
    <div>
      <p>🥔 감자: {potato}</p>
      <p>💰 골드: {gold}</p>
    </div>
  );
}
