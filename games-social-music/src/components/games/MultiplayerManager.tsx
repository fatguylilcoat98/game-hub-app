import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Send, Clock, Check, Gamepad2 } from "lucide-react";
import { ref, onValue, set, push, remove, update, get } from "firebase/database";
import { db } from "../../lib/firebase";


export interface GameInvite {
  id: string;
  from: string;
  to: string;
  game: string;
  gameName: string;
  status: "pending" | "accepted" | "declined";
  timestamp: number;
}

export interface GameSession {
  id: string;
  game: string;
  players: { player1: string; player2: string };
  currentTurn: string;
  gameState: any;
  status: "waiting" | "playing" | "finished";
  winner?: string;
  createdAt: number;
}

interface MultiplayerManagerProps {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onJoinGame: (session: GameSession) => void;
  currentGame?: string;
}

const GAME_NAMES: Record<string, string> = {
  tictactoe: "Tic Tac Toe",
  connect4: "Connect Four",
  checkers: "Checkers",
};

export default function MultiplayerManager({ 
  userName, 
  isOpen, 
  onClose, 
  onJoinGame,
  currentGame 
}: MultiplayerManagerProps) {
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<GameInvite[]>([]);
  const [partnerName, setPartnerName] = useState("");
  const [selectedGame, setSelectedGame] = useState("tictactoe");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);

  // Set user online status
  useEffect(() => {
    if (userName) {
      const userRef = ref(db, `online/${userName}`);
      set(userRef, { name: userName, lastSeen: Date.now() });
      
      // Clean up on unmount
      return () => {
        remove(userRef);
      };
    }
  }, [userName]);

  // Listen for online users
  useEffect(() => {
    const onlineRef = ref(db, 'online');
    const unsubscribe = onValue(onlineRef, (snap) => {
      const data = snap.val();
      if (data) {
        const users = Object.keys(data).filter(u => u !== userName);
        setOnlineUsers(users);
      } else {
        setOnlineUsers([]);
      }
    });
    return () => unsubscribe();
  }, [userName]);

  // Listen for incoming invites
  useEffect(() => {
    if (!userName) return;
    const invitesRef = ref(db, `invites/${userName}`);
    const unsubscribe = onValue(invitesRef, (snap) => {
      const data = snap.val();
      if (data) {
        const inviteList = Object.entries(data).map(([id, inv]: [string, any]) => ({
          id,
          ...inv
        })).filter(inv => inv.status === "pending");
        setInvites(inviteList);
      } else {
        setInvites([]);
      }
    });
    return () => unsubscribe();
  }, [userName]);

  // Listen for sent invites status
  useEffect(() => {
    if (!userName) return;
    const sentRef = ref(db, `sentInvites/${userName}`);
    const unsubscribe = onValue(sentRef, (snap) => {
      const data = snap.val();
      if (data) {
        const inviteList = Object.entries(data).map(([id, inv]: [string, any]) => ({
          id,
          ...inv
        }));
        setSentInvites(inviteList);
        
        // Check for accepted invites
        inviteList.forEach(inv => {
          if (inv.status === "accepted" && inv.sessionId) {
            // Join the game session
            get(ref(db, `gameSessions/${inv.sessionId}`)).then((snap) => {
              if (snap.exists()) {
                onJoinGame(snap.val());
                // Clean up invite
                remove(ref(db, `sentInvites/${userName}/${inv.id}`));
              }
            });
          }
        });
      } else {
        setSentInvites([]);
      }
    });
    return () => unsubscribe();
  }, [userName, onJoinGame]);

  // Listen for active game sessions
  useEffect(() => {
    if (!userName) return;
    const sessionsRef = ref(db, 'gameSessions');
    const unsubscribe = onValue(sessionsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const sessions = Object.entries(data)
          .map(([id, session]: [string, any]) => ({ id, ...session }))
          .filter((s: GameSession) => 
            (s.players.player1 === userName || s.players.player2 === userName) &&
            s.status !== "finished"
          );
        setActiveSessions(sessions);
      } else {
        setActiveSessions([]);
      }
    });
    return () => unsubscribe();
  }, [userName]);

  const sendInvite = async () => {
    if (!partnerName || partnerName === userName) return;
    
    const inviteId = push(ref(db, 'invites')).key;
    const invite: Omit<GameInvite, 'id'> = {
      from: userName,
      to: partnerName,
      game: selectedGame,
      gameName: GAME_NAMES[selectedGame],
      status: "pending",
      timestamp: Date.now()
    };

    // Send to recipient
    await set(ref(db, `invites/${partnerName}/${inviteId}`), invite);
    // Track in sent invites
    await set(ref(db, `sentInvites/${userName}/${inviteId}`), { ...invite, id: inviteId });
    
    setPartnerName("");
  };

  const acceptInvite = async (invite: GameInvite) => {
    // Create game session
    const sessionId = push(ref(db, 'gameSessions')).key;
    const session: GameSession = {
      id: sessionId!,
      game: invite.game,
      players: { player1: invite.from, player2: userName },
      currentTurn: invite.from,
      gameState: getInitialGameState(invite.game),
      status: "playing",
      createdAt: Date.now()
    };

    // Save session
    await set(ref(db, `gameSessions/${sessionId}`), session);
    
    // Update invite status for sender
    await update(ref(db, `sentInvites/${invite.from}/${invite.id}`), { 
      status: "accepted",
      sessionId 
    });
    
    // Remove from my invites
    await remove(ref(db, `invites/${userName}/${invite.id}`));
    
    // Join the game
    onJoinGame(session);
  };

  const declineInvite = async (invite: GameInvite) => {
    await update(ref(db, `sentInvites/${invite.from}/${invite.id}`), { status: "declined" });
    await remove(ref(db, `invites/${userName}/${invite.id}`));
  };

  const getInitialGameState = (game: string) => {
    switch (game) {
      case "tictactoe":
        return { board: Array(9).fill(null) };
      case "connect4":
        return { board: Array(6).fill(null).map(() => Array(7).fill(null)) };
      case "checkers":
        return { board: initCheckersBoard() };
      default:
        return {};
    }
  };

  const initCheckersBoard = () => {
    const board: any[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) board[r][c] = { player: "B", king: false };
      }
    }
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) board[r][c] = { player: "R", king: false };
      }
    }
    return board;
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
            padding: "20px",
            overflowY: "auto"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Users size={28} color="#39ff14" />
              <h2 style={{ color: "#39ff14", margin: 0, fontSize: "24px" }}>MULTIPLAYER</h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={32} color="#fff" />
            </button>
          </div>

          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ color: "#ff00ff", marginBottom: "15px", fontSize: "16px" }}>ACTIVE GAMES</h3>
              {activeSessions.map(session => (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onJoinGame(session)}
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 0, 255, 0.2), rgba(0, 255, 255, 0.1))",
                    border: "2px solid #ff00ff",
                    borderRadius: "15px",
                    padding: "15px",
                    marginBottom: "10px",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#fff", fontWeight: "bold" }}>{GAME_NAMES[session.game]}</div>
                      <div style={{ color: "#888", fontSize: "14px" }}>
                        vs {session.players.player1 === userName ? session.players.player2 : session.players.player1}
                      </div>
                    </div>
                    <div style={{ 
                      color: session.currentTurn === userName ? "#39ff14" : "#888",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}>
                      {session.currentTurn === userName ? (
                        <>
                          <span style={{ 
                            width: "8px", 
                            height: "8px", 
                            borderRadius: "50%", 
                            background: "#39ff14",
                            animation: "pulse 1s infinite"
                          }} />
                          YOUR TURN
                        </>
                      ) : "Waiting..."}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Incoming Invites */}
          {invites.length > 0 && (
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ color: "#ffff00", marginBottom: "15px", fontSize: "16px" }}>INCOMING INVITES</h3>
              {invites.map(invite => (
                <div
                  key={invite.id}
                  style={{
                    background: "rgba(255, 255, 0, 0.1)",
                    border: "1px solid #ffff00",
                    borderRadius: "15px",
                    padding: "15px",
                    marginBottom: "10px"
                  }}
                >
                  <div style={{ color: "#fff", marginBottom: "10px" }}>
                    <strong>{invite.from}</strong> wants to play <strong>{invite.gameName}</strong>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => acceptInvite(invite)}
                      style={{
                        flex: 1,
                        background: "#39ff14",
                        color: "#000",
                        border: "none",
                        padding: "10px",
                        borderRadius: "25px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      ACCEPT
                    </button>
                    <button
                      onClick={() => declineInvite(invite)}
                      style={{
                        flex: 1,
                        background: "#ff4444",
                        color: "#fff",
                        border: "none",
                        padding: "10px",
                        borderRadius: "25px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      DECLINE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Send Invite */}
          <div style={{ marginBottom: "25px" }}>
            <h3 style={{ color: "#00ffff", marginBottom: "15px", fontSize: "16px" }}>INVITE TO PLAY</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                style={{
                  background: "#111",
                  border: "2px solid #333",
                  color: "#fff",
                  padding: "15px",
                  borderRadius: "10px",
                  fontSize: "16px"
                }}
              >
                {Object.entries(GAME_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value.toUpperCase())}
                  placeholder="PARTNER'S NAME"
                  style={{
                    flex: 1,
                    background: "#111",
                    border: "2px solid #333",
                    color: "#fff",
                    padding: "15px",
                    borderRadius: "10px",
                    fontSize: "16px"
                  }}
                />
                <button
                  onClick={sendInvite}
                  disabled={!partnerName}
                  style={{
                    background: partnerName ? "#00ffff" : "#333",
                    color: "#000",
                    border: "none",
                    padding: "15px 25px",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor: partnerName ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Send size={20} /> INVITE
                </button>
              </div>
            </div>
          </div>

          {/* Online Users */}
          {onlineUsers.length > 0 && (
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ color: "#39ff14", marginBottom: "15px", fontSize: "16px" }}>ONLINE NOW</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {onlineUsers.map(user => (
                  <motion.div
                    key={user}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setPartnerName(user)}
                    style={{
                      background: "rgba(57, 255, 20, 0.1)",
                      border: "1px solid #39ff14",
                      borderRadius: "25px",
                      padding: "8px 15px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <span style={{ 
                      width: "8px", 
                      height: "8px", 
                      borderRadius: "50%", 
                      background: "#39ff14" 
                    }} />
                    <span style={{ color: "#fff" }}>{user}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Sent Invites */}
          {sentInvites.filter(i => i.status === "pending").length > 0 && (
            <div>
              <h3 style={{ color: "#888", marginBottom: "15px", fontSize: "16px" }}>PENDING INVITES</h3>
              {sentInvites.filter(i => i.status === "pending").map(invite => (
                <div
                  key={invite.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid #333",
                    borderRadius: "15px",
                    padding: "15px",
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ color: "#888" }}>
                    Waiting for <strong style={{ color: "#fff" }}>{invite.to}</strong> to accept {invite.gameName}
                  </div>
                  <Clock size={20} color="#888" />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export helper function to update game state
export const updateGameSession = async (sessionId: string, updates: Partial<GameSession>) => {
  await update(ref(db, `gameSessions/${sessionId}`), updates);
};

// Export helper to end game
export const endGameSession = async (sessionId: string, winner: string) => {
  await update(ref(db, `gameSessions/${sessionId}`), { 
    status: "finished",
    winner 
  });
};
