import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Star, Timer, Check, Trophy, Zap } from "lucide-react";

interface CouplesChallengeProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
}

const CHALLENGES = [
  {
    title: "Compliment Chain",
    description: "Take turns giving each other compliments. First to run out loses!",
    duration: 60,
    points: 20,
    category: "sweet"
  },
  {
    title: "Staring Contest",
    description: "Look into each other's eyes without laughing or looking away!",
    duration: 30,
    points: 15,
    category: "fun"
  },
  {
    title: "Memory Lane",
    description: "Take turns sharing favorite memories together. Share at least 5!",
    duration: 120,
    points: 25,
    category: "sweet"
  },
  {
    title: "Dance Off",
    description: "Put on your favorite song and have a mini dance party together!",
    duration: 90,
    points: 20,
    category: "fun"
  },
  {
    title: "Gratitude Round",
    description: "Tell each other 3 things you're grateful for about them",
    duration: 60,
    points: 25,
    category: "sweet"
  },
  {
    title: "Impression Game",
    description: "Do your best impression of each other. Rate each other's accuracy!",
    duration: 60,
    points: 15,
    category: "fun"
  },
  {
    title: "Future Dreams",
    description: "Share one dream you want to achieve together",
    duration: 90,
    points: 20,
    category: "deep"
  },
  {
    title: "Song Dedication",
    description: "Pick a song that reminds you of your partner and explain why",
    duration: 120,
    points: 20,
    category: "sweet"
  },
  {
    title: "Nickname Creation",
    description: "Come up with 3 new cute nicknames for each other",
    duration: 60,
    points: 15,
    category: "fun"
  },
  {
    title: "Love Letter",
    description: "Write a short love note to each other (3 sentences minimum)",
    duration: 180,
    points: 30,
    category: "sweet"
  },
  {
    title: "Photo Recreation",
    description: "Find an old photo together and recreate it!",
    duration: 180,
    points: 25,
    category: "fun"
  },
  {
    title: "Bucket List",
    description: "Add 3 new items to your couples bucket list",
    duration: 120,
    points: 20,
    category: "deep"
  },
  {
    title: "Massage Time",
    description: "Give each other a 2-minute shoulder massage",
    duration: 240,
    points: 25,
    category: "sweet"
  },
  {
    title: "Trivia Time",
    description: "Ask each other 5 questions about yourselves. See who knows more!",
    duration: 120,
    points: 20,
    category: "fun"
  },
  {
    title: "Appreciation Speech",
    description: "Give a 30-second speech about why you love your partner",
    duration: 60,
    points: 25,
    category: "sweet"
  }
];

