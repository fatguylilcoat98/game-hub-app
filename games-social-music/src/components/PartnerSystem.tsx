import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  X, 
  UserPlus, 
  Check, 
  XCircle, 
  Send, 
  Gamepad2, 
  Circle,
  HeartHandshake,
  Search,
  Clock,
  Unlink
} from "lucide-react";
import { ref, onValue, set, update, push, remove, get } from "firebase/database";
import { db } from "../lib/firebase";

interface PartnerRequest {
  id: string;
  from: string;
  to: string;
  status: "pending" | "accepted" | "declined";
  timestamp: number;
}

interface Partner {
  name: string;
  avatar: string;
  pairedAt: number;
}

interface PartnerData {
  partner: Partner | null;
  isOnline: boolean;
  lastSeen: number;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
}

interface PartnerSystemProps {
  userName: string;
  userAvatar: string;
  isOpen: boolean;
  onClose: () => void;
  onSendReaction: (partnerId: string, reaction: any) => void;
  onInviteToGame: (partnerId: string, game: string) => void;
}




const PartnerSystem: React.FC<PartnerSystemProps> = ({
  userName,
  userAvatar,
  isOpen,
  onClose,
  onSendReaction,
  onInviteToGame
}) => {
  const [partnerData, setPartnerData] = useState<PartnerData>({
    partner: null,
    isOnline: false,
    lastSeen: 0
  });
  const [pendingRequests, setPendingRequests] = useState<PartnerRequest[]>([]);
  const [outgoingRequest, setOutgoingRequest] = useState<PartnerRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<Record<string, any>>({});
  const [tab, setTab] = useState<"partner" | "find" | "requests">("partner");
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);

  // Load current partner
  useEffect(() => {
    if (!userName) return;

    const partnerRef = ref(db, `partners/${userName}`);
    const unsubPartner = onValue(partnerRef, (snap) => {
      const data = snap.val();
      if (data?.partner) {
        setPartnerData(prev => ({
          ...prev,
          partner: data.partner
        }));
        
        // Listen to partner's online status
        const onlineRef = ref(db, `online/${data.partner.name}`);
        onValue(onlineRef, (onlineSnap) => {
          const onlineData = onlineSnap.val();
          setPartnerData(prev => ({
            ...prev,
            isOnline: onlineData ? (Date.now() - onlineData.lastSeen < 60000) : false,
            lastSeen: onlineData?.lastSeen || 0
          }));
        });
      } else {
        setPartnerData({ partner: null, isOnline: false, lastSeen: 0 });
      }
    });

    // Load incoming partner requests
    const requestsRef = ref(db, `partnerRequests/${userName}`);
    const unsubRequests = onValue(requestsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const requests = Object.entries(data)
          .map(([id, req]: [string, any]) => ({ id, ...req }))
          .filter((req: PartnerRequest) => req.status === "pending");
        setPendingRequests(requests);
      } else {
        setPendingRequests([]);
      }
    });

    // Load outgoing request
    const outgoingRef = ref(db, `outgoingPartnerRequest/${userName}`);
    const unsubOutgoing = onValue(outgoingRef, (snap) => {
      setOutgoingRequest(snap.val());
    });

    // Load all users for search
    const usersRef = ref(db, 'online');
    const unsubUsers = onValue(usersRef, (snap) => {
      setAllUsers(snap.val() || {});
    });

    return () => {
      unsubPartner();
      unsubRequests();
      unsubOutgoing();
      unsubUsers();
    };
  }, [userName]);

  // Search users
  useEffect(() => {
    if (searchQuery.length > 0) {
      const results = Object.keys(allUsers)
        .filter(name => 
          name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          name !== userName &&
          name !== partnerData.partner?.name
        );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allUsers, userName, partnerData.partner]);

  const sendPartnerRequest = async (toUser: string) => {
    if (outgoingRequest || partnerData.partner) return;

    const request: Omit<PartnerRequest, 'id'> = {
      from: userName,
      to: toUser,
      status: "pending",
      timestamp: Date.now()
    };

    // Save to recipient's requests
    const newRequestRef = push(ref(db, `partnerRequests/${toUser}`));
    await set(newRequestRef, request);

    // Save outgoing request reference
    await set(ref(db, `outgoingPartnerRequest/${userName}`), {
      ...request,
      id: newRequestRef.key,
      targetUser: toUser
    });

    setSearchQuery("");
    setTab("requests");
  };

  const acceptRequest = async (request: PartnerRequest) => {
    // Create partner relationship for both users
    const partnerDataForMe: Partner = {
      name: request.from,
      avatar: allUsers[request.from]?.avatar || "👤",
      pairedAt: Date.now()
    };

    const partnerDataForThem: Partner = {
      name: userName,
      avatar: userAvatar,
      pairedAt: Date.now()
    };

    // Update both users' partner data
    await set(ref(db, `partners/${userName}`), { partner: partnerDataForMe });
    await set(ref(db, `partners/${request.from}`), { partner: partnerDataForThem });

    // Remove the request
    await remove(ref(db, `partnerRequests/${userName}/${request.id}`));
    
    // Remove their outgoing request
    await remove(ref(db, `outgoingPartnerRequest/${request.from}`));

    setTab("partner");
  };

  const declineRequest = async (request: PartnerRequest) => {
    await remove(ref(db, `partnerRequests/${userName}/${request.id}`));
    await remove(ref(db, `outgoingPartnerRequest/${request.from}`));
  };

  const cancelOutgoingRequest = async () => {
    if (!outgoingRequest) return;
    
    await remove(ref(db, `partnerRequests/${outgoingRequest.to}/${outgoingRequest.id}`));
    await remove(ref(db, `outgoingPartnerRequest/${userName}`));
  };

  const unpairPartner = async () => {
    if (!partnerData.partner) return;

    // Remove partner data for both users
    await remove(ref(db, `partners/${userName}`));
    await remove(ref(db, `partners/${partnerData.partner.name}`));
    
    setShowUnpairConfirm(false);
  };

  const formatLastSeen = (timestamp: number) => {
    if (!timestamp) return "Unknown";
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const quickReactions = [
    { emoji: "💕", name: "Love" },
    { emoji: "😘", name: "Kiss" },
    { emoji: "🤗", name: "Hug" },
    { emoji: "😂", name: "Laugh" },
    { emoji: "🔥", name: "Fire" },
    { emoji: "👋", name: "Wave" }
  ];

  const games = [
    { id: "tictactoe", name: "Tic Tac Toe", icon: "⭕" },
    { id: "connect4", name: "Connect Four", icon: "🔴" },
    { id: "checkers", name: "Checkers", icon: "🏁" }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          flexDirection: "column"
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px",
          borderBottom: "1px solid #333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <HeartHandshake size={28} color="#ff6b9d" />
            <h2 style={{ margin: 0, color: "#fff", fontSize: "24px" }}>Duo Partner</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px"
            }}
          >
            <X size={28} color="#fff" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #333"
        }}>
          {[
            { id: "partner", label: "My Partner", icon: Heart },
            { id: "find", label: "Find Partner", icon: Search },
            { id: "requests", label: `Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}`, icon: UserPlus }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              style={{
                flex: 1,
                padding: "15px",
                background: tab === t.id ? "rgba(255, 107, 157, 0.2)" : "transparent",
                border: "none",
                borderBottom: tab === t.id ? "2px solid #ff6b9d" : "2px solid transparent",
                color: tab === t.id ? "#ff6b9d" : "#888",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Partner Tab */}
          {tab === "partner" && (
            <div>
              {partnerData.partner ? (
                <div>
                  {/* Partner Card */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                      borderRadius: "20px",
                      padding: "30px",
                      textAlign: "center",
                      border: "2px solid #ff6b9d",
                      boxShadow: "0 0 30px rgba(255, 107, 157, 0.2)"
                    }}
                  >
                    {/* Online Status */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginBottom: "20px"
                    }}>
                      <Circle 
                        size={12} 
                        fill={partnerData.isOnline ? "#39ff14" : "#666"} 
                        color={partnerData.isOnline ? "#39ff14" : "#666"} 
                      />
                      <span style={{ 
                        color: partnerData.isOnline ? "#39ff14" : "#888",
                        fontSize: "14px",
                        fontWeight: "600"
                      }}>
                        {partnerData.isOnline ? "Online Now" : `Last seen ${formatLastSeen(partnerData.lastSeen)}`}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div style={{
                      fontSize: "80px",
                      marginBottom: "15px"
                    }}>
                      {partnerData.partner.avatar}
                    </div>

                    {/* Name */}
                    <h3 style={{
                      color: "#fff",
                      fontSize: "28px",
                      margin: "0 0 10px 0"
                    }}>
                      {partnerData.partner.name}
                    </h3>

                    {/* Paired Since */}
                    <div style={{
                      color: "#888",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}>
                      <Heart size={14} color="#ff6b9d" fill="#ff6b9d" />
                      Paired since {new Date(partnerData.partner.pairedAt).toLocaleDateString()}
                    </div>
                  </motion.div>

                  {/* Quick Reactions */}
                  <div style={{ marginTop: "25px" }}>
                    <h4 style={{ color: "#ff6b9d", marginBottom: "15px", fontSize: "16px" }}>
                      Send Quick Reaction
                    </h4>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: "10px"
                    }}>
                      {quickReactions.map(r => (
                        <motion.button
                          key={r.name}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onSendReaction(partnerData.partner!.name, r)}
                          style={{
                            background: "rgba(255, 107, 157, 0.15)",
                            border: "1px solid rgba(255, 107, 157, 0.3)",
                            borderRadius: "12px",
                            padding: "15px 10px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "5px"
                          }}
                        >
                          <span style={{ fontSize: "28px" }}>{r.emoji}</span>
                          <span style={{ fontSize: "10px", color: "#888" }}>{r.name}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Invite to Game */}
                  <div style={{ marginTop: "25px" }}>
                    <h4 style={{ color: "#39ff14", marginBottom: "15px", fontSize: "16px" }}>
                      <Gamepad2 size={18} style={{ marginRight: "8px", verticalAlign: "middle" }} />
                      Invite to Play
                    </h4>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "10px"
                    }}>
                      {games.map(g => (
                        <motion.button
                          key={g.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onInviteToGame(partnerData.partner!.name, g.id)}
                          disabled={!partnerData.isOnline}
                          style={{
                            background: partnerData.isOnline 
                              ? "linear-gradient(135deg, rgba(57, 255, 20, 0.2), rgba(57, 255, 20, 0.1))"
                              : "rgba(50, 50, 50, 0.5)",
                            border: partnerData.isOnline 
                              ? "1px solid rgba(57, 255, 20, 0.4)"
                              : "1px solid #333",
                            borderRadius: "12px",
                            padding: "15px",
                            cursor: partnerData.isOnline ? "pointer" : "not-allowed",
                            opacity: partnerData.isOnline ? 1 : 0.5
                          }}
                        >
                          <span style={{ fontSize: "24px", display: "block", marginBottom: "5px" }}>{g.icon}</span>
                          <span style={{ 
                            fontSize: "12px", 
                            color: partnerData.isOnline ? "#39ff14" : "#666",
                            fontWeight: "600"
                          }}>
                            {g.name}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                    {!partnerData.isOnline && (
                      <p style={{ 
                        color: "#666", 
                        fontSize: "12px", 
                        textAlign: "center",
                        marginTop: "10px"
                      }}>
                        Partner must be online to play together
                      </p>
                    )}
                  </div>

                  {/* Unpair Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUnpairConfirm(true)}
                    style={{
                      width: "100%",
                      marginTop: "30px",
                      padding: "15px",
                      background: "transparent",
                      border: "1px solid #ff4444",
                      borderRadius: "12px",
                      color: "#ff4444",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontSize: "14px"
                    }}
                  >
                    <Unlink size={18} />
                    Unpair Partner
                  </motion.button>

                  {/* Unpair Confirmation Modal */}
                  <AnimatePresence>
                    {showUnpairConfirm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: "fixed",
                          inset: 0,
                          background: "rgba(0,0,0,0.8)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 300
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0.9 }}
                          style={{
                            background: "#1a1a2e",
                            borderRadius: "20px",
                            padding: "30px",
                            maxWidth: "350px",
                            textAlign: "center"
                          }}
                        >
                          <Unlink size={48} color="#ff4444" style={{ marginBottom: "15px" }} />
                          <h3 style={{ color: "#fff", marginBottom: "10px" }}>Unpair Partner?</h3>
                          <p style={{ color: "#888", marginBottom: "25px", fontSize: "14px" }}>
                            Are you sure you want to unpair from {partnerData.partner.name}? 
                            You can always pair again later.
                          </p>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              onClick={() => setShowUnpairConfirm(false)}
                              style={{
                                flex: 1,
                                padding: "12px",
                                background: "#333",
                                border: "none",
                                borderRadius: "10px",
                                color: "#fff",
                                cursor: "pointer"
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={unpairPartner}
                              style={{
                                flex: 1,
                                padding: "12px",
                                background: "#ff4444",
                                border: "none",
                                borderRadius: "10px",
                                color: "#fff",
                                cursor: "pointer"
                              }}
                            >
                              Unpair
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <HeartHandshake size={80} color="#444" style={{ marginBottom: "20px" }} />
                  <h3 style={{ color: "#fff", marginBottom: "10px" }}>No Partner Yet</h3>
                  <p style={{ color: "#888", marginBottom: "25px" }}>
                    Find your duo partner to send reactions, play games together, and see when they're online!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTab("find")}
                    style={{
                      background: "linear-gradient(135deg, #ff6b9d, #c44569)",
                      border: "none",
                      borderRadius: "50px",
                      padding: "15px 40px",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "16px"
                    }}
                  >
                    Find Partner
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* Find Partner Tab */}
          {tab === "find" && (
            <div>
              {outgoingRequest ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock size={60} color="#ff6b9d" />
                  </motion.div>
                  <h3 style={{ color: "#fff", marginTop: "20px", marginBottom: "10px" }}>
                    Request Pending
                  </h3>
                  <p style={{ color: "#888", marginBottom: "5px" }}>
                    Waiting for <span style={{ color: "#ff6b9d" }}>{outgoingRequest.to}</span> to accept
                  </p>
                  <p style={{ color: "#666", fontSize: "13px", marginBottom: "25px" }}>
                    Sent {formatLastSeen(outgoingRequest.timestamp)}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelOutgoingRequest}
                    style={{
                      background: "transparent",
                      border: "1px solid #ff4444",
                      borderRadius: "50px",
                      padding: "12px 30px",
                      color: "#ff4444",
                      cursor: "pointer"
                    }}
                  >
                    Cancel Request
                  </motion.button>
                </div>
              ) : partnerData.partner ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <Heart size={60} color="#ff6b9d" fill="#ff6b9d" />
                  <h3 style={{ color: "#fff", marginTop: "20px" }}>
                    Already Paired!
                  </h3>
                  <p style={{ color: "#888" }}>
                    You're already paired with {partnerData.partner.name}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Search Input */}
                  <div style={{
                    background: "#1a1a2e",
                    borderRadius: "15px",
                    padding: "5px 15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "20px"
                  }}>
                    <Search size={20} color="#888" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      placeholder="Search by username..."
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        color: "#fff",
                        padding: "15px 0",
                        fontSize: "16px",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Search Results */}
                  {searchQuery && (
                    <div>
                      {searchResults.length > 0 ? (
                        searchResults.map(name => (
                          <motion.div
                            key={name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              background: "#1a1a2e",
                              borderRadius: "12px",
                              padding: "15px",
                              marginBottom: "10px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{
                                width: "45px",
                                height: "45px",
                                borderRadius: "50%",
                                background: "#333",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px"
                              }}>
                                {allUsers[name]?.avatar || "👤"}
                              </div>
                              <div>
                                <div style={{ color: "#fff", fontWeight: "600" }}>{name}</div>
                                <div style={{ 
                                  color: allUsers[name] && (Date.now() - allUsers[name].lastSeen < 60000) 
                                    ? "#39ff14" 
                                    : "#666",
                                  fontSize: "12px"
                                }}>
                                  {allUsers[name] && (Date.now() - allUsers[name].lastSeen < 60000) 
                                    ? "Online" 
                                    : "Offline"}
                                </div>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => sendPartnerRequest(name)}
                              style={{
                                background: "linear-gradient(135deg, #ff6b9d, #c44569)",
                                border: "none",
                                borderRadius: "50px",
                                padding: "10px 20px",
                                color: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: "600",
                                fontSize: "13px"
                              }}
                            >
                              <Send size={14} />
                              Request
                            </motion.button>
                          </motion.div>
                        ))
                      ) : (
                        <div style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                          No users found matching "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Online Users List */}
                  {!searchQuery && (
                    <div>
                      <h4 style={{ color: "#888", marginBottom: "15px", fontSize: "14px" }}>
                        Online Users
                      </h4>
                      {Object.entries(allUsers)
                        .filter(([name, data]: [string, any]) => 
                          name !== userName && 
                          (Date.now() - data.lastSeen < 60000)
                        )
                        .map(([name, data]: [string, any]) => (
                          <motion.div
                            key={name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              background: "#1a1a2e",
                              borderRadius: "12px",
                              padding: "15px",
                              marginBottom: "10px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{
                                width: "45px",
                                height: "45px",
                                borderRadius: "50%",
                                background: "#333",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px"
                              }}>
                                {data.avatar || "👤"}
                              </div>
                              <div>
                                <div style={{ color: "#fff", fontWeight: "600" }}>{name}</div>
                                <div style={{ color: "#39ff14", fontSize: "12px" }}>
                                  <Circle size={8} fill="#39ff14" style={{ marginRight: "4px", verticalAlign: "middle" }} />
                                  Online
                                </div>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => sendPartnerRequest(name)}
                              style={{
                                background: "linear-gradient(135deg, #ff6b9d, #c44569)",
                                border: "none",
                                borderRadius: "50px",
                                padding: "10px 20px",
                                color: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: "600",
                                fontSize: "13px"
                              }}
                            >
                              <Send size={14} />
                              Request
                            </motion.button>
                          </motion.div>
                        ))}
                      {Object.entries(allUsers).filter(([name, data]: [string, any]) => 
                        name !== userName && (Date.now() - data.lastSeen < 60000)
                      ).length === 0 && (
                        <div style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                          No other users online right now
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {tab === "requests" && (
            <div>
              {pendingRequests.length > 0 ? (
                pendingRequests.map(request => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      background: "linear-gradient(135deg, rgba(255, 107, 157, 0.15), rgba(255, 107, 157, 0.05))",
                      border: "1px solid rgba(255, 107, 157, 0.3)",
                      borderRadius: "15px",
                      padding: "20px",
                      marginBottom: "15px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                      <div style={{
                        width: "55px",
                        height: "55px",
                        borderRadius: "50%",
                        background: "#333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px"
                      }}>
                        {allUsers[request.from]?.avatar || "👤"}
                      </div>
                      <div>
                        <div style={{ color: "#fff", fontWeight: "bold", fontSize: "18px" }}>
                          {request.from}
                        </div>
                        <div style={{ color: "#ff6b9d", fontSize: "13px" }}>
                          wants to be your duo partner!
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => acceptRequest(request)}
                        style={{
                          flex: 1,
                          background: "linear-gradient(135deg, #39ff14, #00cc00)",
                          border: "none",
                          borderRadius: "10px",
                          padding: "12px",
                          color: "#000",
                          fontWeight: "bold",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px"
                        }}
                      >
                        <Check size={18} />
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => declineRequest(request)}
                        style={{
                          flex: 1,
                          background: "transparent",
                          border: "1px solid #ff4444",
                          borderRadius: "10px",
                          padding: "12px",
                          color: "#ff4444",
                          fontWeight: "bold",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px"
                        }}
                      >
                        <XCircle size={18} />
                        Decline
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <UserPlus size={60} color="#444" style={{ marginBottom: "20px" }} />
                  <h3 style={{ color: "#fff", marginBottom: "10px" }}>No Pending Requests</h3>
                  <p style={{ color: "#888" }}>
                    Partner requests you receive will appear here
                  </p>
                </div>
              )}

              {/* Outgoing Request Status */}
              {outgoingRequest && (
                <div style={{
                  marginTop: "30px",
                  padding: "20px",
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "15px",
                  border: "1px solid #333"
                }}>
                  <h4 style={{ color: "#888", marginBottom: "15px", fontSize: "14px" }}>
                    Your Outgoing Request
                  </h4>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Clock size={18} color="#ff6b9d" />
                      <span style={{ color: "#fff" }}>
                        Waiting for <span style={{ color: "#ff6b9d" }}>{outgoingRequest.to}</span>
                      </span>
                    </div>
                    <button
                      onClick={cancelOutgoingRequest}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ff4444",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PartnerSystem;
