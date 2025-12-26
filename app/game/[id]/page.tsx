import GameClient from "./game-client";

interface GameProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Game({ params }: GameProps) {
  const { id: gameId } = await params;
  
  return <GameClient gameId={gameId} />;
}
