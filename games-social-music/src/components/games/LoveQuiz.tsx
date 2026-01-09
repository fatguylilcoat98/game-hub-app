import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Star, Check, X, Sparkles } from "lucide-react";

interface LoveQuizProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
}

const QUIZ_QUESTIONS = [
  {
    question: "What's my favorite color?",
    type: "text"
  },
  {
    question: "What's my go-to comfort food?",
    type: "text"
  },
  {
    question: "What's my biggest pet peeve?",
    type: "text"
  },
  {
    question: "What's my dream vacation destination?",
    type: "text"
  },
  {
    question: "What's my favorite movie genre?",
    type: "text"
  },
  {
    question: "What's my love language?",
    type: "choice",
    options: ["Words of Affirmation", "Quality Time", "Physical Touch", "Acts of Service", "Receiving Gifts"]
  },
  {
    question: "What makes me laugh the most?",
    type: "text"
  },
  {
    question: "What's my favorite way to relax?",
    type: "text"
  },
  {
    question: "What's my biggest dream?",
    type: "text"
  },
  {
    question: "What's my favorite thing about you?",
    type: "text"
  },
  {
    question: "What's my ideal date night?",
    type: "text"
  },
  {
    question: "What's my favorite season?",
    type: "choice",
    options: ["Spring", "Summer", "Fall", "Winter"]
  },
  {
    question: "What's my favorite music genre?",
    type: "text"
  },
  {
    question: "What's my hidden talent?",
    type: "text"
  },
  {
    question: "What's my biggest fear?",
    type: "text"
  },
  {
    question: "What's my favorite thing to do together?",
    type: "text"
  },
  {
    question: "What's my morning routine like?",
    type: "choice",
    options: ["Early Bird", "Night Owl", "Depends on the Day"]
  },
  {
    question: "What's my favorite snack?",
    type: "text"
  },
  {
    question: "What cheers me up when I'm sad?",
    type: "text"
  },
  {
    question: "What's my favorite memory of us?",
    type: "text"
  }
];

