import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Shuffle, Check, User, Cpu } from "lucide-react";

interface ScrabbleProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
}

const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const VALID_WORDS = [
  "CAT", "DOG", "BAT", "RAT", "HAT", "MAT", "SAT", "PAT", "FAT", "VAT",
  "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HAD",
  "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS",
  "HOW", "ITS", "MAY", "NEW", "NOW", "OLD", "SEE", "TWO", "WAY", "WHO",
  "BOY", "DID", "ITS", "LET", "PUT", "SAY", "SHE", "TOO", "USE", "LOVE",
  "GAME", "PLAY", "WORD", "TILE", "RACK", "TURN", "SWAP", "PASS", "DRAW",
  "QUIZ", "JINX", "FLEX", "JUMP", "ZEST", "COZY", "FIZZ", "JAZZ", "BUZZ",
  "APPLE", "BEACH", "CHAIR", "DANCE", "EAGLE", "FLAME", "GRAPE", "HOUSE",
  "JUICE", "KNIFE", "LEMON", "MONEY", "NIGHT", "OCEAN", "PIANO", "QUEEN",
  "RIVER", "SNAKE", "TIGER", "UNDER", "VOICE", "WATER", "XENON", "YOUTH", "ZEBRA"
];

const generateTiles = (): string[] => {
  const letters = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ";
  const tiles: string[] = [];
  for (let i = 0; i < 7; i++) {
    tiles.push(letters[Math.floor(Math.random() * letters.length)]);
  }
  return tiles;
};

