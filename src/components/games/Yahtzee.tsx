import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Dices, User, Cpu } from "lucide-react";

interface YahtzeeProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
}

const CATEGORIES = [
  { key: "ones", label: "Ones", calc: (d: number[]) => d.filter(x => x === 1).reduce((a, b) => a + b, 0) },
  { key: "twos", label: "Twos", calc: (d: number[]) => d.filter(x => x === 2).reduce((a, b) => a + b, 0) },
  { key: "threes", label: "Threes", calc: (d: number[]) => d.filter(x => x === 3).reduce((a, b) => a + b, 0) },
  { key: "fours", label: "Fours", calc: (d: number[]) => d.filter(x => x === 4).reduce((a, b) => a + b, 0) },
  { key: "fives", label: "Fives", calc: (d: number[]) => d.filter(x => x === 5).reduce((a, b) => a + b, 0) },
  { key: "sixes", label: "Sixes", calc: (d: number[]) => d.filter(x => x === 6).reduce((a, b) => a + b, 0) },
  { key: "threeKind", label: "3 of a Kind", calc: (d: number[]) => {
    const counts = [0,0,0,0,0,0];
    d.forEach(x => counts[x-1]++);
    return counts.some(c => c >= 3) ? d.reduce((a, b) => a + b, 0) : 0;
  }},
  { key: "fourKind", label: "4 of a Kind", calc: (d: number[]) => {
    const counts = [0,0,0,0,0,0];
    d.forEach(x => counts[x-1]++);
    return counts.some(c => c >= 4) ? d.reduce((a, b) => a + b, 0) : 0;
  }},
  { key: "fullHouse", label: "Full House", calc: (d: number[]) => {
    const counts = [0,0,0,0,0,0];
    d.forEach(x => counts[x-1]++);
    const has3 = counts.some(c => c === 3);
    const has2 = counts.some(c => c === 2);
    return has3 && has2 ? 25 : 0;
  }},
  { key: "smallStraight", label: "Sm Straight", calc: (d: number[]) => {
    const sorted = [...new Set(d)].sort();
    const str = sorted.join('');
    return str.includes('1234') || str.includes('2345') || str.includes('3456') ? 30 : 0;
  }},
  { key: "largeStraight", label: "Lg Straight", calc: (d: number[]) => {
    const sorted = [...new Set(d)].sort();
    const str = sorted.join('');
    return str === '12345' || str === '23456' ? 40 : 0;
  }},
  { key: "yahtzee", label: "YAHTZEE", calc: (d: number[]) => {
    return d.every(x => x === d[0]) ? 50 : 0;
  }},
  { key: "chance", label: "Chance", calc: (d: number[]) => d.reduce((a, b) => a + b, 0) },
];

