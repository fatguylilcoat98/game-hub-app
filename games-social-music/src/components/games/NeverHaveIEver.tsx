import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Hand, ThumbsUp, ThumbsDown, Shuffle, Flame } from "lucide-react";

interface NeverHaveIEverProps {
  onBack: () => void;
  onWin: (score: number) => void;
  userName: string;
}

const STATEMENTS = [
  "Never have I ever said 'I love you' first",
  "Never have I ever written a love letter",
  "Never have I ever planned a surprise date",
  "Never have I ever cooked a romantic dinner",
  "Never have I ever slow danced in the kitchen",
  "Never have I ever stayed up all night talking",
  "Never have I ever given someone a pet name",
  "Never have I ever watched a sunrise together",
  "Never have I ever gone on a spontaneous trip",
  "Never have I ever made a playlist for someone",
  "Never have I ever cried during a romantic movie",
  "Never have I ever sent a good morning text every day",
  "Never have I ever kept a relationship secret",
  "Never have I ever been on a double date",
  "Never have I ever had a long-distance relationship",
  "Never have I ever forgotten an anniversary",
  "Never have I ever given flowers for no reason",
  "Never have I ever written a poem for someone",
  "Never have I ever serenaded someone",
  "Never have I ever had a picnic date"
];

const SPICY_STATEMENTS = [
  "Never have I ever had a dream about my partner",
  "Never have I ever been caught kissing",
  "Never have I ever sent a flirty text to the wrong person",
  "Never have I ever had a crush on a friend's partner",
  "Never have I ever kissed on the first date",
  "Never have I ever been jealous of an ex",
  "Never have I ever stalked someone's social media",
  "Never have I ever pretended to like something for my partner"
];

