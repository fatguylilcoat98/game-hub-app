import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Brain, Grid3X3, Circle, Crown, Dices, Type, Users, Heart, MessageCircle, Flame, Hand, Zap } from "lucide-react";

interface GameMenuProps {
  onBack: () => void;
  onSelectGame: (game: string) => void;
  onOpenMultiplayer: () => void;
  leaderboards: Record<string, Record<string, number>>;
  userName: string;
}

const ARCADE_GAMES = [
  { id: "trivia", name: "TRIVIA", icon: Brain, color: "#ff00ff", desc: "Test your knowledge!", multiplayer: true },
  { id: "tictactoe", name: "TIC TAC TOE", icon: Grid3X3, color: "#00ffff", desc: "Classic X vs O", multiplayer: true },
  { id: "connect4", name: "CONNECT FOUR", icon: Circle, color: "#ffff00", desc: "Get 4 in a row!", multiplayer: true },
  { id: "checkers", name: "CHECKERS", icon: Crown, color: "#ff6600", desc: "Jump to victory!", multiplayer: true },
  { id: "yahtzee", name: "YAHTZEE", icon: Dices, color: "#ff0066", desc: "Roll the dice!", multiplayer: true },
  { id: "scrabble", name: "WORD BUILDER", icon: Type, color: "#66ff00", desc: "Build words!", multiplayer: true },
];

const COUPLES_GAMES = [
  { id: "wouldyourather", name: "WOULD YOU RATHER", icon: MessageCircle, color: "#ff6b9d", desc: "Romantic choices!", multiplayer: false },
  { id: "truthordare", name: "TRUTH OR DARE", icon: Flame, color: "#9b59b6", desc: "Spicy challenges!", multiplayer: false },
  { id: "lovequiz", name: "LOVE QUIZ", icon: Heart, color: "#e91e63", desc: "How well do you know each other?", multiplayer: false },
  { id: "neverhaveiever", name: "NEVER HAVE I EVER", icon: Hand, color: "#f39c12", desc: "Share your secrets!", multiplayer: false },
  { id: "coupleschallenge", name: "COUPLES CHALLENGE", icon: Zap, color: "#00bcd4", desc: "Fun timed challenges!", multiplayer: false },
];

