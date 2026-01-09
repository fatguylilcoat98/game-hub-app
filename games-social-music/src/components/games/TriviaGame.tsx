import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle, XCircle, Users, User, Cpu } from "lucide-react";

const TRIVIA_QUESTIONS = [
  { question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1 },
  { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], answer: 2 },
  { question: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"], answer: 2 },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3 },
  { question: "How many continents are there?", options: ["5", "6", "7", "8"], answer: 2 },
  { question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], answer: 2 },
  { question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], answer: 2 },
  { question: "Who wrote Romeo and Juliet?", options: ["Dickens", "Shakespeare", "Austen", "Hemingway"], answer: 1 },
  { question: "What is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippo"], answer: 1 },
  { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], answer: 0 },
  { question: "Which country has the most population?", options: ["USA", "India", "China", "Russia"], answer: 2 },
  { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], answer: 1 },
  { question: "How many bones are in the human body?", options: ["186", "206", "226", "246"], answer: 1 },
  { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], answer: 2 },
  { question: "Who discovered gravity?", options: ["Einstein", "Newton", "Galileo", "Hawking"], answer: 1 },
];

interface TriviaGameProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
}

export default function TriviaGame({ onBack, onWin, userName }: TriviaGameProps) {
  const [gameMode, setGameMode] = useState<"menu" | "solo" | "2player">("menu");
  const [questions, setQuestions] = useState<typeof TRIVIA_QUESTIONS>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameMode !== "menu") {
      const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
      setQuestions(shuffled);
    }
  }, [gameMode]);

  useEffect(() => {
    if (gameOver || showResult || questions.length === 0 || gameMode === "menu") return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleAnswer(-1);
          return 15;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQ, gameOver, showResult, questions.length, gameMode, currentPlayer]);

  const handleAnswer = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    
    const isCorrect = idx === questions[currentQ].answer;
    if (isCorrect) {
      if (gameMode === "2player") {
        setScores(prev => ({
          ...prev,
          [currentPlayer === 1 ? "player1" : "player2"]: prev[currentPlayer === 1 ? "player1" : "player2"] + 10
        }));
      } else {
        setScores(prev => ({ ...prev, player1: prev.player1 + 10 }));
      }
    }

    setTimeout(() => {
      if (gameMode === "2player") {
        // In 2 player mode, alternate between players
        if (currentPlayer === 1) {
          setCurrentPlayer(2);
          setSelected(null);
          setShowResult(false);
          setTimeLeft(15);
        } else {
          // Both players answered, move to next question
          if (currentQ < questions.length - 1) {
            setCurrentQ((c) => c + 1);
            setCurrentPlayer(1);
            setSelected(null);
            setShowResult(false);
            setTimeLeft(15);
          } else {
            setGameOver(true);
            const finalScore = Math.max(scores.player1, scores.player2);
            if (finalScore >= 50) onWin(finalScore);
          }
        }
      } else {
        // Solo mode
        if (currentQ < questions.length - 1) {
          setCurrentQ((c) => c + 1);
          setSelected(null);
          setShowResult(false);
          setTimeLeft(15);
        } else {
          setGameOver(true);
          const finalScore = isCorrect ? scores.player1 + 10 : scores.player1;
          if (finalScore >= 50) onWin(finalScore);
        }
      }
    }, 1500);
  };

  const resetGame = () => {
    setQuestions([]);
    setCurrentQ(0);
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
    setSelected(null);
    setShowResult(false);
    setTimeLeft(15);
    setGameOver(false);
    setGameMode("menu");
  };

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
          <h2 style={{ color: "#39ff14", margin: 0 }}>TRIVIA</h2>
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

  if (questions.length === 0) return null;

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
        <div style={{ display: "flex", gap: "20px" }}>
          {gameMode === "2player" ? (
            <>
              <div style={{ color: currentPlayer === 1 ? "#39ff14" : "#888", fontWeight: "bold", fontSize: "18px" }}>
                P1: {scores.player1}
              </div>
              <div style={{ color: currentPlayer === 2 ? "#ff00ff" : "#888", fontWeight: "bold", fontSize: "18px" }}>
                P2: {scores.player2}
              </div>
            </>
          ) : (
            <div style={{ color: "#39ff14", fontWeight: "bold", fontSize: "24px" }}>SCORE: {scores.player1}</div>
          )}
        </div>
      </div>

      {/* Mode indicator */}
      {gameMode === "2player" && (
        <div style={{ 
          background: `linear-gradient(135deg, ${currentPlayer === 1 ? "rgba(57, 255, 20, 0.2)" : "rgba(255, 0, 255, 0.2)"}, rgba(0, 0, 0, 0.1))`,
          border: `1px solid ${currentPlayer === 1 ? "#39ff14" : "#ff00ff"}`,
          borderRadius: "10px",
          padding: "10px 15px",
          marginBottom: "15px",
          textAlign: "center"
        }}>
          <span style={{ color: currentPlayer === 1 ? "#39ff14" : "#ff00ff", fontWeight: "bold" }}>
            PLAYER {currentPlayer}'S TURN
          </span>
        </div>
      )}

      {!gameOver ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <span style={{ color: "#888" }}>Question {currentQ + 1}/10</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: timeLeft <= 5 ? "#ff0000" : "#39ff14" }}>
              <Clock size={20} /> {timeLeft}s
            </div>
          </div>

          <div style={{ background: "rgba(57, 255, 20, 0.1)", border: "2px solid #39ff14", borderRadius: "20px", padding: "30px", marginBottom: "30px" }}>
            <h2 style={{ color: "#fff", fontSize: "24px", textAlign: "center", margin: 0 }}>{questions[currentQ].question}</h2>
          </div>

          <div style={{ display: "grid", gap: "15px" }}>
            {questions[currentQ].options.map((opt, idx) => {
              let bg = "rgba(255,255,255,0.1)";
              let border = "1px solid #333";
              if (showResult) {
                if (idx === questions[currentQ].answer) {
                  bg = "rgba(57, 255, 20, 0.3)";
                  border = "2px solid #39ff14";
                } else if (idx === selected && idx !== questions[currentQ].answer) {
                  bg = "rgba(255, 0, 0, 0.3)";
                  border = "2px solid #ff0000";
                }
              }
              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: showResult ? 1 : 1.02 }}
                  whileTap={{ scale: showResult ? 1 : 0.98 }}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                  style={{
                    background: bg,
                    border,
                    borderRadius: "15px",
                    padding: "20px",
                    color: "#fff",
                    fontSize: "18px",
                    cursor: showResult ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  {opt}
                  {showResult && idx === questions[currentQ].answer && <CheckCircle size={24} color="#39ff14" />}
                  {showResult && idx === selected && idx !== questions[currentQ].answer && <XCircle size={24} color="#ff0000" />}
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ fontSize: "80px", marginBottom: "20px" }}
          >
            {gameMode === "2player" 
              ? (scores.player1 > scores.player2 ? "🏆" : scores.player2 > scores.player1 ? "🎉" : "🤝")
              : (scores.player1 >= 70 ? "🏆" : scores.player1 >= 50 ? "🎉" : "😅")
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
            <p style={{ color: "#fff", fontSize: "24px", marginBottom: "30px" }}>Final Score: {scores.player1}/100</p>
          )}
          
          {Math.max(scores.player1, scores.player2) >= 50 && (
            <p style={{ color: "#39ff14", fontSize: "18px" }}>+{Math.floor(Math.max(scores.player1, scores.player2) / 10)} Trophy Points Earned!</p>
          )}
          <button
            onClick={resetGame}
            style={{ background: "#39ff14", color: "#000", padding: "15px 40px", borderRadius: "50px", fontWeight: "bold", border: "none", marginTop: "20px", cursor: "pointer" }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </motion.div>
  );
}
