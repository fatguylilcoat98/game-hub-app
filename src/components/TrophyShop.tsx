import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Sparkles, Zap, Gift, Send, Star, Coffee, Moon, Sun, Music, Camera, Plane, Pizza, IceCream, Flower2, Crown, Gem } from "lucide-react";

interface TrophyShopProps {
  isOpen: boolean;
  onClose: () => void;
  trophyPoints: number;
  onPurchase: (item: RewardItem) => void;
  partnerName?: string;
}

export interface RewardItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  category: "loving" | "funny" | "mean" | "datenight" | "special";
  animation: string;
}

const REWARDS: RewardItem[] = [
  // Loving
  { id: "hug", name: "Send a Hug", emoji: "🤗", cost: 5, category: "loving", animation: "hug" },
  { id: "kiss", name: "Blow a Kiss", emoji: "😘", cost: 5, category: "loving", animation: "kiss" },
  { id: "heart", name: "Send Love", emoji: "💝", cost: 3, category: "loving", animation: "heart" },
  { id: "rose", name: "Give a Rose", emoji: "🌹", cost: 8, category: "loving", animation: "rose" },
  { id: "chocolate", name: "Gift Chocolate", emoji: "🍫", cost: 10, category: "loving", animation: "chocolate" },
  { id: "cuddle", name: "Virtual Cuddle", emoji: "🥰", cost: 15, category: "loving", animation: "cuddle" },
  { id: "butterfly", name: "Butterfly Kisses", emoji: "🦋", cost: 12, category: "loving", animation: "butterfly" },
  { id: "teddy", name: "Teddy Bear", emoji: "🧸", cost: 20, category: "loving", animation: "teddy" },
  { id: "lovesong", name: "Love Song", emoji: "🎵", cost: 15, category: "loving", animation: "lovesong" },
  { id: "moonlight", name: "Moonlight Serenade", emoji: "🌙", cost: 25, category: "loving", animation: "moonlight" },
  
  // Funny
  { id: "pie", name: "Throw a Pie", emoji: "🥧", cost: 10, category: "funny", animation: "pie" },
  { id: "tickle", name: "Tickle Attack", emoji: "🤭", cost: 8, category: "funny", animation: "tickle" },
  { id: "silly", name: "Silly Face", emoji: "🤪", cost: 5, category: "funny", animation: "silly" },
  { id: "dance", name: "Dance Party", emoji: "💃", cost: 12, category: "funny", animation: "dance" },
  { id: "confetti", name: "Confetti Bomb", emoji: "🎊", cost: 15, category: "funny", animation: "confetti" },
  { id: "balloon", name: "Balloon Pop", emoji: "🎈", cost: 7, category: "funny", animation: "balloon" },
  { id: "clown", name: "Clown Around", emoji: "🤡", cost: 10, category: "funny", animation: "clown" },
  { id: "fart", name: "Whoopee Cushion", emoji: "💨", cost: 8, category: "funny", animation: "fart" },
  { id: "monkey", name: "Monkey Business", emoji: "🐒", cost: 12, category: "funny", animation: "monkey" },
  { id: "disco", name: "Disco Fever", emoji: "🕺", cost: 18, category: "funny", animation: "disco" },
  
  // Mean (playful)
  { id: "slap", name: "Playful Slap", emoji: "👋", cost: 8, category: "mean", animation: "slap" },
  { id: "roast", name: "Friendly Roast", emoji: "🔥", cost: 12, category: "mean", animation: "roast" },
  { id: "ignore", name: "Silent Treatment", emoji: "🙄", cost: 5, category: "mean", animation: "ignore" },
  { id: "poke", name: "Annoying Poke", emoji: "👆", cost: 3, category: "mean", animation: "poke" },
  { id: "splash", name: "Water Splash", emoji: "💦", cost: 10, category: "mean", animation: "splash" },
  { id: "snowball", name: "Snowball Fight", emoji: "❄️", cost: 15, category: "mean", animation: "snowball" },
  { id: "steal", name: "Steal Blanket", emoji: "🛏️", cost: 8, category: "mean", animation: "steal" },
  { id: "jealous", name: "Jealousy Card", emoji: "😤", cost: 10, category: "mean", animation: "jealous" },
  
  // Date Night Ideas
  { id: "movie", name: "Movie Night", emoji: "🎬", cost: 30, category: "datenight", animation: "movie" },
  { id: "dinner", name: "Fancy Dinner", emoji: "🍽️", cost: 40, category: "datenight", animation: "dinner" },
  { id: "picnic", name: "Picnic Date", emoji: "🧺", cost: 25, category: "datenight", animation: "picnic" },
  { id: "stargazing", name: "Stargazing", emoji: "⭐", cost: 20, category: "datenight", animation: "stargazing" },
  { id: "cooking", name: "Cook Together", emoji: "👨‍🍳", cost: 25, category: "datenight", animation: "cooking" },
  { id: "spa", name: "Spa Day", emoji: "🧖", cost: 35, category: "datenight", animation: "spa" },
  { id: "adventure", name: "Adventure Time", emoji: "🏔️", cost: 45, category: "datenight", animation: "adventure" },
  { id: "gamenight", name: "Game Night", emoji: "🎮", cost: 20, category: "datenight", animation: "gamenight" },
  { id: "sunrise", name: "Watch Sunrise", emoji: "🌅", cost: 30, category: "datenight", animation: "sunrise" },
  { id: "roadtrip", name: "Road Trip", emoji: "🚗", cost: 50, category: "datenight", animation: "roadtrip" },
  
  // Special Rewards
  { id: "crown", name: "Crown Your King/Queen", emoji: "👑", cost: 50, category: "special", animation: "crown" },
  { id: "ring", name: "Promise Ring", emoji: "💍", cost: 100, category: "special", animation: "ring" },
  { id: "fireworks", name: "Fireworks Show", emoji: "🎆", cost: 75, category: "special", animation: "fireworks" },
  { id: "lovebomb", name: "Love Bomb", emoji: "💣💕", cost: 60, category: "special", animation: "lovebomb" },
  { id: "soulmate", name: "Soulmate Badge", emoji: "👫", cost: 150, category: "special", animation: "soulmate" },
  { id: "forever", name: "Forever & Always", emoji: "♾️", cost: 200, category: "special", animation: "forever" },
];

