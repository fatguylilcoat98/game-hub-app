import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ReactionAnimationProps {
  reaction: {
    id: string;
    emoji: string;
    name: string;
    from: string;
  } | null;
  onComplete: () => void;
}

export default function ReactionAnimation({ reaction, onComplete }: ReactionAnimationProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

  useEffect(() => {
    if (reaction) {
      // Create particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        emoji: reaction.emoji
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onComplete();
        setParticles([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [reaction, onComplete]);

  if (!reaction) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute",
            inset: 0,
            background: "#000"
          }}
        />

        {/* Main emoji */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.5, 1.2, 1.5, 1],
            rotate: [0, 10, -10, 10, 0]
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ fontSize: "150px", zIndex: 2 }}
        >
          {reaction.emoji}
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            position: "absolute",
            bottom: "30%",
            color: "#fff",
            fontSize: "24px",
            fontWeight: "bold",
            textAlign: "center",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)"
          }}
        >
          {reaction.from} sent you a {reaction.name}!
        </motion.div>

        {/* Floating particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              x: window.innerWidth / 2, 
              y: window.innerHeight / 2,
              scale: 0,
              opacity: 1
            }}
            animate={{ 
              x: p.x,
              y: p.y,
              scale: [0, 1, 0.5],
              opacity: [1, 1, 0]
            }}
            transition={{ 
              duration: 2,
              delay: p.id * 0.1,
              ease: "easeOut"
            }}
            style={{
              position: "absolute",
              fontSize: "40px"
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