export default function Yahtzee({ onBack, onWin, userName }: YahtzeeProps) {
  const [gameMode, setGameMode] = useState<"menu" | "solo" | "2player">("menu");
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [dice, setDice] = useState<number[]>([1, 1, 1, 1, 1]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [scores, setScores] = useState<{
    player1: Record<string, number | null>;
    player2: Record<string, number | null>;
  }>({ player1: {}, player2: {} });
  const [isRolling, setIsRolling] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const rollDice = () => {
    if (rollsLeft === 0 || isRolling) return;
    setIsRolling(true);
    
    let rolls = 0;
    const interval = setInterval(() => {
      setDice(d => d.map((v, i) => held[i] ? v : Math.floor(Math.random() * 6) + 1));
      rolls++;
      if (rolls >= 10) {
        clearInterval(interval);
        setIsRolling(false);
        setRollsLeft(r => r - 1);
      }
    }, 50);
  };

  const toggleHold = (idx: number) => {
    if (rollsLeft === 3) return;
    setHeld(h => h.map((v, i) => i === idx ? !v : v));
  };

  const scoreCategory = (key: string) => {
    const playerKey = currentPlayer === 1 ? "player1" : "player2";
    if (scores[playerKey][key] !== undefined && scores[playerKey][key] !== null) return;
    if (rollsLeft === 3) return;
    
    const cat = CATEGORIES.find(c => c.key === key);
    if (!cat) return;
    
    const score = cat.calc(dice);
    const newScores = { 
      ...scores, 
      [playerKey]: { ...scores[playerKey], [key]: score }
    };
    setScores(newScores);
    
    // Reset for next turn
    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    
    // Check if game over
    const p1Done = Object.keys(newScores.player1).length === CATEGORIES.length;
    const p2Done = gameMode === "solo" || Object.keys(newScores.player2).length === CATEGORIES.length;
    
    if (gameMode === "2player" && !p1Done && !p2Done) {
      // Switch players
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    } else if (p1Done && p2Done) {
      setGameOver(true);
      const p1Total = calculateTotal(newScores.player1);
      const p2Total = calculateTotal(newScores.player2);
      const maxTotal = Math.max(p1Total, p2Total);
      if (maxTotal >= 200) onWin(Math.floor(maxTotal / 10));
    } else if (gameMode === "2player") {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };

  const calculateTotal = (playerScores: Record<string, number | null>) => {
    const total = Object.values(playerScores).reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
    const upperScore = ["ones", "twos", "threes", "fours", "fives", "sixes"]
      .reduce((sum, k) => sum + (playerScores[k] || 0), 0);
    const bonus = upperScore >= 63 ? 35 : 0;
    return total + bonus;
  };

  const resetGame = () => {
    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setScores({ player1: {}, player2: {} });
    setCurrentPlayer(1);
    setGameOver(false);
    setGameMode("menu");
  };

  const getDiceFace = (value: number) => {
    const dots: Record<number, JSX.Element> = {
      1: <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "10px", height: "10px", borderRadius: "50%", background: "#000" }} />,
      2: <><div style={{ position: "absolute", top: "20%", right: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", bottom: "20%", left: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /></>,
      3: <><div style={{ position: "absolute", top: "20%", right: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", bottom: "20%", left: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /></>,
      4: <><div style={{ position: "absolute", top: "20%", left: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", top: "20%", right: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", bottom: "20%", left: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", bottom: "20%", right: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /></>,
      5: <><div style={{ position: "absolute", top: "20%", left: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", top: "20%", right: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", bottom: "20%", left: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", bottom: "20%", right: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /></>,
      6: <><div style={{ position: "absolute", top: "20%", left: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", top: "20%", right: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", top: "50%", left: "20%", transform: "translateY(-50%)", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", top: "50%", right: "20%", transform: "translateY(-50%)", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", bottom: "20%", left: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /><div style={{ position: "absolute", bottom: "20%", right: "20%", width: "8px", height: "8px", borderRadius: "50%", background: "#000" }} /></>,
    };
    return dots[value];
  };

  const p1Total = calculateTotal(scores.player1);
  const p2Total = calculateTotal(scores.player2);
  const currentScores = currentPlayer === 1 ? scores.player1 : scores.player2;

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
          <h2 style={{ color: "#39ff14", margin: 0 }}>YAHTZEE</h2>
          <div style={{ width: "80px" }} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGameMode("solo")}
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
            <Cpu size={28} /> SOLO PLAY
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGameMode("2player")}
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
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: "100vh", background: "transparent", padding: "20px", display: "flex", flexDirection: "column", overflow: "auto" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <button onClick={resetGame} style={{ background: "none", border: "none", color: "#39ff14", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <ArrowLeft size={24} /> BACK
        </button>
        <h2 style={{ color: "#39ff14", margin: 0 }}>YAHTZEE</h2>
        <button onClick={resetGame} style={{ background: "none", border: "none", color: "#39ff14", cursor: "pointer" }}>
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Mode indicator */}
      {gameMode === "2player" && (
        <div style={{ 
          background: `linear-gradient(135deg, ${currentPlayer === 1 ? "rgba(57, 255, 20, 0.2)" : "rgba(255, 0, 255, 0.2)"}, rgba(0, 0, 0, 0.1))`,
          border: `1px solid ${currentPlayer === 1 ? "#39ff14" : "#ff00ff"}`,
          borderRadius: "10px",
          padding: "10px 15px",
          marginBottom: "15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ color: currentPlayer === 1 ? "#39ff14" : "#ff00ff", fontWeight: "bold" }}>
            PLAYER {currentPlayer}'S TURN
          </span>
          <div style={{ display: "flex", gap: "15px" }}>
            <span style={{ color: "#39ff14" }}>P1: {p1Total}</span>
            <span style={{ color: "#ff00ff" }}>P2: {p2Total}</span>
          </div>
        </div>
      )}

      {!gameOver ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
          <div style={{ color: "#39ff14", fontSize: "24px", fontWeight: "bold" }}>
            Score: {currentPlayer === 1 ? p1Total : p2Total}
          </div>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            {dice.map((d, i) => (
              <motion.div
                key={i}
                animate={{ rotate: isRolling && !held[i] ? [0, 360] : 0 }}
                transition={{ duration: 0.1, repeat: isRolling && !held[i] ? Infinity : 0 }}
                onClick={() => toggleHold(i)}
                style={{
                  width: "50px",
                  height: "50px",
                  background: held[i] ? "#39ff14" : "#fff",
                  borderRadius: "10px",
                  position: "relative",
                  cursor: rollsLeft < 3 ? "pointer" : "default",
                  border: held[i] ? "3px solid #fff" : "3px solid transparent"
                }}
              >
                {getDiceFace(d)}
              </motion.div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={rollDice}
              disabled={rollsLeft === 0 || isRolling}
              style={{
                background: rollsLeft > 0 ? "#39ff14" : "#333",
                color: "#000",
                padding: "12px 30px",
                borderRadius: "50px",
                fontWeight: "bold",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: rollsLeft > 0 ? "pointer" : "default"
              }}
            >
              <Dices size={20} /> ROLL ({rollsLeft})
            </motion.button>
          </div>

          <div style={{ width: "100%", maxWidth: "350px", background: "rgba(255,255,255,0.05)", borderRadius: "15px", padding: "15px" }}>
            {CATEGORIES.map((cat) => {
              const potential = cat.calc(dice);
              const scored = currentScores[cat.key] !== undefined && currentScores[cat.key] !== null;
              return (
                <div
                  key={cat.key}
                  onClick={() => scoreCategory(cat.key)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px",
                    borderBottom: "1px solid #222",
                    cursor: scored || rollsLeft === 3 ? "default" : "pointer",
                    opacity: scored ? 0.5 : 1,
                    background: !scored && rollsLeft < 3 && potential > 0 ? "rgba(57, 255, 20, 0.1)" : "transparent"
                  }}
                >
                  <span style={{ color: "#fff" }}>{cat.label}</span>
                  <span style={{ color: scored ? "#888" : "#39ff14", fontWeight: "bold" }}>
                    {scored ? currentScores[cat.key] : (rollsLeft < 3 ? potential : "-")}
                  </span>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderTop: "2px solid #39ff14", marginTop: "10px" }}>
              <span style={{ color: "#39ff14", fontWeight: "bold" }}>BONUS (63+ upper)</span>
              <span style={{ color: "#39ff14", fontWeight: "bold" }}>
                {["ones", "twos", "threes", "fours", "fives", "sixes"]
                  .reduce((sum, k) => sum + (currentScores[k] || 0), 0) >= 63 ? 35 : 0}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: "80px", marginBottom: "20px" }}>
            {gameMode === "2player" 
              ? (p1Total > p2Total ? "🏆" : p2Total > p1Total ? "🎉" : "🤝")
              : (p1Total >= 200 ? "🏆" : "🎲")
            }
          </motion.div>
          <h1 style={{ color: "#39ff14", fontSize: "48px", margin: "0 0 10px 0" }}>GAME OVER!</h1>
          
          {gameMode === "2player" ? (
            <>
              <p style={{ color: "#fff", fontSize: "24px", marginBottom: "10px" }}>
                {p1Total > p2Total 
                  ? "Player 1 Wins!" 
                  : p2Total > p1Total 
                    ? "Player 2 Wins!" 
                    : "It's a Tie!"}
              </p>
              <div style={{ display: "flex", gap: "30px", marginBottom: "20px" }}>
                <div style={{ color: "#39ff14", fontSize: "20px" }}>P1: {p1Total}</div>
                <div style={{ color: "#ff00ff", fontSize: "20px" }}>P2: {p2Total}</div>
              </div>
            </>
          ) : (
            <p style={{ color: "#fff", fontSize: "24px", marginBottom: "10px" }}>Final Score: {p1Total}</p>
          )}
          
          {Math.max(p1Total, p2Total) >= 200 && (
            <p style={{ color: "#39ff14" }}>+{Math.floor(Math.max(p1Total, p2Total) / 10)} Trophy Points!</p>
          )}
          <button onClick={resetGame} style={{ background: "#39ff14", color: "#000", padding: "15px 40px", borderRadius: "50px", fontWeight: "bold", border: "none", marginTop: "20px", cursor: "pointer" }}>
            PLAY AGAIN
          </button>
        </div>
      )}
    </motion.div>
  );
}