export default function NeverHaveIEver({ onBack, onWin, userName }: NeverHaveIEverProps) {
  const [currentStatement, setCurrentStatement] = useState(0);
  const [usedStatements, setUsedStatements] = useState<number[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [spicyMode, setSpicyMode] = useState(false);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [myChoice, setMyChoice] = useState<boolean | null>(null);
  const [partnerChoice, setPartnerChoice] = useState<boolean | null>(null);

  const allStatements = spicyMode ? [...STATEMENTS, ...SPICY_STATEMENTS] : STATEMENTS;

  const pickNewStatement = () => {
    const available = allStatements.map((_, i) => i).filter(i => !usedStatements.includes(i));
    if (available.length === 0) {
      setShowResult(true);
      onWin((myScore + partnerScore) * 5);
      return;
    }
    const randomIndex = available[Math.floor(Math.random() * available.length)];
    setCurrentStatement(randomIndex);
    setUsedStatements([...usedStatements, randomIndex]);
    setMyChoice(null);
    setPartnerChoice(null);
    setWaitingForPartner(false);
  };

  const handleChoice = (iHaveDone: boolean) => {
    setMyChoice(iHaveDone);
    setWaitingForPartner(true);

    // Simulate partner response
    setTimeout(() => {
      const partnerDone = Math.random() > 0.5;
      setPartnerChoice(partnerDone);
      
      if (iHaveDone) setMyScore(prev => prev + 1);
      if (partnerDone) setPartnerScore(prev => prev + 1);
      
      setWaitingForPartner(false);
      
      // Auto advance after showing results
      setTimeout(() => {
        if (round >= 10) {
          setShowResult(true);
          onWin((myScore + partnerScore + (iHaveDone ? 1 : 0) + (partnerDone ? 1 : 0)) * 5);
        } else {
          setRound(prev => prev + 1);
          pickNewStatement();
        }
      }, 2000);
    }, 1000 + Math.random() * 1000);
  };

  React.useEffect(() => {
    pickNewStatement();
  }, []);

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
          background: "linear-gradient(135deg, #f39c1220, #e74c3c20)"
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <Hand size={80} color="#f39c12" style={{ marginBottom: "20px" }} />
          <h1 style={{ color: "#f39c12", fontSize: "32px", marginBottom: "20px" }}>
            Game Complete!
          </h1>
          
          <div style={{ 
            display: "flex", 
            gap: "30px", 
            justifyContent: "center",
            marginBottom: "30px"
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#888", marginBottom: "5px" }}>You</p>
              <p style={{ color: "#f39c12", fontSize: "48px", fontWeight: "bold" }}>{myScore}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#888", marginBottom: "5px" }}>Partner</p>
              <p style={{ color: "#e74c3c", fontSize: "48px", fontWeight: "bold" }}>{partnerScore}</p>
            </div>
          </div>

          <p style={{ color: "#888", fontSize: "16px", marginBottom: "30px" }}>
            {myScore > partnerScore 
              ? "You've done more! You're the adventurous one!" 
              : myScore < partnerScore 
                ? "Your partner has done more! They're the adventurous one!"
                : "You're equally adventurous!"}
          </p>

          <div style={{
            background: "linear-gradient(135deg, #ffd700, #ff8c00)",
            padding: "15px 30px",
            borderRadius: "50px",
            marginBottom: "30px"
          }}>
            <span style={{ color: "#000", fontWeight: "bold", fontSize: "24px" }}>
              +{(myScore + partnerScore) * 5} Points!
            </span>
          </div>

          <button
            onClick={onBack}
            style={{
              background: "#f39c12",
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
        background: "linear-gradient(135deg, #f39c1210, #e74c3c10)"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#f39c12",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={24} /> BACK
        </button>
        <h1 style={{ color: "#f39c12", margin: 0, fontSize: "18px" }}>
          NEVER HAVE I EVER
        </h1>
        <div style={{
          background: "rgba(243, 156, 18, 0.2)",
          padding: "8px 16px",
          borderRadius: "20px",
          color: "#f39c12",
          fontWeight: "bold"
        }}>
          {round}/10
        </div>
      </div>

      {/* Spicy Mode Toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
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

      {/* Scores */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "40px",
        marginBottom: "30px"
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#888", fontSize: "12px", marginBottom: "5px" }}>You</p>
          <p style={{ color: "#f39c12", fontSize: "32px", fontWeight: "bold", margin: 0 }}>{myScore}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#888", fontSize: "12px", marginBottom: "5px" }}>Partner</p>
          <p style={{ color: "#e74c3c", fontSize: "32px", fontWeight: "bold", margin: 0 }}>{partnerScore}</p>
        </div>
      </div>

      {/* Statement */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "20px" }}>
        <motion.div
          key={currentStatement}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(243, 156, 18, 0.1)",
            border: "2px solid rgba(243, 156, 18, 0.3)",
            borderRadius: "20px",
            padding: "40px 30px",
            textAlign: "center"
          }}
        >
          <Hand size={40} color="#f39c12" style={{ marginBottom: "20px" }} />
          <h2 style={{ color: "#fff", fontSize: "24px", lineHeight: "1.4" }}>
            {allStatements[currentStatement]}
          </h2>
        </motion.div>

        {/* Choices */}
        {myChoice === null ? (
          <div style={{ display: "flex", gap: "15px" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChoice(true)}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                border: "none",
                borderRadius: "20px",
                padding: "25px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <ThumbsDown size={32} color="#fff" style={{ transform: "rotate(180deg)" }} />
              <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>
                I Have!
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChoice(false)}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                border: "none",
                borderRadius: "20px",
                padding: "25px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <ThumbsDown size={32} color="#fff" />
              <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>
                Never!
              </span>
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px"
            }}
          >
            {/* Your choice */}
            <div style={{
              background: myChoice ? "rgba(39, 174, 96, 0.2)" : "rgba(231, 76, 60, 0.2)",
              border: `2px solid ${myChoice ? "#27ae60" : "#e74c3c"}`,
              borderRadius: "15px",
              padding: "15px 20px",
              display: "flex",
              alignItems: "center",
              gap: "15px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: myChoice ? "#27ae60" : "#e74c3c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {myChoice ? <ThumbsUp size={20} color="#fff" /> : <ThumbsDown size={20} color="#fff" />}
              </div>
              <div>
                <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>You</p>
                <p style={{ color: "#fff", fontWeight: "bold", margin: 0 }}>
                  {myChoice ? "I have done this!" : "Never done this!"}
                </p>
              </div>
            </div>

            {/* Partner's choice */}
            {waitingForPartner ? (
              <div style={{
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "15px",
                padding: "15px 20px",
                textAlign: "center"
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ display: "inline-block", marginRight: "10px" }}
                >
                  <Shuffle size={16} color="#f39c12" />
                </motion.div>
                <span style={{ color: "#888" }}>Waiting for partner...</span>
              </div>
            ) : partnerChoice !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: partnerChoice ? "rgba(39, 174, 96, 0.2)" : "rgba(231, 76, 60, 0.2)",
                  border: `2px solid ${partnerChoice ? "#27ae60" : "#e74c3c"}`,
                  borderRadius: "15px",
                  padding: "15px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px"
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: partnerChoice ? "#27ae60" : "#e74c3c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {partnerChoice ? <ThumbsUp size={20} color="#fff" /> : <ThumbsDown size={20} color="#fff" />}
                </div>
                <div>
                  <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>Partner</p>
                  <p style={{ color: "#fff", fontWeight: "bold", margin: 0 }}>
                    {partnerChoice ? "Has done this!" : "Never done this!"}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
