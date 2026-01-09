import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, X, SkipForward, ChevronDown, Play, Pause, Trophy, Gamepad2, Gift, Award, Users, HeartHandshake, Circle, Volume2, MapPin, Navigation } from "lucide-react";
import { ref, onValue, set, update, push } from "firebase/database";
import { db } from "../lib/firebase";
import GameMenu from "./games/GameMenu";
import TriviaGame from "./games/TriviaGame";
import TicTacToe from "./games/TicTacToe";
import ConnectFour from "./games/ConnectFour";
import Checkers from "./games/Checkers";
import Yahtzee from "./games/Yahtzee";
import Scrabble from "./games/Scrabble";
import WouldYouRather from "./games/WouldYouRather";
import TruthOrDare from "./games/TruthOrDare";
import LoveQuiz from "./games/LoveQuiz";
import NeverHaveIEver from "./games/NeverHaveIEver";
import CouplesChallenge from "./games/CouplesChallenge";
import MultiplayerManager, { GameSession } from "./games/MultiplayerManager";
import TrophyShop, { RewardItem } from "./TrophyShop";
import ReactionAnimation from "./ReactionAnimation";
import GameLeaderboard from "./GameLeaderboard";
import PartnerSystem from "./PartnerSystem";

// --- DATA ---
const PLAYLIST = [
  { name: "Sweetest Berries", url: "https://files.catbox.moe/23fnj0.mp3", mood: "#39ff14", speed: 0.15, intensity: 120 },
  { name: "Not Sorry Anymore", url: "https://files.catbox.moe/kw2kwn.mp3", mood: "#ff0000", speed: 0.1, intensity: 80 },
  { name: "Mistakes", url: "https://files.catbox.moe/80h3u7.mp3", mood: "#0055ff", speed: 0.05, intensity: 50 },
  { name: "Lemons", url: "https://files.catbox.moe/35zq47.mp3", mood: "#ffff00", speed: 0.25, intensity: 200 }
];

const AVATARS = [
  { label: "Bat", icon: "🦇" },
  { label: "Lion", icon: "🦁" },
  { label: "Robot", icon: "🤖" },
  { label: "Ghost", icon: "👻" },
  { label: "Alien", icon: "👽" }
];

// --- HAVERSINE DISTANCE CALCULATION ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// --- INTENSE VISUALIZER ---

const IntenseVisualizer = ({ isPlaying, song, manualSpeed, manualIntensity }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0, animationId: number;
    let particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 5 + 2,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10
    }));

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isPlaying) {
        frame += manualSpeed;
        const pulse = Math.sin(frame) * manualIntensity;
        ctx.strokeStyle = song.mood;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.abs(pulse), 0, Math.PI * 2);
        ctx.stroke();
        particles.forEach((p) => {
          p.x += p.vx * (manualSpeed * 5);
          p.y += p.vy * (manualSpeed * 5);
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          ctx.fillStyle = song.mood;
          ctx.globalAlpha = 0.6;
          ctx.fillRect(p.x, p.y, p.size + (pulse / 20), p.size + (pulse / 20));
        });
        ctx.beginPath();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 4;
        for (let i = 0; i < canvas.width; i += 10) {
          const y = (canvas.height / 2) + Math.sin(i * 0.02 + frame) * pulse;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.stroke();
      }
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, song, manualSpeed, manualIntensity]);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
};

interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const AppLayout: React.FC = () => {
  const [view, setView] = useState("LOGIN");
  const [user, setUser] = useState({ name: "", avatar: "", label: "CHOOSE YOUR AVATAR" });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [vSpeed, setVSpeed] = useState(0.1);
  const [vIntensity, setVIntensity] = useState(100);
  const [volume, setVolume] = useState(0.7);
  const [isPlaying, setIsPlaying] = useState(false);

  const [currentSong, setCurrentSong] = useState(() => Math.floor(Math.random() * PLAYLIST.length));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [notes, setNotes] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<Record<string, number>>({});
  
  // Game states
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [gameLeaderboards, setGameLeaderboards] = useState<Record<string, Record<string, number>>>({});
  const [trophyPoints, setTrophyPoints] = useState(0);
  const [showTrophyShop, setShowTrophyShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState<string | null>(null);
  const [incomingReaction, setIncomingReaction] = useState<any>(null);
  
  // Multiplayer states
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [multiplayerSession, setMultiplayerSession] = useState<GameSession | null>(null);
  const [pendingInvites, setPendingInvites] = useState(0);
  
  // Partner system states
  const [showPartnerSystem, setShowPartnerSystem] = useState(false);
  const [partnerData, setPartnerData] = useState<{ name: string; isOnline: boolean; avatar?: string } | null>(null);
  const [pendingPartnerRequests, setPendingPartnerRequests] = useState(0);
  
  // Location states
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<UserLocation | null>(null);
  const [distanceToPartner, setDistanceToPartner] = useState<number | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Request location permission and track location
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };
        setUserLocation(location);
        setLocationPermission('granted');
        setLocationError(null);
        
        // Save to Firebase
        if (user.name) {
          set(ref(db, `locations/${user.name}`), location);
        }
      },
      (error) => {
        setLocationPermission('denied');
        setLocationError(error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Watch location continuously
  useEffect(() => {
    if (!user.name || locationPermission !== 'granted') return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };
        setUserLocation(location);
        set(ref(db, `locations/${user.name}`), location);
      },
      (error) => {
        console.error("Location watch error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user.name, locationPermission]);

  // Calculate distance when both locations are available
  useEffect(() => {
    if (userLocation && partnerLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        partnerLocation.latitude,
        partnerLocation.longitude
      );
      setDistanceToPartner(distance);
    } else {
      setDistanceToPartner(null);
    }
  }, [userLocation, partnerLocation]);

  // Listen for partner's location
  useEffect(() => {
    if (!partnerData?.name) {
      setPartnerLocation(null);
      return;
    }

    const unsubscribe = onValue(ref(db, `locations/${partnerData.name}`), (snap) => {
      const data = snap.val();
      if (data && (Date.now() - data.timestamp < 300000)) { // Location valid for 5 minutes
        setPartnerLocation(data);
      } else {
        setPartnerLocation(null);
      }
    });

    return () => unsubscribe();
  }, [partnerData?.name]);

  useEffect(() => {
    onValue(ref(db, 'leaderboard'), (snap) => setLeaderboard(snap.val() || {}));
    onValue(ref(db, 'notes'), (snap) => {
      const data = snap.val();
      setNotes(data ? Object.values(data).reverse() : []);
    });
    
    // Load game leaderboards
    onValue(ref(db, 'gameLeaderboards'), (snap) => {
      setGameLeaderboards(snap.val() || {});
    });
  }, []);

  // Load user trophy points and listen for invites
  useEffect(() => {
    if (user.name) {
      onValue(ref(db, `users/${user.name}/trophyPoints`), (snap) => {
        setTrophyPoints(snap.val() || 0);
      });
      
      // Listen for incoming reactions
      onValue(ref(db, `reactions/${user.name}`), (snap) => {
        const data = snap.val();
        if (data) {
          setIncomingReaction(data);
          set(ref(db, `reactions/${user.name}`), null);
        }
      });
      
      // Listen for pending invites count
      onValue(ref(db, `invites/${user.name}`), (snap) => {
        const data = snap.val();
        if (data) {
          const pending = Object.values(data).filter((inv: any) => inv.status === "pending").length;
          setPendingInvites(pending);
        } else {
          setPendingInvites(0);
        }
      });
      
      // Listen for partner requests
      onValue(ref(db, `partnerRequests/${user.name}`), (snap) => {
        const data = snap.val();
        if (data) {
          const pending = Object.values(data).filter((req: any) => req.status === "pending").length;
          setPendingPartnerRequests(pending);
        } else {
          setPendingPartnerRequests(0);
        }
      });
      
      // Listen for partner data
      onValue(ref(db, `partners/${user.name}`), (snap) => {
        const data = snap.val();
        if (data?.partner) {
          // Check partner's online status
          onValue(ref(db, `online/${data.partner.name}`), (onlineSnap) => {
            const onlineData = onlineSnap.val();
            setPartnerData({
              name: data.partner.name,
              avatar: data.partner.avatar,
              isOnline: onlineData ? (Date.now() - onlineData.lastSeen < 60000) : false
            });
          });
        } else {
          setPartnerData(null);
        }
      });
      
      // Set user online with avatar
      const userRef = ref(db, `online/${user.name}`);
      set(userRef, { name: user.name, avatar: user.avatar, lastSeen: Date.now() });
      
      // Update online status periodically
      const interval = setInterval(() => {
        set(userRef, { name: user.name, avatar: user.avatar, lastSeen: Date.now() });
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user.name, user.avatar]);


  useEffect(() => {
    audioRef.current = new Audio(PLAYLIST[currentSong].url);
    audioRef.current.volume = volume;
    
    // Auto-next randomizer when song ends
    audioRef.current.onended = () => {
      const nextSong = Math.floor(Math.random() * PLAYLIST.length);
      setCurrentSong(nextSong);
    };
    
    setVSpeed(PLAYLIST[currentSong].speed);
    setVIntensity(PLAYLIST[currentSong].intensity);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    
    // Update volume
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    // Clean up old audio
    audioRef.current.pause();
    
    // Create new audio for new song
    audioRef.current = new Audio(PLAYLIST[currentSong].url);
    audioRef.current.volume = volume;
    
    // Auto-next randomizer when song ends
    audioRef.current.onended = () => {
      const nextSong = Math.floor(Math.random() * PLAYLIST.length);
      setCurrentSong(nextSong);
    };
    
    if (isPlaying) audioRef.current.play().catch(() => {});
    setVSpeed(PLAYLIST[currentSong].speed);
    setVIntensity(PLAYLIST[currentSong].intensity);
  }, [currentSong]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  const handleStart = () => {
    if (user.name && user.avatar) {
      const thump = new Audio("https://cdn.pixabay.com/audio/2022/03/10/audio_c35278d327.mp3");
      const playT = () => {
        thump.currentTime = 0;
        thump.play().catch(() => {});
      };
      setView("HEART");
      [100, 600, 1100, 1600, 2100].forEach(ms => setTimeout(playT, ms));
      setTimeout(() => {
        setView("ROOM");
        setIsPlaying(true);
        // Request location after login
        requestLocationPermission();
      }, 3500);
    }
  };

  const addNote = () => {
    if (!noteInput) return;
    push(ref(db, 'notes'), {
      text: noteInput,
      author: user.name,
      color: ["#fff275", "#ff7eb9", "#7afcff"][Math.floor(Math.random() * 3)]
    });
    setNoteInput("");
  };

  const handleGameWin = (game: string, score: number) => {
    const points = Math.floor(score / 5);
    
    // Update trophy points
    const newPoints = trophyPoints + points;
    set(ref(db, `users/${user.name}/trophyPoints`), newPoints);
    setTrophyPoints(newPoints);
    
    // Update game leaderboard
    const currentScore = gameLeaderboards[game]?.[user.name] || 0;
    if (score > currentScore) {
      update(ref(db, `gameLeaderboards/${game}`), {
        [user.name]: score
      });
    }
    
    // Update overall leaderboard (total wins)
    const currentWins = leaderboard[user.name] || 0;
    update(ref(db, 'leaderboard'), {
      [user.name]: currentWins + 1
    });
  };

  const handlePurchaseReward = (item: RewardItem) => {
    if (trophyPoints < item.cost) return;
    
    // Deduct points
    const newPoints = trophyPoints - item.cost;
    set(ref(db, `users/${user.name}/trophyPoints`), newPoints);
    setTrophyPoints(newPoints);
    
    // Send to partner if available, otherwise show to self
    if (partnerData?.name) {
      set(ref(db, `reactions/${partnerData.name}`), {
        id: item.id,
        emoji: item.emoji,
        name: item.name,
        from: user.name
      });
    } else {
      setIncomingReaction({
        id: item.id,
        emoji: item.emoji,
        name: item.name,
        from: user.name
      });
    }
    
    setShowTrophyShop(false);
  };

  // Handler for sending reactions to partner from PartnerSystem
  const handleSendPartnerReaction = (partnerId: string, reaction: any) => {
    set(ref(db, `reactions/${partnerId}`), {
      id: reaction.name,
      emoji: reaction.emoji,
      name: reaction.name,
      from: user.name
    });
  };

  // Handler for inviting partner to game
  const handleInvitePartnerToGame = (partnerId: string, game: string) => {
    // Create a game invite for the partner
    const inviteRef = push(ref(db, `invites/${partnerId}`));
    set(inviteRef, {
      from: user.name,
      game: game,
      status: "pending",
      timestamp: Date.now(),
      isPartnerInvite: true
    });
    
    // Also start a multiplayer session
    const sessionRef = push(ref(db, 'gameSessions'));
    set(sessionRef, {
      game: game,
      host: user.name,
      guest: partnerId,
      status: "waiting",
      createdAt: Date.now(),
      isPartnerGame: true
    });
  };

  const handleJoinMultiplayerGame = (session: GameSession) => {
    setMultiplayerSession(session);
    setCurrentGame(session.game);
    setShowMultiplayer(false);
  };

  const handleExitMultiplayer = () => {
    setMultiplayerSession(null);
    setCurrentGame("menu");
  };

  // Format distance display
  const formatDistance = () => {
    if (locationPermission === 'denied') {
      return "Location disabled";
    }
    if (!partnerData) {
      return "No partner yet";
    }
    if (!userLocation) {
      return "Getting your location...";
    }
    if (!partnerLocation) {
      return "Partner location unavailable";
    }
    if (distanceToPartner === null) {
      return "Calculating...";
    }
    if (distanceToPartner < 0.1) {
      return "You're together!";
    }
    if (distanceToPartner < 1) {
      return `${(distanceToPartner * 5280).toFixed(0)} feet away`;
    }
    return `${distanceToPartner.toFixed(1)} miles away`;
  };


  // Render current game
  const renderGame = () => {
    const gameProps = {
      onBack: () => {
        if (multiplayerSession) {
          handleExitMultiplayer();
        } else {
          setCurrentGame(null);
        }
      },
      onWin: (score: number) => handleGameWin(currentGame!, score),
      userName: user.name,
      multiplayerSession: multiplayerSession,
      onExitMultiplayer: handleExitMultiplayer
    };

    switch (currentGame) {
      case "trivia": return <TriviaGame onBack={gameProps.onBack} onWin={gameProps.onWin} userName={user.name} />;
      case "tictactoe": return <TicTacToe {...gameProps} />;
      case "connect4": return <ConnectFour {...gameProps} />;
      case "checkers": return <Checkers {...gameProps} />;
      case "yahtzee": return <Yahtzee onBack={gameProps.onBack} onWin={gameProps.onWin} userName={user.name} />;
      case "scrabble": return <Scrabble onBack={gameProps.onBack} onWin={gameProps.onWin} userName={user.name} />;
      // Couples Games
      case "wouldyourather": return <WouldYouRather onBack={gameProps.onBack} onWin={gameProps.onWin} userName={user.name} />;
      case "truthordare": return <TruthOrDare onBack={gameProps.onBack} onWin={gameProps.onWin} userName={user.name} />;
      case "lovequiz": return <LoveQuiz onBack={gameProps.onBack} onWin={gameProps.onWin} userName={user.name} />;
      case "neverhaveiever": return <NeverHaveIEver onBack={gameProps.onBack} onWin={gameProps.onWin} userName={user.name} />;
      case "coupleschallenge": return <CouplesChallenge onBack={gameProps.onBack} onWin={gameProps.onWin} userName={user.name} />;
      default: return null;
    }
  };



  return (
    <motion.div
      animate={{ backgroundColor: "#000" }}
      style={{
        color: "#fff",
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        fontFamily: 'system-ui'
      }}
    >
      {/* Visualizer stays at z-index 0 - behind everything */}
      <IntenseVisualizer isPlaying={isPlaying} song={PLAYLIST[currentSong]} manualSpeed={vSpeed} manualIntensity={vIntensity} />

      <AnimatePresence mode="wait">
        {view === "LOGIN" && (
          <motion.div
            key="login"
            exit={{ opacity: 0 }}
            style={{
              height: "100vh",
              position: "relative",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
              <h1 style={{
                fontSize: "clamp(80px, 20vw, 150px)",
                margin: 0,
                color: "transparent",
                WebkitTextStroke: "3px #39ff14",
                fontWeight: "900",
                fontStyle: "italic"
              }}>DU</h1>
              <Heart size={120} color="#39ff14" fill="#39ff14" />
            </div>
            <p style={{ color: "#888", marginBottom: "30px", textAlign: "center", maxWidth: "300px" }}>
              Connect with your partner, play games together, and stay close no matter the distance
            </p>
            <div style={{ width: "100%", maxWidth: "350px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                style={{
                  background: "rgba(0,0,0,0.8)",
                  border: "2px solid #222",
                  padding: "20px",
                  borderRadius: "15px",
                  display: "flex",
                  justifyContent: "space-between",
                  cursor: "pointer"
                }}
              >
                <span>{user.avatar ? `${user.label} ${user.avatar}` : "CHOOSE YOUR AVATAR"}</span>
                <ChevronDown size={20} />
              </div>
              {isPickerOpen && (
                <div style={{
                  background: "#111",
                  border: "2px solid #222",
                  borderRadius: "15px",
                  maxHeight: "150px",
                  overflowY: "auto",
                  zIndex: 100
                }}>
                  {AVATARS.map(a => (
                    <div
                      key={a.label}
                      onClick={() => {
                        setUser({ ...user, avatar: a.icon, label: a.label });
                        setIsPickerOpen(false);
                      }}
                      style={{ padding: "15px", borderBottom: "1px solid #222", cursor: "pointer" }}
                    >
                      {a.label} {a.icon}
                    </div>
                  ))}
                </div>
              )}
              <input
                style={{
                  background: "#111",
                  border: "2px solid #222",
                  color: "#fff",
                  padding: "20px",
                  borderRadius: "15px",
                  textAlign: "center"
                }}
                placeholder="NAME"
                onChange={(e) => setUser({ ...user, name: e.target.value.toUpperCase() })}
              />
              <button
                onClick={handleStart}
                style={{
                  background: "#39ff14",
                  color: "#000",
                  padding: "22px",
                  borderRadius: "50px",
                  fontWeight: "900",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                START
              </button>
            </div>
          </motion.div>
        )}

        {view === "HEART" && (
          <motion.div
            key="heart-view"
            style={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 10
            }}
          >
            <motion.div animate={{ scale: [1, 1.5, 1.2, 1.6, 1] }} transition={{ duration: 0.5, repeat: 5 }}>
              <Heart size={220} color="#39ff14" fill="#39ff14" style={{ filter: "drop-shadow(0 0 60px #39ff14)" }} />
            </motion.div>
            <h2 style={{ marginTop: "50px", color: "#39ff14", letterSpacing: "8px", fontWeight: "900" }}>
              WELCOME TO DUO
            </h2>
          </motion.div>
        )}

        {view === "ROOM" && !currentGame && (
          <motion.div key="room" style={{ height: "100%", position: "relative", zIndex: 10 }}>
            {/* Top Left - User Info & Location */}
            <div style={{ position: "absolute", top: "25px", left: "25px", zIndex: 20 }}>
              {/* User Status Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: "rgba(0,0,0,0.7)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  border: "1px solid rgba(57, 255, 20, 0.3)",
                  marginBottom: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #39ff14, #00cc00)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px"
                  }}>
                    {user.avatar}
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: "bold", fontSize: "14px" }}>{user.name}</div>
                    <div style={{ color: "#39ff14", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Circle size={6} fill="#39ff14" color="#39ff14" />
                      Online
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Distance Display */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => {
                  if (locationPermission !== 'granted') {
                    requestLocationPermission();
                  }
                }}
                style={{
                  background: partnerData 
                    ? "linear-gradient(135deg, rgba(255, 107, 157, 0.2), rgba(255, 107, 157, 0.1))"
                    : "rgba(0,0,0,0.7)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  border: partnerData 
                    ? "1px solid rgba(255, 107, 157, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  cursor: locationPermission !== 'granted' ? 'pointer' : 'default',
                  marginBottom: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {partnerData ? (
                    <Navigation size={16} color="#ff6b9d" />
                  ) : (
                    <MapPin size={16} color="#888" />
                  )}
                  <div>
                    <div style={{ 
                      color: partnerData ? "#ff6b9d" : "#888", 
                      fontWeight: "bold", 
                      fontSize: "13px" 
                    }}>
                      {formatDistance()}
                    </div>
                    {locationPermission === 'denied' && (
                      <div style={{ color: "#666", fontSize: "10px" }}>
                        Tap to enable location
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Partner Status Mini Display */}
              {partnerData && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setShowPartnerSystem(true)}
                  style={{
                    background: "rgba(255, 107, 157, 0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 107, 157, 0.4)",
                    borderRadius: "16px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer"
                  }}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: partnerData.isOnline 
                      ? "linear-gradient(135deg, #ff6b9d, #c44569)"
                      : "#444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    position: "relative"
                  }}>
                    {partnerData.avatar || "👤"}
                    <div style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: partnerData.isOnline ? "#39ff14" : "#666",
                      border: "2px solid #000"
                    }} />
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: "bold", fontSize: "14px" }}>
                      {partnerData.name}
                    </div>
                    <div style={{ 
                      color: partnerData.isOnline ? "#39ff14" : "#888", 
                      fontSize: "11px" 
                    }}>
                      {partnerData.isOnline ? "Online now" : "Offline"}
                    </div>
                  </div>
                  <HeartHandshake size={18} color="#ff6b9d" style={{ marginLeft: "auto" }} />
                </motion.div>
              )}
            </div>


            {/* Trophy Points Display */}
            <div 
              onClick={() => setShowTrophyShop(true)}
              style={{ 
                position: "absolute", 
                top: "25px", 
                left: "50%", 
                transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #ffd700, #ff8c00)",
                padding: "8px 20px",
                borderRadius: "50px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)",
                zIndex: 20
              }}
            >
              <Trophy size={20} color="#000" />
              <span style={{ color: "#000", fontWeight: "bold", fontSize: "18px" }}>{trophyPoints}</span>
            </div>

            <div style={{ position: "absolute", top: "25px", right: "25px", display: "flex", gap: "10px", zIndex: 20 }}>
              {/* Multiplayer notification badge */}
              {pendingInvites > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setShowMultiplayer(true)}
                  style={{
                    background: "#ff00ff",
                    borderRadius: "50%",
                    width: "45px",
                    height: "45px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative"
                  }}
                >
                  <Users size={20} color="#fff" />
                  <span style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "#ff0000",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {pendingInvites}
                  </span>
                </motion.div>
              )}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  background: "#39ff14",
                  border: "none",
                  borderRadius: "50%",
                  width: "45px",
                  height: "45px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                {isPlaying ? <Pause size={20} color="#000" /> : <Play size={20} color="#000" />}
              </button>
              <button
                onClick={() => setCurrentSong(Math.floor(Math.random() * PLAYLIST.length))}
                style={{
                  background: "#222",
                  border: "1px solid #333",
                  borderRadius: "50%",
                  width: "45px",
                  height: "45px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <SkipForward size={20} color="#fff" />
              </button>
            </div>

            {/* Visualizer FX Panel - moved to bottom right */}
            <div style={{
              position: "absolute",
              bottom: "180px",
              right: "25px",
              background: "rgba(0,0,0,0.8)",
              padding: "15px",
              borderRadius: "15px",
              border: "1px solid #333",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              width: "150px",
              zIndex: 20
            }}>
              <div style={{ fontSize: "10px", color: "#39ff14", fontWeight: "bold", textAlign: "center" }}>
                VISUALIZER FX
              </div>
              <div style={{ fontSize: "9px", color: "#888", textAlign: "center" }}>Speed</div>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={vSpeed}
                onChange={(e) => setVSpeed(parseFloat(e.target.value))}
                style={{ accentColor: "#39ff14" }}
              />
              <div style={{ fontSize: "9px", color: "#888", textAlign: "center" }}>Intensity</div>
              <input
                type="range"
                min="10"
                max="400"
                step="1"
                value={vIntensity}
                onChange={(e) => setVIntensity(parseInt(e.target.value))}
                style={{ accentColor: "#39ff14" }}
              />
              <div style={{ fontSize: "9px", color: "#888", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <Volume2 size={12} /> Volume
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{ accentColor: "#39ff14" }}
              />
            </div>

            <div style={{
              height: "100vh",
              padding: "120px 20px 220px 20px",
              overflowY: "auto",
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              justifyContent: "center"
            }}>
              {notes.map((n, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: n.color,
                    color: "#222",
                    padding: "15px",
                    width: "120px",
                    height: "120px",
                    fontWeight: "bold",
                    boxShadow: "8px 8px 0 rgba(0,0,0,0.2)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ fontSize: "14px", wordBreak: "break-word", flex: 1 }}>{n.text}</div>
                  <div style={{ fontSize: "10px", opacity: 0.7, textAlign: "right", marginTop: "8px" }}>
                    - {n.author || "Anonymous"}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              position: "absolute",
              bottom: "0",
              left: 0,
              right: 0,
              padding: "20px 20px 40px 20px",
              background: "linear-gradient(transparent, #000 60%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "15px",
              zIndex: 20
            }}>
              <div style={{
                background: "#111",
                borderRadius: "50px",
                padding: "5px 15px",
                border: "1px solid #333",
                width: "100%",
                maxWidth: "420px",
                display: "flex"
              }}>
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="WRITE A POST-IT..."
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    flex: 1,
                    padding: "15px",
                    outline: "none"
                  }}
                />
                <button
                  onClick={addNote}
                  style={{ background: "none", border: "none", color: "#39ff14", cursor: "pointer" }}
                >
                  <Send size={24} />
                </button>
              </div>
              <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "520px" }}>
                <button
                  onClick={() => setActiveTab("trophy")}
                  style={{
                    flex: 1,
                    backgroundColor: "#222",
                    color: "#fff",
                    padding: "16px 10px",
                    borderRadius: "50px",
                    fontWeight: "900",
                    border: "1px solid #333",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "12px"
                  }}
                >
                  <Award size={16} /> RANKS
                </button>
                <button
                  onClick={() => setCurrentGame("menu")}
                  style={{
                    flex: 1,
                    backgroundColor: "#39ff14",
                    color: "#000",
                    padding: "16px 10px",
                    borderRadius: "50px",
                    fontWeight: "900",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "12px"
                  }}
                >
                  <Gamepad2 size={16} /> GAMES
                </button>
                <button
                  onClick={() => setShowPartnerSystem(true)}
                  style={{
                    flex: 1,
                    backgroundColor: partnerData ? "#ff6b9d" : "#c44569",
                    color: "#fff",
                    padding: "16px 10px",
                    borderRadius: "50px",
                    fontWeight: "900",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "12px",
                    position: "relative"
                  }}
                >
                  <HeartHandshake size={16} /> PARTNER
                  {pendingPartnerRequests > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      background: "#ff0000",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {pendingPartnerRequests}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowTrophyShop(true)}
                  style={{
                    flex: 1,
                    backgroundColor: "#ff00ff",
                    color: "#fff",
                    padding: "16px 10px",
                    borderRadius: "50px",
                    fontWeight: "900",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "12px"
                  }}
                >
                  <Gift size={16} /> SHOP
                </button>
              </div>
            </div>

            <AnimatePresence>
              {activeTab === 'trophy' && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.98)",
                    zIndex: 100,
                    padding: "40px 25px",
                    overflowY: "auto"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
                    <h2 style={{ color: "#39ff14", margin: 0 }}>LEADERBOARD</h2>
                    <X onClick={() => setActiveTab(null)} size={32} style={{ cursor: "pointer" }} />
                  </div>
                  <div style={{ maxWidth: "400px", margin: "auto" }}>
                    {Object.entries(leaderboard)
                      .sort((a: any, b: any) => b[1] - a[1])
                      .map(([name, wins], idx) => (
                        <div
                          key={name}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "15px",
                            borderBottom: "1px solid #222",
                            background: name === user.name ? "rgba(57, 255, 20, 0.1)" : "transparent"
                          }}
                        >
                          <span style={{ fontSize: "20px" }}>
                            {idx === 0 && "🥇 "}
                            {idx === 1 && "🥈 "}
                            {idx === 2 && "🥉 "}
                            {name}
                          </span>
                          <span style={{ color: "#39ff14", fontWeight: "bold", fontSize: "20px" }}>
                            {wins} WINS
                          </span>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {view === "ROOM" && currentGame === "menu" && (
          <motion.div key="game-menu" style={{ position: "relative", zIndex: 10 }}>
            <GameMenu
              onBack={() => setCurrentGame(null)}
              onSelectGame={(game) => {
                setMultiplayerSession(null);
                setCurrentGame(game);
              }}
              onOpenMultiplayer={() => setShowMultiplayer(true)}
              leaderboards={gameLeaderboards}
              userName={user.name}
            />
          </motion.div>
        )}

        {view === "ROOM" && currentGame && currentGame !== "menu" && (
          <motion.div key="game-play" style={{ position: "relative", zIndex: 10 }}>
            {renderGame()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multiplayer Manager Modal */}
      <MultiplayerManager
        userName={user.name}
        isOpen={showMultiplayer}
        onClose={() => setShowMultiplayer(false)}
        onJoinGame={handleJoinMultiplayerGame}
      />

      {/* Trophy Shop Modal */}
      <TrophyShop
        isOpen={showTrophyShop}
        onClose={() => setShowTrophyShop(false)}
        trophyPoints={trophyPoints}
        onPurchase={handlePurchaseReward}
      />

      {/* Reaction Animation */}
      <ReactionAnimation
        reaction={incomingReaction}
        onComplete={() => setIncomingReaction(null)}
      />

      {/* Game Leaderboard Modal */}
      {showLeaderboard && (
        <GameLeaderboard
          isOpen={!!showLeaderboard}
          onClose={() => setShowLeaderboard(null)}
          gameName={showLeaderboard.toUpperCase()}
          leaderboard={gameLeaderboards[showLeaderboard] || {}}
          userName={user.name}
        />
      )}

      {/* Partner System Modal */}
      <PartnerSystem
        userName={user.name}
        userAvatar={user.avatar}
        isOpen={showPartnerSystem}
        onClose={() => setShowPartnerSystem(false)}
        onSendReaction={handleSendPartnerReaction}
        onInviteToGame={handleInvitePartnerToGame}
      />
    </motion.div>
  );
};

export default AppLayout;