export default function Scrabble({ onBack, onWin, userName }: ScrabbleProps) {
  const [gameMode, setGameMode] = useState<"menu" | "solo" | "2player">("menu");
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [racks, setRacks] = useState<{ player1: string[]; player2: string[] }>({
    player1: generateTiles(),
    player2: generateTiles()
  });
  const [word, setWord] = useState<string[]>([]);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [wordsPlayed, setWordsPlayed] = useState<{ player1: string[]; player2: string[] }>({
    player1: [],
    player2: []
  });
  const [message, setMessage] = useState("");
  const [turnsLeft, setTurnsLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);

  const currentRack = currentPlayer === 1 ? racks.player1 : racks.player2;
  const currentWordsPlayed = currentPlayer === 1 ? wordsPlayed.player1 : wordsPlayed.player2;

  const calculateWordScore = (letters: string[]): number => {
    return letters.reduce((sum, l) => sum + (LETTER_VALUES[l] || 0), 0);
  };

  const addToWord = (idx: number) => {
    if (word.length >= 7) return;
    const letter = currentRack[idx];
    setWord([...word, letter]);
    
    const newRack = currentRack.filter((_, i) => i !== idx);
    if (currentPlayer === 1) {
      setRacks({ ...racks, player1: newRack });
    } else {
      setRacks({ ...racks, player2: newRack });
    }
  };

  const removeFromWord = (idx: number) => {
    const letter = word[idx];
    const newRack = [...currentRack, letter];
    if (currentPlayer === 1) {
      setRacks({ ...racks, player1: newRack });
    } else {
      setRacks({ ...racks, player2: newRack });
    }
    setWord(word.filter((_, i) => i !== idx));
  };

  const submitWord = () => {
    const wordStr = word.join("");
    if (wordStr.length < 2) {
      setMessage("Word must be at least 2 letters!");
      return;
    }
    if (currentWordsPlayed.includes(wordStr)) {
      setMessage("Already played this word!");
      return;
    }
    if (!VALID_WORDS.includes(wordStr)) {
      setMessage("Not a valid word!");
      return;
    }

    const wordScore = calculateWordScore(word);
    const bonus = word.length >= 5 ? 10 : word.length >= 4 ? 5 : 0;
    const totalWordScore = wordScore + bonus;
    
    const newScores = {
      ...scores,
      [currentPlayer === 1 ? "player1" : "player2"]: scores[currentPlayer === 1 ? "player1" : "player2"] + totalWordScore
    };
    setScores(newScores);
    
    const newWordsPlayed = {
      ...wordsPlayed,
      [currentPlayer === 1 ? "player1" : "player2"]: [...currentWordsPlayed, wordStr]
    };
    setWordsPlayed(newWordsPlayed);
    
    setMessage(`+${totalWordScore} points!${bonus > 0 ? ` (includes ${bonus} bonus)` : ""}`);
    setWord([]);
    
    // Generate new tiles for current player
    const newRack = generateTiles();
    if (currentPlayer === 1) {
      setRacks({ ...racks, player1: newRack });
    } else {
      setRacks({ ...racks, player2: newRack });
    }

    if (gameMode === "2player") {
      // Switch players
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
    
    setTurnsLeft(t => t - 1);

    if (turnsLeft <= 1) {
      setGameOver(true);
      const finalScore = Math.max(newScores.player1, newScores.player2);
      if (finalScore >= 50) onWin(Math.floor(finalScore / 5));
    }
  };

  const shuffleRack = () => {
    const shuffled = [...currentRack].sort(() => Math.random() - 0.5);
    if (currentPlayer === 1) {
      setRacks({ ...racks, player1: shuffled });
    } else {
      setRacks({ ...racks, player2: shuffled });
    }
  };

  const skipTurn = () => {
    // Return letters to rack
    const newRack = [...currentRack, ...word];
    if (currentPlayer === 1) {
      setRacks({ ...racks, player1: generateTiles() });
    } else {
      setRacks({ ...racks, player2: generateTiles() });
    }
    setWord([]);
    
    if (gameMode === "2player") {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
    
    setTurnsLeft(t => t - 1);
    setMessage("Turn skipped");
    
    if (turnsLeft <= 1) {
      setGameOver(true);
      const finalScore = Math.max(scores.player1, scores.player2);
      if (finalScore >= 50) onWin(Math.floor(finalScore / 5));
    }
  };

  const resetGame = () => {
    setRacks({ player1: generateTiles(), player2: generateTiles() });
    setWord([]);
    setScores({ player1: 0, player2: 0 });
    setWordsPlayed({ player1: [], player2: [] });
    setMessage("");
    setTurnsLeft(10);
    setGameOver(false);
    setCurrentPlayer(1);
    setGameMode("menu");
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
          <h2 style={{ color: "#39ff14", margin: 0 }}>WORD BUILDER</h2>
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
      style={{ height: "100vh", background: "transparent", padding: "20px", display: "flex", flexDirection: "column" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button onClick={resetGame} style={{ background: "none", border: "none", color: "#39ff14", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <ArrowLeft size={24} /> BACK
        </button>
        <h2 style={{ color: "#39ff14", margin: 0 }}>WORD BUILDER</h2>
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
            <span style={{ color: "#39ff14" }}>P1: {scores.player1}</span>
            <span style={{ color: "#ff00ff" }}>P2: {scores.player2}</span>
          </div>
        </div>
      )}

      {!gameOver ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <div style={{ color: "#39ff14", fontSize: "24px", fontWeight: "bold" }}>
              Score: {currentPlayer === 1 ? scores.player1 : scores.player2}
            </div>
            <div style={{ color: "#888", fontSize: "18px" }}>Turns: {turnsLeft}</div>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: message.includes("+") ? "#39ff14" : "#ff6666", marginBottom: "15px", fontWeight: "bold" }}
            >
              {message}
            </motion.div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px", textAlign: "center" }}>YOUR WORD</div>
            <div style={{ display: "flex", gap: "8px", minHeight: "60px", padding: "10px", background: "rgba(57, 255, 20, 0.1)", borderRadius: "10px", minWidth: "280px", justifyContent: "center" }}>
              {word.length === 0 ? (
                <span style={{ color: "#555", alignSelf: "center" }}>Tap tiles to build a word</span>
              ) : (
                word.map((l, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => removeFromWord(i)}
                    style={{
                      width: "50px",
                      height: "50px",
                      background: "linear-gradient(135deg, #f5deb3, #deb887)",
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
                      position: "relative"
                    }}
                  >
                    <span style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>{l}</span>
                    <span style={{ fontSize: "10px", color: "#666", position: "absolute", bottom: "2px", right: "4px" }}>{LETTER_VALUES[l]}</span>
                  </motion.div>
                ))
              )}
            </div>
            {word.length > 0 && (
              <div style={{ textAlign: "center", marginTop: "8px", color: "#39ff14" }}>
                Word Value: {calculateWordScore(word)} {word.length >= 4 && `(+${word.length >= 5 ? 10 : 5} bonus)`}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px", textAlign: "center" }}>YOUR TILES</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {currentRack.map((l, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToWord(i)}
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "linear-gradient(135deg, #f5deb3, #deb887)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
                    position: "relative"
                  }}
                >
                  <span style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>{l}</span>
                  <span style={{ fontSize: "10px", color: "#666", position: "absolute", bottom: "2px", right: "4px" }}>{LETTER_VALUES[l]}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={submitWord}
              disabled={word.length < 2}
              style={{
                background: word.length >= 2 ? "#39ff14" : "#333",
                color: "#000",
                padding: "12px 25px",
                borderRadius: "50px",
                fontWeight: "bold",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: word.length >= 2 ? "pointer" : "default"
              }}
            >
              <Check size={20} /> SUBMIT
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={shuffleRack}
              style={{
                background: "#333",
                color: "#fff",
                padding: "12px 25px",
                borderRadius: "50px",
                fontWeight: "bold",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer"
              }}
            >
              <Shuffle size={20} /> SHUFFLE
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={skipTurn}
              style={{
                background: "#333",
                color: "#fff",
                padding: "12px 25px",
                borderRadius: "50px",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer"
              }}
            >
              SKIP
            </motion.button>
          </div>

          {currentWordsPlayed.length > 0 && (
            <div style={{ marginTop: "20px", color: "#888", fontSize: "14px" }}>
              Words: {currentWordsPlayed.join(", ")}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: "80px", marginBottom: "20px" }}>
            {gameMode === "2player" 
              ? (scores.player1 > scores.player2 ? "🏆" : scores.player2 > scores.player1 ? "🎉" : "🤝")
              : (scores.player1 >= 100 ? "🏆" : scores.player1 >= 50 ? "🎉" : "📝")
            }
          </motion.div>
          <h1 style={{ color: "#39ff14", fontSize: "48px", margin: "0 0 10px 0" }}>GAME OVER!</h1>
          
          {gameMode === "2player" ? (
            <>
              <p style={{ color: "#fff", fontSize: "24px", marginBottom: "10px" }}>
                {scores.player1 > scores.player2 
                  ? "Player 1 Wins!" 
                  : scores.player2 > scores.player1 
                    ? "Player 2 Wins!" 
                    : "It's a Tie!"}
              </p>
              <div style={{ display: "flex", gap: "30px", marginBottom: "20px" }}>
                <div style={{ color: "#39ff14", fontSize: "20px" }}>P1: {scores.player1}</div>
                <div style={{ color: "#ff00ff", fontSize: "20px" }}>P2: {scores.player2}</div>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: "#fff", fontSize: "24px", marginBottom: "10px" }}>Final Score: {scores.player1}</p>
              <p style={{ color: "#888", marginBottom: "20px" }}>Words Played: {wordsPlayed.player1.length}</p>
            </>
          )}
          
          {Math.max(scores.player1, scores.player2) >= 50 && (
            <p style={{ color: "#39ff14" }}>+{Math.floor(Math.max(scores.player1, scores.player2) / 5)} Trophy Points!</p>
          )}
          <button onClick={resetGame} style={{ background: "#39ff14", color: "#000", padding: "15px 40px", borderRadius: "50px", fontWeight: "bold", border: "none", marginTop: "20px", cursor: "pointer" }}>
            PLAY AGAIN
          </button>
        </div>
      )}
    </motion.div>
  );
}