export default function GameMenu({ onBack, onSelectGame, onOpenMultiplayer, leaderboards, userName }: GameMenuProps) {
  const [activeTab, setActiveTab] = React.useState<"arcade" | "couples">("couples");
  
  const getTopPlayer = (gameId: string) => {
    const lb = leaderboards[gameId];
    if (!lb || Object.keys(lb).length === 0) return null;
    const sorted = Object.entries(lb).sort((a, b) => b[1] - a[1]);
    return sorted[0];
  };

  const getUserRank = (gameId: string) => {
    const lb = leaderboards[gameId];
    if (!lb || !lb[userName]) return null;
    const sorted = Object.entries(lb).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([name]) => name === userName) + 1;
    return { rank, score: lb[userName] };
  };

  const GAMES = activeTab === "arcade" ? ARCADE_GAMES : COUPLES_GAMES;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ 
        height: "100vh", 
        background: "transparent", 
        padding: "20px",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button 
          onClick={onBack} 
          style={{ 
            background: "none", 
            border: "none", 
            color: "#39ff14", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={24} /> BACK
        </button>
        <h1 style={{ 
          color: "#39ff14", 
          margin: 0, 
          fontSize: "28px",
          fontWeight: "900",
          letterSpacing: "4px"
        }}>
          GAMES
        </h1>
        <div style={{ width: "80px" }} />
      </div>

      {/* Tab Switcher */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "20px",
        background: "rgba(0,0,0,0.5)",
        padding: "5px",
        borderRadius: "50px"
      }}>
        <button
          onClick={() => setActiveTab("couples")}
          style={{
            flex: 1,
            background: activeTab === "couples" 
              ? "linear-gradient(135deg, #ff6b9d, #c44569)" 
              : "transparent",
            border: "none",
            borderRadius: "50px",
            padding: "12px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <Heart size={18} color={activeTab === "couples" ? "#fff" : "#ff6b9d"} />
          <span style={{ 
            color: activeTab === "couples" ? "#fff" : "#ff6b9d", 
            fontWeight: "bold",
            fontSize: "14px"
          }}>
            COUPLES
          </span>
        </button>
        <button
          onClick={() => setActiveTab("arcade")}
          style={{
            flex: 1,
            background: activeTab === "arcade" 
              ? "linear-gradient(135deg, #39ff14, #00cc00)" 
              : "transparent",
            border: "none",
            borderRadius: "50px",
            padding: "12px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <Brain size={18} color={activeTab === "arcade" ? "#000" : "#39ff14"} />
          <span style={{ 
            color: activeTab === "arcade" ? "#000" : "#39ff14", 
            fontWeight: "bold",
            fontSize: "14px"
          }}>
            ARCADE
          </span>
        </button>
      </div>

      {/* Multiplayer Button - only show for arcade games */}
      {activeTab === "arcade" && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenMultiplayer}
          style={{
            background: "linear-gradient(135deg, #ff00ff, #00ffff)",
            border: "none",
            borderRadius: "15px",
            padding: "15px 25px",
            marginBottom: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px"
          }}
        >
          <Users size={24} color="#fff" />
          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "18px" }}>
            MULTIPLAYER LOBBY
          </span>
          <span style={{ 
            background: "rgba(255,255,255,0.2)", 
            padding: "4px 10px", 
            borderRadius: "20px",
            fontSize: "12px",
            color: "#fff"
          }}>
            Play with Friends!
          </span>
        </motion.button>
      )}

      {/* Couples Games Header */}
      {activeTab === "couples" && (
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 107, 157, 0.2), rgba(196, 69, 105, 0.1))",
          borderRadius: "15px",
          padding: "15px",
          marginBottom: "20px",
          textAlign: "center",
          border: "1px solid rgba(255, 107, 157, 0.3)"
        }}>
          <p style={{ color: "#ff6b9d", margin: 0, fontSize: "14px" }}>
            💕 Play these games together with your partner for quality time!
          </p>
        </div>
      )}

      <div style={{ 
        flex: 1, 
        overflowY: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
        padding: "10px"
      }}>
        {GAMES.map((game, idx) => {
          const Icon = game.icon;
          const topPlayer = getTopPlayer(game.id);
          const userRank = getUserRank(game.id);

          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.03, boxShadow: `0 0 30px ${game.color}40` }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectGame(game.id)}
              style={{
                background: `linear-gradient(135deg, ${game.color}20, #111)`,
                border: `2px solid ${game.color}40`,
                borderRadius: "20px",
                padding: "25px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}
            >
              <div style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "100px",
                height: "100px",
                background: `radial-gradient(circle, ${game.color}20, transparent)`,
                borderRadius: "50%"
              }} />

              {/* Multiplayer badge */}
              {game.multiplayer && (
                <div style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "linear-gradient(135deg, #ff00ff, #00ffff)",
                  padding: "4px 8px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <Users size={12} /> 2P
                </div>
              )}

              {/* Couples badge */}
              {!game.multiplayer && activeTab === "couples" && (
                <div style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "linear-gradient(135deg, #ff6b9d, #c44569)",
                  padding: "4px 8px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <Heart size={12} /> COUPLES
                </div>
              )}

              {/* Centered icon and info */}
              <div style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: `${game.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "15px"
              }}>
                <Icon size={36} color={game.color} />
              </div>
              
              <h3 style={{ color: "#fff", margin: "0 0 8px 0", fontSize: "22px", fontWeight: "bold" }}>{game.name}</h3>
              <p style={{ color: "#888", margin: "0 0 15px 0", fontSize: "14px" }}>{game.desc}</p>

              <div style={{ 
                background: "rgba(0,0,0,0.3)", 
                borderRadius: "10px", 
                padding: "12px",
                width: "100%"
              }}>
                {topPlayer ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <Trophy size={16} color="#ffd700" />
                    <span style={{ color: "#ffd700", fontSize: "13px" }}>
                      {topPlayer[0]}: {topPlayer[1]} pts
                    </span>
                  </div>
                ) : (
                  <span style={{ color: "#555", fontSize: "13px" }}>No scores yet!</span>
                )}
                {userRank && (
                  <div style={{ color: "#39ff14", fontSize: "12px", marginTop: "5px" }}>
                    Your rank: #{userRank.rank} ({userRank.score} pts)
                  </div>
                )}
              </div>

              <div style={{
                marginTop: "15px",
                color: game.color,
                fontSize: "14px",
                fontWeight: "bold"
              }}>
                PLAY →
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
