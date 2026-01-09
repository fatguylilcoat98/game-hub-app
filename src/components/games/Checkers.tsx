import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Users, Cpu, User } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "../../lib/firebase";
import { GameSession, updateGameSession, endGameSession } from "./MultiplayerManager";


interface CheckersProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
  multiplayerSession?: GameSession | null;
  onExitMultiplayer?: () => void;
}

type Piece = { player: "R" | "B"; king: boolean } | null;

const BOARD_SIZE = 8;

const initBoard = (): Piece[][] => {
  const board: Piece[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { player: "B", king: false };
    }
  }
  for (let r = 5; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { player: "R", king: false };
    }
  }
  return board;
};

export default function Checkers({ onBack, onWin, userName, multiplayerSession, onExitMultiplayer }: CheckersProps) {
  const [board, setBoard] = useState<Piece[][]>(initBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<"R" | "B">("R");
  const [winner, setWinner] = useState<"R" | "B" | null>(null);
  const [gameMode, setGameMode] = useState<"menu" | "ai" | "local2p" | "multiplayer">(multiplayerSession ? "multiplayer" : "menu");
  
  // Multiplayer state
  const [session, setSession] = useState<GameSession | null>(multiplayerSession || null);
  const [myColor, setMyColor] = useState<"R" | "B">("R");
  const [opponentName, setOpponentName] = useState("");

  // Initialize multiplayer
  useEffect(() => {
    if (multiplayerSession) {
      setSession(multiplayerSession);
      setGameMode("multiplayer");
      const isPlayer1 = multiplayerSession.players.player1 === userName;
      setMyColor(isPlayer1 ? "R" : "B");
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
            onWin(20);
          } else {
            setWinner(myColor === "R" ? "B" : "R");
          }
        }
      }
    });
    return () => unsubscribe();
  }, [session?.id, gameMode, userName, myColor, onWin]);

  const getValidMoves = (b: Piece[][], r: number, c: number, mustJump = false): [number, number][] => {
    const piece = b[r][c];
    if (!piece) return [];
    
    const moves: [number, number][] = [];
    const directions = piece.king ? [-1, 1] : piece.player === "R" ? [-1] : [1];
    
    // Check jumps first
    for (const dr of directions) {
      for (const dc of [-1, 1]) {
        const jr = r + dr * 2;
        const jc = c + dc * 2;
        const mr = r + dr;
        const mc = c + dc;
        if (jr >= 0 && jr < BOARD_SIZE && jc >= 0 && jc < BOARD_SIZE) {
          const middle = b[mr][mc];
          if (middle && middle.player !== piece.player && !b[jr][jc]) {
            moves.push([jr, jc]);
          }
        }
      }
    }

    // Regular moves only if no jumps and not forced
    if (moves.length === 0 && !mustJump) {
      for (const dr of directions) {
        for (const dc of [-1, 1]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !b[nr][nc]) {
            moves.push([nr, nc]);
          }
        }
      }
    }

    return moves;
  };

  const hasJumps = (b: Piece[][], player: "R" | "B"): boolean => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (b[r][c]?.player === player) {
          const moves = getValidMoves(b, r, c, true);
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  };

  const handleClick = async (r: number, c: number) => {
    if (winner) return;
    
    const activePlayer = gameMode === "multiplayer" ? myColor : currentPlayer;
    const isMyTurn = gameMode === "multiplayer" 
      ? session?.currentTurn === userName 
      : gameMode === "ai" 
        ? currentPlayer === "R"
        : true;
    
    if (!isMyTurn) return;

    const piece = board[r][c];
    
    if (selected) {
      const [sr, sc] = selected;
      const isValidMove = validMoves.some(([mr, mc]) => mr === r && mc === c);
      
      if (isValidMove) {
        const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
        newBoard[r][c] = newBoard[sr][sc];
        newBoard[sr][sc] = null;
        
        // Check for jump (capture)
        const isJump = Math.abs(r - sr) === 2;
        if (isJump) {
          const mr = (r + sr) / 2;
          const mc = (c + sc) / 2;
          newBoard[mr][mc] = null;
        }
        
        // King promotion
        if (newBoard[r][c]?.player === "R" && r === 0) {
          newBoard[r][c] = { player: "R", king: true };
        }
        if (newBoard[r][c]?.player === "B" && r === BOARD_SIZE - 1) {
          newBoard[r][c] = { player: "B", king: true };
        }
        
        // Check for additional jumps
        if (isJump) {
          const moreJumps = getValidMoves(newBoard, r, c, true);
          if (moreJumps.length > 0) {
            setBoard(newBoard);
            setSelected([r, c]);
            setValidMoves(moreJumps);
            return;
          }
        }
        
        setBoard(newBoard);
        setSelected(null);
        setValidMoves([]);
        
        // Check win condition
        const opponentColor = activePlayer === "R" ? "B" : "R";
        const opponentPieces = newBoard.flat().filter(p => p?.player === opponentColor).length;
        
        if (opponentPieces === 0) {
          if (gameMode === "multiplayer") {
            await endGameSession(session!.id, userName);
          } else {
            setWinner(activePlayer);
            onWin(20);
          }
          return;
        }
        
        if (gameMode === "multiplayer") {
          await updateGameSession(session!.id, {
            gameState: { board: newBoard },
            currentTurn: opponentName
          });
        } else if (gameMode === "ai") {
          setCurrentPlayer("B");
        } else {
          setCurrentPlayer(currentPlayer === "R" ? "B" : "R");
        }
      } else if (piece?.player === activePlayer) {
        const mustJump = hasJumps(board, activePlayer);
        const moves = getValidMoves(board, r, c, mustJump);
        setSelected([r, c]);
        setValidMoves(moves);
      } else {
        setSelected(null);
        setValidMoves([]);
      }
    } else if (piece?.player === activePlayer) {
      const mustJump = hasJumps(board, activePlayer);
      const moves = getValidMoves(board, r, c, mustJump);
      setSelected([r, c]);
      setValidMoves(moves);
    }
  };

  // AI Move
  useEffect(() => {
    if (gameMode !== "ai" || currentPlayer !== "B" || winner) return;
    
    const timer = setTimeout(() => {
      const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
      
      // Find all possible moves for AI
      let allMoves: { from: [number, number]; to: [number, number]; isJump: boolean }[] = [];
      const mustJump = hasJumps(newBoard, "B");
      
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (newBoard[r][c]?.player === "B") {
            const moves = getValidMoves(newBoard, r, c, mustJump);
            moves.forEach(([tr, tc]) => {
              allMoves.push({ from: [r, c], to: [tr, tc], isJump: Math.abs(tr - r) === 2 });
            });
          }
        }
      }
      
      if (allMoves.length === 0) {
        setWinner("R");
        onWin(20);
        return;
      }
      
      // Prefer jumps
      const jumps = allMoves.filter(m => m.isJump);
      const move = jumps.length > 0 
        ? jumps[Math.floor(Math.random() * jumps.length)]
        : allMoves[Math.floor(Math.random() * allMoves.length)];
      
      const [fr, fc] = move.from;
      const [tr, tc] = move.to;
      
      newBoard[tr][tc] = newBoard[fr][fc];
      newBoard[fr][fc] = null;
      
      if (move.isJump) {
        const mr = (fr + tr) / 2;
        const mc = (fc + tc) / 2;
        newBoard[mr][mc] = null;
      }
      
      // King promotion
      if (newBoard[tr][tc]?.player === "B" && tr === BOARD_SIZE - 1) {
        newBoard[tr][tc] = { player: "B", king: true };
      }
      
      setBoard(newBoard);
      
      // Check win
      const redPieces = newBoard.flat().filter(p => p?.player === "R").length;
      if (redPieces === 0) {
        setWinner("B");
      } else {
        setCurrentPlayer("R");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [currentPlayer, winner, board, gameMode, onWin]);

  const resetGame = async () => {
    const newBoard = initBoard();
    if (gameMode === "multiplayer" && session) {
      await updateGameSession(session.id, {
        gameState: { board: newBoard },
        currentTurn: session.players.player1,
        status: "playing",
        winner: undefined
      });
    }
    setBoard(newBoard);
    setSelected(null);
    setValidMoves([]);
    setCurrentPlayer("R");
    setWinner(null);
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

  const isValidMoveCell = (r: number, c: number) => validMoves.some(([mr, mc]) => mr === r && mc === c);
  const isMyTurn = gameMode === "multiplayer" 
    ? session?.currentTurn === userName 
    : gameMode === "ai"
      ? currentPlayer === "R"
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
          <h2 style={{ color: "#39ff14", margin: 0 }}>CHECKERS</h2>
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
        <h2 style={{ color: "#39ff14", margin: 0 }}>CHECKERS</h2>
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
          <span style={{ color: myColor === "R" ? "#ff0000" : "#333" }}>
            You are {myColor === "R" ? "Red" : "Black"}
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
          {winner === "R" && <span style={{ color: "#39ff14" }}>🎉 {gameMode === "local2p" ? "Red" : "YOU"} WIN! +20 Points</span>}
          {winner === "B" && (
            <span style={{ color: gameMode === "local2p" ? "#39ff14" : "#ff0000" }}>
              {gameMode === "local2p" ? "🎉 Black WINS!" : gameMode === "multiplayer" ? `${opponentName} Wins!` : "AI Wins! Try Again"}
            </span>
          )}
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
                  Your Turn ({myColor === "R" ? "Red" : "Black"})
                </span>
              ) : (
                <span style={{ color: "#888" }}>Waiting for {opponentName}...</span>
              )
            ) : gameMode === "local2p" ? (
              <span style={{ color: currentPlayer === "R" ? "#ff0000" : "#333" }}>
                {currentPlayer === "R" ? "Red" : "Black"}'s Turn
              </span>
            ) : (
              currentPlayer === "R" ? <span>Your Turn (Red)</span> : <span style={{ color: "#888" }}>AI Thinking...</span>
            )
          )}
        </div>

        <div style={{ background: "#8B4513", padding: "10px", borderRadius: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          {board.map((row, r) => (
            <div key={r} style={{ display: "flex" }}>
              {row.map((cell, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selected?.[0] === r && selected?.[1] === c;
                const isValid = isValidMoveCell(r, c);
                
                return (
                  <div
                    key={c}
                    onClick={() => handleClick(r, c)}
                    style={{
                      width: "45px",
                      height: "45px",
                      background: isDark ? "#654321" : "#DEB887",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      position: "relative"
                    }}
                  >
                    {isValid && (
                      <div style={{
                        position: "absolute",
                        width: "15px",
                        height: "15px",
                        borderRadius: "50%",
                        background: "rgba(57, 255, 20, 0.5)"
                      }} />
                    )}
                    {cell && (
                      <motion.div
                        animate={{ scale: isSelected ? 1.1 : 1 }}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: cell.player === "R" 
                            ? "radial-gradient(circle at 30% 30%, #ff6666, #cc0000)" 
                            : "radial-gradient(circle at 30% 30%, #444, #000)",
                          border: isSelected ? "3px solid #39ff14" : "2px solid rgba(0,0,0,0.3)",
                          boxShadow: "0 3px 6px rgba(0,0,0,0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: cell.player === "R" ? "#fff" : "#gold",
                          fontWeight: "bold",
                          fontSize: "16px"
                        }}
                      >
                        {cell.king && "👑"}
                      </motion.div>
                    )}
                  </div>
                );
              })}
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
