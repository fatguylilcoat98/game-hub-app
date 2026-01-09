import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Zap, Shuffle, Check, X, Flame } from "lucide-react";

interface TruthOrDareProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
}

const TRUTHS = [
  "What was your first impression of me?",
  "What's your favorite memory of us together?",
  "What's something you've never told me but want to?",
  "What do you love most about our relationship?",
  "What's your biggest fear about our future?",
  "When did you first realize you had feelings for me?",
  "What's the most romantic thing you've ever imagined us doing?",
  "What's something I do that always makes you smile?",
  "What's your favorite physical feature of mine?",
  "What song reminds you of me?",
  "What's your favorite date we've been on?",
  "What's something you want us to try together?",
  "What do you think is our biggest strength as a couple?",
  "What's the sweetest thing I've ever done for you?",
  "If you could relive one moment with me, what would it be?",
  "What's something you admire about me?",
  "What's your favorite way to spend time together?",
  "What made you fall in love with me?",
  "What's a dream you want us to achieve together?",
  "What's the most attractive thing about my personality?"
];

const DARES = [
  "Give me a 30-second massage",
  "Send me the most romantic text you can think of",
  "Do your best impression of me",
  "Serenade me with a love song",
  "Give me a compliment for every letter of my name",
  "Do a slow dance with me right now",
  "Write a short love poem about us",
  "Show me the last photo you took of me",
  "Tell me 5 things you love about me in 30 seconds",
  "Give me butterfly kisses",
  "Feed me something sweet",
  "Recreate our first kiss",
  "Hold my hand and look into my eyes for 60 seconds",
  "Give me a piggyback ride",
  "Draw a heart on my hand",
  "Whisper something sweet in my ear",
  "Do a couple's yoga pose with me",
  "Make up a nickname for me on the spot",
  "Plan our next date in 60 seconds",
  "Tell me your favorite thing about my laugh"
];

const SPICY_TRUTHS = [
  "What's your biggest fantasy involving us?",
  "What outfit of mine drives you crazy?",
  "What's the most attractive thing I do without realizing?",
  "Where's the most adventurous place you'd want to kiss me?",
  "What's something flirty you've wanted to say to me?",
  "What's your favorite way I show affection?",
  "What moment between us made your heart race the most?",
  "What's a romantic surprise you've been wanting to plan?"
];

const SPICY_DARES = [
  "Give me a kiss that lasts at least 10 seconds",
  "Whisper your biggest fantasy in my ear",
  "Give me a neck massage for 2 minutes",
  "Send me your most flirty selfie",
  "Write 'I love you' somewhere on my body",
  "Do your most seductive dance move",
  "Give me a forehead kiss and tell me why you love me",
  "Play with my hair for 2 minutes"
];

