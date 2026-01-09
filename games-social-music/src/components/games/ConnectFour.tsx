import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Users, Cpu, User } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "../../lib/firebase";
import { GameSession, updateGameSession, endGameSession } from "./MultiplayerManager";


interface ConnectFourProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
  multiplayerSession?: GameSession | null;
  onExitMultiplayer?: () => void;
}

type Cell = "R" | "Y" | null;

const ROWS = 6;
const COLS = 7;

export default function ConnectFour({ onBack, onWin, userName, multiplayerSession, onExitMultiplayer }: ConnectFourProps) {
  const [board, setBoard] = useState<Cell[][]>(() => 
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<"R" | "Y">("R");
  const [winner, setWinner] = useState<Cell | "draw" | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [gameMode, setGameMode] = useState<"menu" | "ai" | "local2p" | "multiplayer">(multiplayerSession ? "multiplayer" : "menu");
  
  // Multiplayer state
  const [session, setSession] = useState<GameSession | null>(multiplayerSession || null);
  const [myColor, setMyColor] = useState<"R" | "Y">("R");
  const [opponentName, setOpponentName] = useState("");

  // Initialize multiplayer
  useEffect(() => {
    if (multiplayerSession) {
      setSession(multiplayerSession);
      setGameMode("multiplayer");
      const isPlayer1 = multiplayerSession.players.player1 === userName;
      setMyColor(isPlayer1 ? "R" : "Y");
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
            setWinner(myColor);
            onWin(15);
          } else if (data.winner === "draw") {
            setWinner("draw");
          } else {
            setWinner(myColor === "R" ? "Y" : "R");
          }
        }
      }
    });
    return () => unsubscribe();
  }, [session?.id, gameMode, userName, myColor, onWin]);

  const checkWinner = (b: Cell[][]): { winner: Cell; cells: [number, number][] } | null => {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (b[r][c] && b[r][c] === b[r][c+1] && b[r][c] === b[r][c+2] && b[r][c] === b[r][c+3]) {
          return { winner: b[r][c], cells: [[r,c], [r,c+1], [r,c+2], [r,c+3]] };
        }
      }
    }
    // Vertical
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c < COLS; c++) {
        if (b[r][c] && b[r][c] === b[r+1][c] && b[r][c] === b[r+2][c] && b[r][c] === b[r+3][c]) {
          return { winner: b[r][c], cells: [[r,c], [r+1,c], [r+2,c], [r+3,c]] };
        }
      }
    }
    // Diagonal down-right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (b[r][c] && b[r][c] === b[r+1][c+1] && b[r][c] === b[r+2][c+2] && b[r][c] === b[r+3][c+3]) {
          return { winner: b[r][c], cells: [[r,c], [r+1,c+1], [r+2,c+2], [r+3,c+3]] };
        }
      }
    }
    // Diagonal up-right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (b[r][c] && b[r][c] === b[r-1][c+1] && b[r][c] === b[r-2][c+2] && b[r][c] === b[r-3][c+3]) {
          return { winner: b[r][c], cells: [[r,c], [r-1,c+1], [r-2,c+2], [r-3,c+3]] };
        }
      }
    }
    return null;
  };

  const getAvailableRow = (b: Cell[][], col: number): number => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!b[r][col]) return r;
    }
    return -1;
  };

  const getAIMove = (b: Cell[][]): number => {
    // Check for winning move
    for (let c = 0; c < COLS; c++) {
      const r = getAvailableRow(b, c);
      if (r >= 0) {
        b[r][c] = "Y";
        if (checkWinner(b)?.winner === "Y") {
          b[r][c] = null;
          return c;
        }
        b[r][c] = null;
      }
    }
    // Block player's winning move
    for (let c = 0; c < COLS; c++) {
      const r = getAvailableRow(b, c);
      if (r >= 0) {
        b[r][c] = "R";
        if (checkWinner(b)?.winner === "R") {
          b[r][c] = null;
          return c;
        }
        b[r][c] = null;
      }
    }
    // Prefer center
    if (getAvailableRow(b, 3) >= 0) return 3;
    // Random available column
    const available = [];
    for (let c = 0; c < COLS; c++) {
      if (getAvailableRow(b, c) >= 0) available.push(c);
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  const dropPiece = async (col: number) => {
    if (winner) return;
    const row = getAvailableRow(board, col);
    if (row < 0) return;

    if (gameMode === "multiplayer") {
      if (session?.currentTurn !== userName) return;
      
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = myColor;
      
      const result = checkWinner(newBoard);
      if (result) {
        setWinningCells(result.cells);
        await endGameSession(session!.id, userName);
      } else if (newBoard.every(row => row.every(cell => cell))) {
        await endGameSession(session!.id, "draw");
      } else {
        await updateGameSession(session!.id, {
          gameState: { board: newBoard },
          currentTurn: opponentName
        });
      }
    } else if (gameMode === "local2p") {
      // Local 2 player mode
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = currentPlayer;
      setBoard(newBoard);

      const result = checkWinner(newBoard);
      if (result) {
        setWinner(result.winner);
        setWinningCells(result.cells);
        onWin(15);
        return;
      }

      if (newBoard.every(row => row.every(cell => cell))) {
        setWinner("draw");
        return;
      }

      setCurrentPlayer(currentPlayer === "R" ? "Y" : "R");
    } else if (gameMode === "ai") {
      if (currentPlayer !== "R") return;

      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = "R";
      setBoard(newBoard);

      const result = checkWinner(newBoard);
      if (result) {
        setWinner(result.winner);
        setWinningCells(result.cells);
        if (result.winner === "R") onWin(15);
        return;
      }

      if (newBoard.every(row => row.every(cell => cell))) {
        setWinner("draw");
        return;
      }

      setCurrentPlayer("Y");

      setTimeout(() => {
        const aiCol = getAIMove(newBoard.map(r => [...r]));
        const aiRow = getAvailableRow(newBoard, aiCol);
        if (aiRow >= 0) {
          newBoard[aiRow][aiCol] = "Y";
          setBoard([...newBoard]);

          const aiResult = checkWinner(newBoard);
          if (aiResult) {
            setWinner(aiResult.winner);
            setWinningCells(aiResult.cells);
          } else if (newBoard.every(row => row.every(cell => cell))) {
            setWinner("draw");
          }
        }
        setCurrentPlayer("R");
      }, 700);
    }
  };

  const resetGame = async () => {
    const emptyBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    if (gameMode === "multiplayer" && session) {
      await updateGameSession(session.id, {
        gameState: { board: emptyBoard },
        currentTurn: session.players.player1,
        status: "playing",
        winner: undefined
      });
    }
    setBoard(emptyBoard);
    setCurrentPlayer("R");
    setWinner(null);
    setWinningCells([]);
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
      ? currentPlayer === "R"
      : true;
  const isWinningCell = (r: number, c: number) => winningCells.some(([wr, wc]) => wr === r && wc === c);

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
          <h2 style={{ color: "#39ff14", margin: 0 }}>CONNECT FOUR</h2>
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
        <h2 style={{ color: "#39ff14", margin: 0 }}>CONNECT FOUR</h2>
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
          <span style={{ color: myColor === "R" ? "#ff0000" : "#ffff00" }}>
            You are {myColor === "R" ? "🔴" : "🟡"}
          </span>
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
        <div style={{ marginBottom: "20px", color: "#fff", fontSize: "18px" }}>
          {winner === "R" && <span style={{ color: "#39ff14" }}>🎉 {gameMode === "local2p" ? "Red" : "YOU"} WIN! +15 Points</span>}
          {winner === "Y" && (
            <span style={{ color: gameMode === "local2p" ? "#ffff00" : "#ff0000" }}>
              {gameMode === "local2p" ? "🎉 Yellow WINS!" : gameMode === "multiplayer" ? `${opponentName} Wins!` : "AI Wins! Try Again"}
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
                  Your Turn ({myColor === "R" ? "🔴" : "🟡"})
                </span>
              ) : (
                <span style={{ color: "#888" }}>Waiting for {opponentName}...</span>
              )
            ) : gameMode === "local2p" ? (
              <span style={{ color: currentPlayer === "R" ? "#ff0000" : "#ffff00" }}>
                {currentPlayer === "R" ? "🔴 Red" : "🟡 Yellow"}'s Turn
              </span>
            ) : (
              currentPlayer === "R" ? <span>Your Turn (🔴)</span> : <span style={{ color: "#888" }}>AI Thinking...</span>
            )
          )}
        </div>

        <div style={{ background: "#0055ff", padding: "15px", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,85,255,0.3)" }}>
          {board.map((row, r) => (
            <div key={r} style={{ display: "flex", gap: "8px", marginBottom: r < ROWS - 1 ? "8px" : 0 }}>
              {row.map((cell, c) => (
                <motion.div
                  key={c}
                  whileHover={{ scale: !cell && !winner ? 1.1 : 1 }}
                  onClick={() => dropPiece(c)}
                  style={{
                    width: "45px",
                    height: "45px",
                    borderRadius: "50%",
                    background: cell === "R" ? "#ff0000" : cell === "Y" ? "#ffff00" : "#001133",
                    cursor: !cell && !winner ? "pointer" : "default",
                    boxShadow: isWinningCell(r, c) ? "0 0 20px #fff" : "inset 0 3px 10px rgba(0,0,0,0.5)",
                    border: isWinningCell(r, c) ? "3px solid #fff" : "none",
                    transition: "all 0.2s"
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {winner && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={resetGame}
            style={{
              marginTop: "30px",
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
