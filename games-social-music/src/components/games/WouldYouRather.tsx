import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Sparkles, RefreshCw, Users } from "lucide-react";

interface WouldYouRatherProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
}

const COUPLES_QUESTIONS = [
  {
    optionA: "Go on a surprise trip planned by your partner",
    optionB: "Plan a surprise trip for your partner"
  },
  {
    optionA: "Have a cozy movie night at home",
    optionB: "Go out for a fancy dinner date"
  },
  {
    optionA: "Receive a handwritten love letter",
    optionB: "Receive a surprise gift"
  },
  {
    optionA: "Cook dinner together every night",
    optionB: "Take turns cooking for each other"
  },
  {
    optionA: "Have breakfast in bed every weekend",
    optionB: "Go out for brunch every weekend"
  },
  {
    optionA: "Always know what your partner is thinking",
    optionB: "Always know what your partner is feeling"
  },
  {
    optionA: "Travel the world together",
    optionB: "Build your dream home together"
  },
  {
    optionA: "Have a partner who's always romantic",
    optionB: "Have a partner who's always funny"
  },
  {
    optionA: "Get matching tattoos",
    optionB: "Get matching jewelry"
  },
  {
    optionA: "Have a beach wedding",
    optionB: "Have a mountain wedding"
  },
  {
    optionA: "Slow dance in the kitchen",
    optionB: "Stargaze on the roof"
  },
  {
    optionA: "Write a song together",
    optionB: "Paint a picture together"
  },
  {
    optionA: "Have a partner who gives amazing massages",
    optionB: "Have a partner who's an amazing cook"
  },
  {
    optionA: "Cuddle while watching the sunrise",
    optionB: "Cuddle while watching the sunset"
  },
  {
    optionA: "Go on a road trip with no destination",
    optionB: "Go on a perfectly planned vacation"
  },
  {
    optionA: "Have your partner sing you to sleep",
    optionB: "Have your partner read you stories"
  },
  {
    optionA: "Share all your passwords",
    optionB: "Have some privacy in your relationship"
  },
  {
    optionA: "Be with someone who texts you constantly",
    optionB: "Be with someone who calls you once a day"
  },
  {
    optionA: "Have a partner who's always early",
    optionB: "Have a partner who's always fashionably late"
  },
  {
    optionA: "Spend Valentine's Day at home",
    optionB: "Spend Valentine's Day traveling"
  }
];

