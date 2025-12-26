"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hand, Hand as HandRock, HandPlatter as HandPaper, Scissors as HandScissors, RotateCcw, Trophy, Home, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { getGameFromStorage, saveGameToStorage, determineWinner, type GameState, type Move, type Round } from "@/lib/game-utils";
import MoveButton from "@/components/move-button";
import GameHeader from "@/components/game-header";
import RoundResult from "@/components/round-result";
import RoundHistory from "@/components/round-history";
import FinalResults from "@/components/final-results";

interface GameClientProps {
  gameId: string;
}

export default function GameClient({ gameId }: GameClientProps) {
  const [game, setGame] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const loadGame = async () => {
    try {
      const gameData = await getGameFromStorage(gameId);
      
      if (!gameData) {
        toast({
          title: "Game not found",
          description: "This game does not exist or has expired.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }
      
      // Check if both players have made their moves in the current round
      const currentRound = gameData.rounds[gameData.currentRound];
      if (currentRound && currentRound.player1Move && currentRound.player2Move) {
        setShowResults(true);
      } else {
        setShowResults(false);
      }

      // Check if game is completed
      if (gameData.status === "completed") {
        setShowFinalResults(true);
      }
      
      setGame(gameData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      toast({
        title: "Error",
        description: "Failed to load game data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load game data
  useEffect(() => {
    const storedPlayerId = localStorage.getItem("playerId");
    const storedPlayerName = localStorage.getItem("playerName");
    
    if (!storedPlayerId || !storedPlayerName) {
      router.push("/");
      return;
    }
    
    setPlayerId(storedPlayerId);
    setPlayerName(storedPlayerName);
    
    loadGame();
    
    // Poll for game updates more frequently
    const interval = setInterval(loadGame, 1000);
    
    return () => clearInterval(interval);
  }, [gameId, router, toast]);

  // Check if user is a player in this game
  useEffect(() => {
    if (game && playerId) {
      const isPlayer1 = game.player1.id === playerId;
      const isPlayer2 = game.player2 && game.player2.id === playerId;
      
      if (!isPlayer1 && !isPlayer2) {
        toast({
          title: "Not a player",
          description: "You are not a player in this game.",
          variant: "destructive",
        });
        router.push("/");
      }
    }
  }, [game, playerId, router, toast]);

  const updateGameState = async (updatedGame: GameState) => {
    try {
      await saveGameToStorage(updatedGame);
      setGame(updatedGame);
    } catch (error) {
      console.error('Error updating game:', error);
      toast({
        title: "Error",
        description: "Failed to update game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const makeMove = async (move: Move) => {
    if (!game || !playerId) return;
    
    setSelectedMove(move);
    
    const updatedGame = { ...game };
    const isPlayer1 = game.player1.id === playerId;
    const currentRound = updatedGame.rounds[updatedGame.currentRound] || {
      player1Move: null,
      player2Move: null,
      winner: null,
      completed: false
    };
    
    // Record player's move
    if (isPlayer1) {
      updatedGame.player1.currentMove = move;
      currentRound.player1Move = move;
    } else {
      if (updatedGame.player2) {
        updatedGame.player2.currentMove = move;
        currentRound.player2Move = move;
      }
    }
    
    // If this is the first round added to the game
    if (updatedGame.rounds.length === 0) {
      updatedGame.rounds.push(currentRound);
    } else {
      updatedGame.rounds[updatedGame.currentRound] = currentRound;
    }
    
    // Check if both players have made their moves
    if (currentRound.player1Move && currentRound.player2Move) {
      const result = determineWinner(
        currentRound.player1Move,
        currentRound.player2Move
      );
      
      // Update round with result
      currentRound.completed = true;
      
      // Update scores
      if (result === "win") {
        currentRound.winner = game.player1.id;
        updatedGame.scores.player1 += 1;
      } else if (result === "lose") {
        currentRound.winner = game.player2?.id || null;
        updatedGame.scores.player2 += 1;
      } else {
        currentRound.winner = null; // Tie
        updatedGame.scores.ties += 1;
      }
      
      // Set show results to true for both players
      setShowResults(true);
    }
    
    await updateGameState(updatedGame);
  };

  const nextRound = async () => {
    if (!game) return;
    
    const updatedGame = { ...game };
    
    // Reset player moves
    updatedGame.player1.currentMove = null;
    if (updatedGame.player2) {
      updatedGame.player2.currentMove = null;
    }
    
    // Add new round
    updatedGame.currentRound += 1;
    updatedGame.rounds.push({
      player1Move: null,
      player2Move: null,
      winner: null,
      completed: false
    });
    
    setSelectedMove(null);
    setShowResults(false);
    await updateGameState(updatedGame);
  };

  const endGame = async () => {
    if (!game) return;
    
    const updatedGame = { ...game };
    updatedGame.status = "completed";
    
    // Set final results to show for both players
    setShowFinalResults(true);
    await updateGameState(updatedGame);
  };

  const startNewGame = () => {
    // Clear the old game
    localStorage.removeItem(`game_${gameId}`);
    
    // Redirect to create page
    router.push("/create");
  };

  const returnHome = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-b from-background to-secondary/20">
        <div className="text-center">
          <Hand className="h-12 w-12 animate-bounce mx-auto mb-4 text-primary" />
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
        <Card className="max-w-md w-full mx-auto">
          <CardHeader>
            <CardTitle>Game not found</CardTitle>
            <CardDescription>
              This game does not exist or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={returnHome}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isPlayer1 = game.player1.id === playerId;
  const playerRole = isPlayer1 ? "player1" : "player2";
  const opponentRole = isPlayer1 ? "player2" : "player1";

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-4xl mx-auto">
        <GameHeader
          game={game}
          playerRole={playerRole}
          opponentRole={opponentRole}
          gameId={gameId}
        />
        
        {showFinalResults ? (
          <FinalResults
            game={game}
            playerId={playerId}
            onPlayAgain={startNewGame}
            onHome={returnHome}
          />
        ) : showResults ? (
          <RoundResult
            round={game.rounds[game.currentRound]}
            game={game}
            playerId={playerId}
            onNextRound={nextRound}
            onEndGame={endGame}
          />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MoveButton
                move="Rock"
                icon={<HandRock className="h-8 w-8" />}
                selected={selectedMove === "Rock"}
                onClick={() => makeMove("Rock")}
                disabled={!game.player2}
              />
              <MoveButton
                move="Paper"
                icon={<HandPaper className="h-8 w-8" />}
                selected={selectedMove === "Paper"}
                onClick={() => makeMove("Paper")}
                disabled={!game.player2}
              />
              <MoveButton
                move="Scissors"
                icon={<HandScissors className="h-8 w-8" />}
                selected={selectedMove === "Scissors"}
                onClick={() => makeMove("Scissors")}
                disabled={!game.player2}
              />
            </div>
            
            <div className="text-center text-muted-foreground">
              {!game.player2 ? (
                <p>Waiting for another player to join...</p>
              ) : (
                <p>Make your move!</p>
              )}
            </div>
          </div>
        )}
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="fixed bottom-4 right-4"
              size="icon"
            >
              <History className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Game History</SheetTitle>
              <SheetDescription>
                View the history of moves and results
              </SheetDescription>
            </SheetHeader>
            <RoundHistory
              rounds={game.rounds}
              game={game}
              playerId={playerId}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

