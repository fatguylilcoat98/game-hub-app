import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Medal, Award } from "lucide-react";

interface GameLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  leaderboard: Record<string, number>;
  userName: string;
}

export default function GameLeaderboard({ isOpen, onClose, gameName, leaderboard, userName }: GameLeaderboardProps) {
  const sortedEntries = Object.entries(leaderboard)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy size={24} color="#ffd700" />;
      case 2: return <Medal size={24} color="#c0c0c0" />;
      case 3: return <Award size={24} color="#cd7f32" />;
      default: return <span style={{ color: "#666", fontWeight: "bold", width: "24px", textAlign: "center" }}>{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return "linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.05))";
      case 2: return "linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.05))";
      case 3: return "linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.05))";
      default: return "rgba(255, 255, 255, 0.03)";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            zIndex: 150,
            display: "flex",
            flexDirection: "column",
            padding: "20px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <div>
              <h2 style={{ color: "#39ff14", margin: 0, fontSize: "28px" }}>LEADERBOARD</h2>
              <p style={{ color: "#888", margin: "5px 0 0 0" }}>{gameName}</p>
            </div>
            <button 
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}
            >
              <X size={32} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", maxWidth: "500px", margin: "0 auto", width: "100%" }}>
            {sortedEntries.length === 0 ? (
              <div style={{ textAlign: "center", color: "#555", padding: "50px" }}>
                <Trophy size={64} style={{ opacity: 0.3, marginBottom: "20px" }} />
                <p>No scores yet! Be the first to play!</p>
              </div>
            ) : (
              sortedEntries.map(([name, score], idx) => {
                const rank = idx + 1;
                const isCurrentUser = name === userName;
                
                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      padding: "15px 20px",
                      background: getRankBg(rank),
                      borderRadius: "12px",
                      marginBottom: "10px",
                      border: isCurrentUser ? "2px solid #39ff14" : "1px solid rgba(255,255,255,0.1)"
                    }}
                  >
                    <div style={{ width: "40px", display: "flex", justifyContent: "center" }}>
                      {getRankIcon(rank)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        color: isCurrentUser ? "#39ff14" : "#fff", 
                        fontWeight: "bold",
                        fontSize: "18px"
                      }}>
                        {name} {isCurrentUser && "(You)"}
                      </div>
                    </div>
                    <div style={{ 
                      color: rank <= 3 ? "#ffd700" : "#39ff14",
                      fontWeight: "bold",
                      fontSize: "20px"
                    }}>
                      {score} pts
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