export default function WouldYouRather({ onBack, onWin, userName }: WouldYouRatherProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState<number[]>([]);
  const [waitingForPartner, setWaitingForPartner] = useState(false);

  useEffect(() => {
    // Shuffle and pick a random question
    pickNewQuestion();
  }, []);

  const pickNewQuestion = () => {
    const available = COUPLES_QUESTIONS.map((_, i) => i).filter(i => !usedQuestions.includes(i));
    if (available.length === 0) {
      // All questions used, show final result
      setShowResult(true);
      onWin(questionsAnswered * 10);
      return;
    }
    const randomIndex = available[Math.floor(Math.random() * available.length)];
    setCurrentQuestion(randomIndex);
    setUsedQuestions([...usedQuestions, randomIndex]);
    setSelectedOption(null);
    setWaitingForPartner(false);
  };

  const handleSelect = (option: "A" | "B") => {
    setSelectedOption(option);
    setWaitingForPartner(true);
    
    // Simulate partner response after 1-2 seconds
    setTimeout(() => {
      setQuestionsAnswered(prev => prev + 1);
      setWaitingForPartner(false);
      
      // Auto advance after showing result
      setTimeout(() => {
        if (questionsAnswered + 1 >= 10) {
          setShowResult(true);
          onWin((questionsAnswered + 1) * 10);
        } else {
          pickNewQuestion();
        }
      }, 1500);
    }, 1000 + Math.random() * 1000);
  };

  const question = COUPLES_QUESTIONS[currentQuestion];

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
          background: "linear-gradient(135deg, #ff6b9d20, #c4456920)"
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <Heart size={80} color="#ff6b9d" fill="#ff6b9d" style={{ marginBottom: "20px" }} />
          <h1 style={{ color: "#ff6b9d", fontSize: "32px", marginBottom: "10px" }}>
            Great Conversation!
          </h1>
          <p style={{ color: "#888", fontSize: "18px", marginBottom: "30px" }}>
            You answered {questionsAnswered} questions together!
          </p>
          <div style={{
            background: "linear-gradient(135deg, #ffd700, #ff8c00)",
            padding: "15px 30px",
            borderRadius: "50px",
            marginBottom: "30px"
          }}>
            <span style={{ color: "#000", fontWeight: "bold", fontSize: "24px" }}>
              +{questionsAnswered * 10} Points!
            </span>
          </div>
          <button
            onClick={onBack}
            style={{
              background: "#ff6b9d",
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
        background: "linear-gradient(135deg, #ff6b9d10, #c4456910)"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#ff6b9d",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={24} /> BACK
        </button>
        <h1 style={{ color: "#ff6b9d", margin: 0, fontSize: "20px" }}>
          WOULD YOU RATHER
        </h1>
        <div style={{
          background: "rgba(255, 107, 157, 0.2)",
          padding: "8px 16px",
          borderRadius: "20px",
          color: "#ff6b9d",
          fontWeight: "bold"
        }}>
          {questionsAnswered}/10
        </div>
      </div>

      {/* Question Card */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "20px" }}>
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(255, 107, 157, 0.1)",
            borderRadius: "20px",
            padding: "30px",
            textAlign: "center",
            border: "2px solid rgba(255, 107, 157, 0.3)"
          }}
        >
          <Sparkles size={32} color="#ff6b9d" style={{ marginBottom: "15px" }} />
          <h2 style={{ color: "#fff", fontSize: "24px", marginBottom: "10px" }}>
            Would You Rather...
          </h2>
        </motion.div>

        {/* Options */}
        <motion.button
          whileHover={{ scale: selectedOption ? 1 : 1.02 }}
          whileTap={{ scale: selectedOption ? 1 : 0.98 }}
          onClick={() => !selectedOption && handleSelect("A")}
          style={{
            background: selectedOption === "A" 
              ? "linear-gradient(135deg, #ff6b9d, #c44569)"
              : "rgba(255, 107, 157, 0.15)",
            border: selectedOption === "A" 
              ? "2px solid #ff6b9d"
              : "2px solid rgba(255, 107, 157, 0.3)",
            borderRadius: "20px",
            padding: "25px",
            cursor: selectedOption ? "default" : "pointer",
            textAlign: "left"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: selectedOption === "A" ? "#fff" : "rgba(255, 107, 157, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: selectedOption === "A" ? "#ff6b9d" : "#ff6b9d"
            }}>
              A
            </div>
            <span style={{ color: "#fff", fontSize: "18px", flex: 1 }}>
              {question.optionA}
            </span>
          </div>
        </motion.button>

        <div style={{ textAlign: "center", color: "#666", fontWeight: "bold" }}>OR</div>

        <motion.button
          whileHover={{ scale: selectedOption ? 1 : 1.02 }}
          whileTap={{ scale: selectedOption ? 1 : 0.98 }}
          onClick={() => !selectedOption && handleSelect("B")}
          style={{
            background: selectedOption === "B" 
              ? "linear-gradient(135deg, #ff6b9d, #c44569)"
              : "rgba(255, 107, 157, 0.15)",
            border: selectedOption === "B" 
              ? "2px solid #ff6b9d"
              : "2px solid rgba(255, 107, 157, 0.3)",
            borderRadius: "20px",
            padding: "25px",
            cursor: selectedOption ? "default" : "pointer",
            textAlign: "left"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: selectedOption === "B" ? "#fff" : "rgba(255, 107, 157, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: selectedOption === "B" ? "#ff6b9d" : "#ff6b9d"
            }}>
              B
            </div>
            <span style={{ color: "#fff", fontSize: "18px", flex: 1 }}>
              {question.optionB}
            </span>
          </div>
        </motion.button>

        {/* Waiting for partner indicator */}
        {waitingForPartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              padding: "15px",
              background: "rgba(255, 107, 157, 0.1)",
              borderRadius: "15px"
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-block", marginRight: "10px" }}
            >
              <RefreshCw size={16} color="#ff6b9d" />
            </motion.div>
            <span style={{ color: "#ff6b9d" }}>Waiting for your partner's answer...</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