export default function TrophyShop({ isOpen, onClose, trophyPoints, onPurchase, partnerName }: TrophyShopProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "loving" | "funny" | "mean" | "datenight" | "special">("all");
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null);

  const filteredRewards = selectedCategory === "all" 
    ? REWARDS 
    : REWARDS.filter(r => r.category === selectedCategory);

  const handlePurchase = (item: RewardItem) => {
    if (trophyPoints < item.cost) return;
    setPurchaseAnimation(item.id);
    setTimeout(() => {
      onPurchase(item);
      setPurchaseAnimation(null);
    }, 500);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "loving": return "#ff69b4";
      case "funny": return "#ffff00";
      case "mean": return "#ff4444";
      case "datenight": return "#00bfff";
      case "special": return "#ffd700";
      default: return "#39ff14";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "loving": return "💕";
      case "funny": return "😂";
      case "mean": return "😈";
      case "datenight": return "🌃";
      case "special": return "✨";
      default: return "🎁";
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
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            padding: "20px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ color: "#39ff14", margin: 0, fontSize: "28px" }}>TROPHY SHOP</h2>
              <p style={{ color: "#888", margin: "5px 0 0 0" }}>Send reactions & plan dates!</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ 
                background: "linear-gradient(135deg, #ffd700, #ff8c00)", 
                padding: "10px 20px", 
                borderRadius: "50px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ fontSize: "24px" }}>🏆</span>
                <span style={{ color: "#000", fontWeight: "bold", fontSize: "20px" }}>{trophyPoints}</span>
              </div>
              <button 
                onClick={onClose}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}
              >
                <X size={32} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            {["all", "loving", "funny", "mean", "datenight", "special"].map((cat) => (
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
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {getCategoryIcon(cat)} {cat === "datenight" ? "Date Night" : cat}
              </button>
            ))}
          </div>

          <div style={{ 
            flex: 1, 
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "12px",
            padding: "10px 0"
          }}>
            {filteredRewards.map((item) => {
              const canAfford = trophyPoints >= item.cost;
              const isPurchasing = purchaseAnimation === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: canAfford ? 1.05 : 1 }}
                  whileTap={{ scale: canAfford ? 0.95 : 1 }}
                  animate={isPurchasing ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] } : {}}
                  onClick={() => handlePurchase(item)}
                  style={{
                    background: `linear-gradient(135deg, ${getCategoryColor(item.category)}20, #111)`,
                    border: `2px solid ${canAfford ? getCategoryColor(item.category) : "#333"}`,
                    borderRadius: "15px",
                    padding: "15px",
                    textAlign: "center",
                    cursor: canAfford ? "pointer" : "not-allowed",
                    opacity: canAfford ? 1 : 0.5,
                    position: "relative"
                  }}
                >
                  {item.category === "special" && (
                    <div style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      background: "#ffd700",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Star size={14} color="#000" fill="#000" />
                    </div>
                  )}
                  <div style={{ fontSize: "40px", marginBottom: "8px" }}>{item.emoji}</div>
                  <div style={{ color: "#fff", fontWeight: "bold", fontSize: "12px", marginBottom: "6px" }}>
                    {item.name}
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "4px",
                    color: canAfford ? "#ffd700" : "#666"
                  }}>
                    <span>🏆</span>
                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>{item.cost}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div style={{ 
            background: "rgba(255,255,255,0.05)", 
            borderRadius: "15px", 
            padding: "15px",
            marginTop: "10px",
            textAlign: "center"
          }}>
            <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>
              Win games to earn trophy points! Each win earns you points based on your score.
              <br />
              <span style={{ color: "#ffd700" }}>Date Night rewards are IOU vouchers - redeem them in real life!</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

