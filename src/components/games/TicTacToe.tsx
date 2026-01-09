import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Users, Cpu, User } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "../../lib/firebase";
import { GameSession, updateGameSession, endGameSession } from "./MultiplayerManager";


interface TicTacToeProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
  multiplayerSession?: GameSession | null;
  onExitMultiplayer?: () => void;
}

type Player = "X" | "O" | null;

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export default function TicTacToe({ onBack, onWin, userName, multiplayerSession, onExitMultiplayer }: TicTacToeProps) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameMode, setGameMode] = useState<"menu" | "ai" | "local2p" | "multiplayer">(multiplayerSession ? "multiplayer" : "menu");
  
  // Multiplayer state
  const [session, setSession] = useState<GameSession | null>(multiplayerSession || null);
  const [mySymbol, setMySymbol] = useState<"X" | "O">("X");
  const [opponentName, setOpponentName] = useState("");

  // Initialize multiplayer
  useEffect(() => {
    if (multiplayerSession) {
      setSession(multiplayerSession);
      setGameMode("multiplayer");
      const isPlayer1 = multiplayerSession.players.player1 === userName;
      setMySymbol(isPlayer1 ? "X" : "O");
      setOpponentName(isPlayer1 ? multiplayerSession.players.player2 : multiplayerSession.players.player1);
      if (multiplayerSession.gameState?.board) {
        setBoard(multiplayerSession.gameState.board);
      }
    }
  }, [multiplayerSession, userName]);

  // Listen for multiplayer game updates
  useEffect(() => {
    if (!session?.id || gameMode !== "multiplayer") return;
    
    const sessionRef = ref(db, `gameSessions/${session.id}`);
    const unsubscribe = onValue(sessionRef, (snap) => {
      const data = snap.val();
      if (data) {
        setSession(data);
        if (data.gameState?.board) {
          setBoard(data.gameState.board);
        }
        if (data.status === "finished" && data.winner) {
          if (data.winner === userName) {
            setWinner(mySymbol);
            onWin(10);
          } else if (data.winner === "draw") {
            setWinner("draw");
          } else {
            setWinner(mySymbol === "X" ? "O" : "X");
          }
        }
      }
    });
    return () => unsubscribe();
  }, [session?.id, gameMode, userName, mySymbol, onWin]);

  const checkWinner = (squares: Player[]): { winner: Player; line: number[] } | null => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: combo };
      }
    }
    return null;
  };

  const minimax = (squares: Player[], isMaximizing: boolean): number => {
    const result = checkWinner(squares);
    if (result?.winner === "O") return 10;
    if (result?.winner === "X") return -10;
    if (!squares.includes(null)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = "O";
          best = Math.max(best, minimax(squares, false));
          squares[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = "X";
          best = Math.min(best, minimax(squares, true));
          squares[i] = null;
        }
      }
      return best;
    }
  };

  const getBestMove = (squares: Player[]): number => {
    let bestScore = -Infinity;
    let bestMove = 0;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = "O";
        const score = minimax(squares, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const handleClick = async (idx: number) => {
    if (board[idx] || winner) return;

    if (gameMode === "multiplayer") {
      // Check if it's my turn
      if (session?.currentTurn !== userName) return;
      
      const newBoard = [...board];
      newBoard[idx] = mySymbol;
      
      const result = checkWinner(newBoard);
      if (result) {
        setWinningLine(result.line);
        await endGameSession(session!.id, userName);
      } else if (!newBoard.includes(null)) {
        await endGameSession(session!.id, "draw");
      } else {
        // Update game state in Firebase
        await updateGameSession(session!.id, {
          gameState: { board: newBoard },
          currentTurn: opponentName
        });
      }
    } else if (gameMode === "local2p") {
      // Local 2 player mode
      const newBoard = [...board];
      newBoard[idx] = currentPlayer;
      setBoard(newBoard);

      const result = checkWinner(newBoard);
      if (result) {
        setWinner(result.winner);
        setWinningLine(result.line);
        onWin(10);
        return;
      }

      if (!newBoard.includes(null)) {
        setWinner("draw");
        return;
      }

      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    } else if (gameMode === "ai") {
      if (currentPlayer !== "X") return;

      const newBoard = [...board];
      newBoard[idx] = "X";
      setBoard(newBoard);

      const result = checkWinner(newBoard);
      if (result) {
        setWinner(result.winner);
        setWinningLine(result.line);
        if (result.winner === "X") onWin(10);
        return;
      }

      if (!newBoard.includes(null)) {
        setWinner("draw");
        return;
      }

      setCurrentPlayer("O");

      setTimeout(() => {
        const aiMove = getBestMove([...newBoard]);
        newBoard[aiMove] = "O";
        setBoard([...newBoard]);

        const aiResult = checkWinner(newBoard);
        if (aiResult) {
          setWinner(aiResult.winner);
          setWinningLine(aiResult.line);
        } else if (!newBoard.includes(null)) {
          setWinner("draw");
        }
        setCurrentPlayer("X");
      }, 500);
    }
  };

  const resetGame = async () => {
    if (gameMode === "multiplayer" && session) {
      await updateGameSession(session.id, {
        gameState: { board: Array(9).fill(null) },
        currentTurn: session.players.player1,
        status: "playing",
        winner: undefined
      });
    }
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningLine(null);
  };

  const handleBack = () => {
    if (gameMode === "multiplayer" && onExitMultiplayer) {
      onExitMultiplayer();
    } else if (gameMode !== "menu") {
      setGameMode("menu");
      resetGame();
    } else {
      onBack();
    }
  };

  const isMyTurn = gameMode === "multiplayer" 
    ? session?.currentTurn === userName 
    : gameMode === "ai" 
      ? currentPlayer === "X"
      : true;

  // Game Mode Selection Menu
  if (gameMode === "menu") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ height: "100vh", background: "transparent", padding: "20px", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#39ff14", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <ArrowLeft size={24} /> BACK
          </button>
          <h2 style={{ color: "#39ff14", margin: 0 }}>TIC TAC TOE</h2>
          <div style={{ width: "80px" }} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGameMode("ai")}
            style={{
              background: "linear-gradient(135deg, #00ffff, #0088ff)",
              color: "#000",
              border: "none",
              padding: "25px 50px",
              borderRadius: "15px",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "15px",
              width: "280px",
              justifyContent: "center"
            }}
          >
            <Cpu size={28} /> VS COMPUTER
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGameMode("local2p")}
            style={{
              background: "linear-gradient(135deg, #39ff14, #00cc00)",
              color: "#000",
              border: "none",
              padding: "25px 50px",
              borderRadius: "15px",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "15px",
              width: "280px",
              justifyContent: "center"
            }}
          >
            <User size={28} /> 2 PLAYERS
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBack()}
            style={{
              background: "linear-gradient(135deg, #ff00ff, #ff0088)",
              color: "#fff",
              border: "none",
              padding: "25px 50px",
              borderRadius: "15px",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "15px",
              width: "280px",
              justifyContent: "center"
            }}
          >
            <Users size={28} /> ONLINE
          </motion.button>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "10px" }}>
            Use the Multiplayer menu for online play!
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: "100vh", background: "transparent", padding: "20px", display: "flex", flexDirection: "column" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button onClick={handleBack} style={{ background: "none", border: "none", color: "#39ff14", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <ArrowLeft size={24} /> BACK
        </button>
        <h2 style={{ color: "#39ff14", margin: 0 }}>TIC TAC TOE</h2>
        <button onClick={resetGame} style={{ background: "none", border: "none", color: "#39ff14", cursor: "pointer" }}>
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Mode indicator */}
      {gameMode === "multiplayer" && (
        <div style={{ 
          background: "linear-gradient(135deg, rgba(255, 0, 255, 0.2), rgba(0, 255, 255, 0.1))",
          border: "1px solid #ff00ff",
          borderRadius: "10px",
          padding: "10px 15px",
          marginBottom: "15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ color: "#fff" }}>
            Playing vs <strong style={{ color: "#ff00ff" }}>{opponentName}</strong>
          </span>
          <span style={{ color: "#888" }}>You are {mySymbol}</span>
        </div>
      )}

      {gameMode === "local2p" && (
        <div style={{ 
          background: "linear-gradient(135deg, rgba(57, 255, 20, 0.2), rgba(0, 200, 0, 0.1))",
          border: "1px solid #39ff14",
          borderRadius: "10px",
          padding: "10px 15px",
          marginBottom: "15px",
          textAlign: "center"
        }}>
          <span style={{ color: "#39ff14", fontWeight: "bold" }}>
            LOCAL 2 PLAYER MODE
          </span>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginBottom: "30px", color: "#fff", fontSize: "20px" }}>
          {winner === "X" && <span style={{ color: "#39ff14" }}>🎉 {gameMode === "local2p" ? "Player X" : "YOU"} WIN! +10 Points</span>}
          {winner === "O" && (
            <span style={{ color: gameMode === "local2p" ? "#39ff14" : "#ff0000" }}>
              {gameMode === "local2p" ? "🎉 Player O WINS!" : gameMode === "multiplayer" ? `${opponentName} Wins!` : "AI Wins! Try Again"}
            </span>
          )}
          {winner === "draw" && <span style={{ color: "#ffff00" }}>It's a Draw!</span>}
          {!winner && (
            gameMode === "multiplayer" ? (
              isMyTurn ? (
                <span style={{ color: "#39ff14" }}>
                  <span style={{ 
                    display: "inline-block",
                    width: "10px", 
                    height: "10px", 
                    borderRadius: "50%", 
                    background: "#39ff14",
                    marginRight: "10px",
                    animation: "pulse 1s infinite"
                  }} />
                  Your Turn ({mySymbol})
                </span>
              ) : (
                <span style={{ color: "#888" }}>Waiting for {opponentName}...</span>
              )
            ) : gameMode === "local2p" ? (
              <span style={{ color: currentPlayer === "X" ? "#39ff14" : "#ff00ff" }}>
                Player {currentPlayer}'s Turn
              </span>
            ) : (
              currentPlayer === "X" ? <span>Your Turn (X)</span> : <span style={{ color: "#888" }}>AI Thinking...</span>
            )
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 100px)", gap: "10px" }}>
          {board.map((cell, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: cell || winner ? 1 : 1.05 }}
              whileTap={{ scale: cell || winner ? 1 : 0.95 }}
              onClick={() => handleClick(idx)}
              style={{
                width: "100px",
                height: "100px",
                background: winningLine?.includes(idx) ? "rgba(57, 255, 20, 0.3)" : "rgba(255,255,255,0.1)",
                border: winningLine?.includes(idx) ? "3px solid #39ff14" : "2px solid #333",
                borderRadius: "15px",
                fontSize: "48px",
                fontWeight: "bold",
                color: cell === "X" ? "#39ff14" : "#ff00ff",
                cursor: cell || winner ? "default" : "pointer"
              }}
            >
              {cell}
            </motion.button>
          ))}
        </div>

        {winner && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={resetGame}
            style={{
              marginTop: "40px",
              background: "#39ff14",
              color: "#000",
              padding: "15px 40px",
              borderRadius: "50px",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer"
            }}
          >
            PLAY AGAIN
          </motion.button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </motion.div>
  );
}