export default function CouplesChallenge({ onBack, onWin, userName }: CouplesChallengeProps) {
  const [currentChallenge, setCurrentChallenge] = useState<typeof CHALLENGES[0] | null>(null);
  const [usedChallenges, setUsedChallenges] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "sweet" | "fun" | "deep">("all");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const pickNewChallenge = () => {
    const filtered = selectedCategory === "all" 
      ? CHALLENGES 
      : CHALLENGES.filter(c => c.category === selectedCategory);
    
    const available = filtered
      .map((_, i) => CHALLENGES.indexOf(filtered[i]))
      .filter(i => !usedChallenges.includes(i));
    
    if (available.length === 0) {
      setShowResult(true);
      onWin(totalPoints);
      return;
    }
    
    const randomIndex = available[Math.floor(Math.random() * available.length)];
    setCurrentChallenge(CHALLENGES[randomIndex]);
    setUsedChallenges([...usedChallenges, randomIndex]);
    setTimeLeft(CHALLENGES[randomIndex].duration);
    setIsActive(false);
  };

  const startChallenge = () => {
    setIsActive(true);
  };

  const completeChallenge = (success: boolean) => {
    if (success && currentChallenge) {
      setCompletedChallenges(prev => prev + 1);
      setTotalPoints(prev => prev + currentChallenge.points);
    }
    
    if (completedChallenges + 1 >= 5) {
      setShowResult(true);
      onWin(totalPoints + (success && currentChallenge ? currentChallenge.points : 0));
    } else {
      setCurrentChallenge(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "sweet": return "#ff6b9d";
      case "fun": return "#f39c12";
      case "deep": return "#9b59b6";
      default: return "#39ff14";
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
          background: "linear-gradient(135deg, #ff6b9d20, #9b59b620)"
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <Trophy size={80} color="#ffd700" style={{ marginBottom: "20px" }} />
          <h1 style={{ color: "#ffd700", fontSize: "32px", marginBottom: "10px" }}>
            Challenge Complete!
          </h1>
          <p style={{ color: "#888", fontSize: "18px", marginBottom: "10px" }}>
            You completed {completedChallenges} challenges!
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginBottom: "30px" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                size={30} 
                color="#ffd700" 
                fill={i < completedChallenges ? "#ffd700" : "transparent"}
              />
            ))}
          </div>
          <div style={{
            background: "linear-gradient(135deg, #ffd700, #ff8c00)",
            padding: "15px 30px",
            borderRadius: "50px",
            marginBottom: "30px"
          }}>
            <span style={{ color: "#000", fontWeight: "bold", fontSize: "24px" }}>
              +{totalPoints} Points!
            </span>
          </div>
          <button
            onClick={onBack}
            style={{
              background: "linear-gradient(135deg, #ff6b9d, #9b59b6)",
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
        background: "linear-gradient(135deg, #ff6b9d10, #9b59b610)"
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
        <h1 style={{ color: "#ff6b9d", margin: 0, fontSize: "18px" }}>
          COUPLES CHALLENGE
        </h1>
        <div style={{
          background: "rgba(255, 107, 157, 0.2)",
          padding: "8px 16px",
          borderRadius: "20px",
          color: "#ff6b9d",
          fontWeight: "bold"
        }}>
          {completedChallenges}/5
        </div>
      </div>

      {/* Points Display */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center",
        marginBottom: "20px"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #ffd700, #ff8c00)",
          padding: "8px 20px",
          borderRadius: "50px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Zap size={18} color="#000" />
          <span style={{ color: "#000", fontWeight: "bold" }}>{totalPoints} pts</span>
        </div>
      </div>

      {/* Category Filter */}
      {!currentChallenge && (
        <div style={{ 
          display: "flex", 
          gap: "10px", 
          justifyContent: "center",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}>
          {["all", "sweet", "fun", "deep"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as any)}
              style={{
                background: selectedCategory === cat ? getCategoryColor(cat) : "rgba(255,255,255,0.1)",
                color: selectedCategory === cat ? "#000" : "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "50px",
                fontWeight: "bold",
                cursor: "pointer",
                textTransform: "capitalize",
                fontSize: "14px"
              }}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          {!currentChallenge ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: "center" }}
            >
              <Heart size={60} color="#ff6b9d" style={{ marginBottom: "20px" }} />
              <h2 style={{ color: "#fff", fontSize: "28px", marginBottom: "10px" }}>
                Ready for a Challenge?
              </h2>
              <p style={{ color: "#888", marginBottom: "30px" }}>
                Complete fun challenges together to earn points!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={pickNewChallenge}
                style={{
                  background: "linear-gradient(135deg, #ff6b9d, #9b59b6)",
                  border: "none",
                  borderRadius: "50px",
                  padding: "20px 50px",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#fff"
                }}
              >
                Get Challenge!
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="challenge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Challenge Card */}
              <div style={{
                background: `linear-gradient(135deg, ${getCategoryColor(currentChallenge.category)}20, transparent)`,
                border: `2px solid ${getCategoryColor(currentChallenge.category)}`,
                borderRadius: "20px",
                padding: "30px",
                textAlign: "center"
              }}>
                <div style={{
                  display: "inline-block",
                  background: getCategoryColor(currentChallenge.category),
                  padding: "6px 16px",
                  borderRadius: "50px",
                  marginBottom: "15px"
                }}>
                  <span style={{ color: "#000", fontWeight: "bold", fontSize: "12px", textTransform: "uppercase" }}>
                    {currentChallenge.category}
                  </span>
                </div>
                <h2 style={{ color: "#fff", fontSize: "28px", marginBottom: "15px" }}>
                  {currentChallenge.title}
                </h2>
                <p style={{ color: "#888", fontSize: "16px", marginBottom: "20px" }}>
                  {currentChallenge.description}
                </p>
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Timer size={18} color={getCategoryColor(currentChallenge.category)} />
                    <span style={{ color: getCategoryColor(currentChallenge.category), fontWeight: "bold" }}>
                      {formatTime(currentChallenge.duration)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Star size={18} color="#ffd700" />
                    <span style={{ color: "#ffd700", fontWeight: "bold" }}>
                      {currentChallenge.points} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Timer */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: timeLeft <= 10 ? "rgba(231, 76, 60, 0.2)" : "rgba(255, 255, 255, 0.1)",
                    borderRadius: "15px",
                    padding: "20px",
                    textAlign: "center"
                  }}
                >
                  <p style={{ color: "#888", marginBottom: "5px" }}>Time Remaining</p>
                  <p style={{ 
                    color: timeLeft <= 10 ? "#e74c3c" : "#fff", 
                    fontSize: "48px", 
                    fontWeight: "bold",
                    margin: 0
                  }}>
                    {formatTime(timeLeft)}
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              {!isActive ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startChallenge}
                  style={{
                    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                    border: "none",
                    borderRadius: "15px",
                    padding: "20px",
                    cursor: "pointer",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px"
                  }}
                >
                  <Timer size={24} />
                  Start Timer
                </motion.button>
              ) : (
                <div style={{ display: "flex", gap: "15px" }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => completeChallenge(false)}
                    style={{
                      flex: 1,
                      background: "rgba(231, 76, 60, 0.2)",
                      border: "2px solid #e74c3c",
                      borderRadius: "15px",
                      padding: "15px",
                      cursor: "pointer",
                      color: "#e74c3c",
                      fontWeight: "bold"
                    }}
                  >
                    Skip
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => completeChallenge(true)}
                    style={{
                      flex: 2,
                      background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                      border: "none",
                      borderRadius: "15px",
                      padding: "15px",
                      cursor: "pointer",
                      color: "#fff",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px"
                    }}
                  >
                    <Check size={20} />
                    Completed!
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