export default function TruthOrDare({ onBack, onWin, userName }: TruthOrDareProps) {
  const [mode, setMode] = useState<"select" | "truth" | "dare" | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [completed, setCompleted] = useState(0);
  const [spicyMode, setSpicyMode] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [usedTruths, setUsedTruths] = useState<string[]>([]);
  const [usedDares, setUsedDares] = useState<string[]>([]);

  const getRandomPrompt = (type: "truth" | "dare") => {
    const pool = type === "truth" 
      ? (spicyMode ? [...TRUTHS, ...SPICY_TRUTHS] : TRUTHS)
      : (spicyMode ? [...DARES, ...SPICY_DARES] : DARES);
    
    const used = type === "truth" ? usedTruths : usedDares;
    const available = pool.filter(p => !used.includes(p));
    
    if (available.length === 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    
    const prompt = available[Math.floor(Math.random() * available.length)];
    
    if (type === "truth") {
      setUsedTruths([...usedTruths, prompt]);
    } else {
      setUsedDares([...usedDares, prompt]);
    }
    
    return prompt;
  };

  const handleChoice = (choice: "truth" | "dare") => {
    const prompt = getRandomPrompt(choice);
    setCurrentPrompt(prompt);
    setMode(choice);
  };

  const handleComplete = (didComplete: boolean) => {
    if (didComplete) {
      setCompleted(prev => prev + 1);
    }
    
    if (completed + 1 >= 10) {
      setShowResult(true);
      onWin((completed + 1) * 15);
    } else {
      setMode("select");
      setCurrentPrompt("");
    }
  };

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "linear-gradient(135deg, #9b59b620, #8e44ad20)"
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <Flame size={80} color="#9b59b6" style={{ marginBottom: "20px" }} />
          <h1 style={{ color: "#9b59b6", fontSize: "32px", marginBottom: "10px" }}>
            Amazing Round!
          </h1>
          <p style={{ color: "#888", fontSize: "18px", marginBottom: "30px" }}>
            You completed {completed} challenges!
          </p>
          <div style={{
            background: "linear-gradient(135deg, #ffd700, #ff8c00)",
            padding: "15px 30px",
            borderRadius: "50px",
            marginBottom: "30px"
          }}>
            <span style={{ color: "#000", fontWeight: "bold", fontSize: "24px" }}>
              +{completed * 15} Points!
            </span>
          </div>
          <button
            onClick={onBack}
            style={{
              background: "#9b59b6",
              color: "#fff",
              border: "none",
              padding: "15px 40px",
              borderRadius: "50px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Back to Games
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        background: "linear-gradient(135deg, #9b59b610, #8e44ad10)"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#9b59b6",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={24} /> BACK
        </button>
        <h1 style={{ color: "#9b59b6", margin: 0, fontSize: "20px" }}>
          TRUTH OR DARE
        </h1>
        <div style={{
          background: "rgba(155, 89, 182, 0.2)",
          padding: "8px 16px",
          borderRadius: "20px",
          color: "#9b59b6",
          fontWeight: "bold"
        }}>
          {completed}/10
        </div>
      </div>

      {/* Spicy Mode Toggle */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        marginBottom: "20px" 
      }}>
        <button
          onClick={() => setSpicyMode(!spicyMode)}
          style={{
            background: spicyMode 
              ? "linear-gradient(135deg, #ff6b6b, #ee5a24)"
              : "rgba(255, 255, 255, 0.1)",
            border: spicyMode ? "none" : "1px solid #333",
            padding: "10px 20px",
            borderRadius: "50px",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Flame size={16} color={spicyMode ? "#fff" : "#ff6b6b"} />
          {spicyMode ? "Spicy Mode ON" : "Enable Spicy Mode"}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          {mode === "select" || !mode ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#fff", fontSize: "28px", marginBottom: "10px" }}>
                  Choose Your Fate
                </h2>
                <p style={{ color: "#888" }}>What will it be?</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChoice("truth")}
                style={{
                  background: "linear-gradient(135deg, #3498db, #2980b9)",
                  border: "none",
                  borderRadius: "20px",
                  padding: "40px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "15px"
                }}
              >
                <Heart size={40} color="#fff" />
                <span style={{ color: "#fff", fontSize: "28px", fontWeight: "bold" }}>
                  TRUTH
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChoice("dare")}
                style={{
                  background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                  border: "none",
                  borderRadius: "20px",
                  padding: "40px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "15px"
                }}
              >
                <Zap size={40} color="#fff" />
                <span style={{ color: "#fff", fontSize: "28px", fontWeight: "bold" }}>
                  DARE
                </span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div style={{
                background: mode === "truth" 
                  ? "linear-gradient(135deg, #3498db20, #2980b920)"
                  : "linear-gradient(135deg, #e74c3c20, #c0392b20)",
                border: `2px solid ${mode === "truth" ? "#3498db" : "#e74c3c"}`,
                borderRadius: "20px",
                padding: "40px 30px",
                textAlign: "center"
              }}>
                <div style={{
                  display: "inline-block",
                  background: mode === "truth" ? "#3498db" : "#e74c3c",
                  padding: "8px 20px",
                  borderRadius: "50px",
                  marginBottom: "20px"
                }}>
                  <span style={{ color: "#fff", fontWeight: "bold", fontSize: "14px" }}>
                    {mode === "truth" ? "TRUTH" : "DARE"}
                  </span>
                </div>
                <h2 style={{ color: "#fff", fontSize: "24px", lineHeight: "1.4" }}>
                  {currentPrompt}
                </h2>
              </div>

              <div style={{ display: "flex", gap: "15px" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleComplete(false)}
                  style={{
                    flex: 1,
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid #333",
                    borderRadius: "15px",
                    padding: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px"
                  }}
                >
                  <X size={24} color="#e74c3c" />
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>Skip</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleComplete(true)}
                  style={{
                    flex: 2,
                    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                    border: "none",
                    borderRadius: "15px",
                    padding: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px"
                  }}
                >
                  <Check size={24} color="#fff" />
                  <span style={{ color: "#fff", fontWeight: "bold" }}>Completed!</span>
                </motion.button>
              </div>

              <button
                onClick={() => {
                  const prompt = getRandomPrompt(mode);
                  setCurrentPrompt(prompt);
                }}
                style={{
                  background: "none",
                  border: "1px solid #666",
                  borderRadius: "15px",
                  padding: "15px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}
              >
                <Shuffle size={20} color="#888" />
                <span style={{ color: "#888" }}>Get Different {mode === "truth" ? "Truth" : "Dare"}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