export default function LoveQuiz({ onBack, onWin, userName }: LoveQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<typeof QUIZ_QUESTIONS>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [partnerAnswer, setPartnerAnswer] = useState("");

  useEffect(() => {
    // Shuffle and pick 10 random questions
    const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 10));
  }, []);

  const handleSubmit = () => {
    // Simulate partner's answer
    const simulatedAnswers = [
      "Blue", "Pizza", "Being late", "Paris", "Comedy",
      "Quality Time", "Your jokes", "Reading", "Travel the world",
      "Your smile", "Dinner and a movie", "Fall", "Pop",
      "Cooking", "Spiders", "Watching movies", "Night Owl",
      "Chocolate", "Hugs", "Our first date"
    ];
    setPartnerAnswer(simulatedAnswers[Math.floor(Math.random() * simulatedAnswers.length)]);
    setShowAnswer(true);
  };

  const handleRate = (correct: boolean) => {
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    if (currentQuestion + 1 >= questions.length) {
      setGameComplete(true);
      onWin((score + (correct ? 1 : 0)) * 20);
    } else {
      setCurrentQuestion(prev => prev + 1);
      setAnswer("");
      setSelectedOption(null);
      setShowAnswer(false);
      setPartnerAnswer("");
    }
  };

  if (questions.length === 0) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Heart size={40} color="#e91e63" />
        </motion.div>
      </div>
    );
  }

  if (gameComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "";
    let emoji = "";
    
    if (percentage >= 80) {
      message = "You know each other so well!";
      emoji = "💕";
    } else if (percentage >= 60) {
      message = "Pretty good! Keep learning about each other!";
      emoji = "💖";
    } else if (percentage >= 40) {
      message = "There's more to discover!";
      emoji = "💝";
    } else {
      message = "Time for more date nights!";
      emoji = "💗";
    }

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
          background: "linear-gradient(135deg, #e91e6320, #9c27b020)"
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <div style={{ fontSize: "80px", marginBottom: "20px" }}>{emoji}</div>
          <h1 style={{ color: "#e91e63", fontSize: "32px", marginBottom: "10px" }}>
            Quiz Complete!
          </h1>
          <p style={{ color: "#fff", fontSize: "48px", fontWeight: "bold", marginBottom: "10px" }}>
            {score}/{questions.length}
          </p>
          <p style={{ color: "#888", fontSize: "18px", marginBottom: "30px" }}>
            {message}
          </p>
          <div style={{
            background: "linear-gradient(135deg, #ffd700, #ff8c00)",
            padding: "15px 30px",
            borderRadius: "50px",
            marginBottom: "30px"
          }}>
            <span style={{ color: "#000", fontWeight: "bold", fontSize: "24px" }}>
              +{score * 20} Points!
            </span>
          </div>
          <button
            onClick={onBack}
            style={{
              background: "#e91e63",
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

  const question = questions[currentQuestion];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        background: "linear-gradient(135deg, #e91e6310, #9c27b010)"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#e91e63",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={24} /> BACK
        </button>
        <h1 style={{ color: "#e91e63", margin: 0, fontSize: "20px" }}>
          LOVE QUIZ
        </h1>
        <div style={{
          background: "rgba(233, 30, 99, 0.2)",
          padding: "8px 16px",
          borderRadius: "20px",
          color: "#e91e63",
          fontWeight: "bold"
        }}>
          {currentQuestion + 1}/{questions.length}
        </div>
      </div>

      {/* Score */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "5px",
        marginBottom: "20px"
      }}>
        {Array.from({ length: questions.length }).map((_, i) => (
          <Star 
            key={i} 
            size={20} 
            color="#e91e63" 
            fill={i < score ? "#e91e63" : "transparent"}
          />
        ))}
      </div>

      {/* Question */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          {!showAnswer ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div style={{
                background: "rgba(233, 30, 99, 0.1)",
                border: "2px solid rgba(233, 30, 99, 0.3)",
                borderRadius: "20px",
                padding: "30px",
                textAlign: "center"
              }}>
                <Sparkles size={32} color="#e91e63" style={{ marginBottom: "15px" }} />
                <h2 style={{ color: "#fff", fontSize: "24px", marginBottom: "10px" }}>
                  About Your Partner:
                </h2>
                <p style={{ color: "#e91e63", fontSize: "20px" }}>
                  {question.question}
                </p>
              </div>

              {question.type === "text" ? (
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(233, 30, 99, 0.3)",
                    borderRadius: "15px",
                    padding: "20px",
                    color: "#fff",
                    fontSize: "18px",
                    textAlign: "center"
                  }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {question.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelectedOption(option)}
                      style={{
                        background: selectedOption === option 
                          ? "linear-gradient(135deg, #e91e63, #9c27b0)"
                          : "rgba(255, 255, 255, 0.1)",
                        border: selectedOption === option 
                          ? "2px solid #e91e63"
                          : "2px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "15px",
                        padding: "15px",
                        color: "#fff",
                        fontSize: "16px",
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={question.type === "text" ? !answer : !selectedOption}
                style={{
                  background: (question.type === "text" ? answer : selectedOption)
                    ? "linear-gradient(135deg, #e91e63, #9c27b0)"
                    : "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  borderRadius: "15px",
                  padding: "20px",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: (question.type === "text" ? answer : selectedOption) ? "pointer" : "not-allowed",
                  opacity: (question.type === "text" ? answer : selectedOption) ? 1 : 0.5
                }}
              >
                Submit Answer
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="answer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div style={{
                background: "rgba(233, 30, 99, 0.1)",
                border: "2px solid rgba(233, 30, 99, 0.3)",
                borderRadius: "20px",
                padding: "30px",
                textAlign: "center"
              }}>
                <p style={{ color: "#888", marginBottom: "10px" }}>Your answer:</p>
                <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
                  {question.type === "text" ? answer : selectedOption}
                </p>
                <p style={{ color: "#888", marginBottom: "10px" }}>Partner's answer:</p>
                <p style={{ color: "#e91e63", fontSize: "24px", fontWeight: "bold" }}>
                  {partnerAnswer}
                </p>
              </div>

              <p style={{ color: "#888", textAlign: "center" }}>
                Did you get it right?
              </p>

              <div style={{ display: "flex", gap: "15px" }}>
                <button
                  onClick={() => handleRate(false)}
                  style={{
                    flex: 1,
                    background: "rgba(231, 76, 60, 0.2)",
                    border: "2px solid #e74c3c",
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
                  <span style={{ color: "#e74c3c", fontWeight: "bold" }}>Wrong</span>
                </button>

                <button
                  onClick={() => handleRate(true)}
                  style={{
                    flex: 1,
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
                  <span style={{ color: "#fff", fontWeight: "bold" }}>Correct!</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
