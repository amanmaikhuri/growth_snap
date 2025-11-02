import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 🌬️ Breathing Patterns
const patterns = {
  "4-7-8 (Relax)": { inhale: 4, hold: 7, exhale: 8 },
  "Box (4-4-4-4)": { inhale: 4, hold: 4, exhale: 4, rest: 4 },
  "Calm Focus (5-5)": { inhale: 5, exhale: 5 },
  "Deep Relax (6-2-6)": { inhale: 6, hold: 2, exhale: 6 },
  "Energy Boost (3-3-3)": { inhale: 3, hold: 3, exhale: 3 },
  "Grounding (5-5-5-5)": { inhale: 5, hold: 5, exhale: 5, rest: 5 },
};

const phaseConfig = {
  inhale: { color: "#93c5fd", label: "Breathe In Slowly" },
  hold: { color: "#bfdbfe", label: "Hold Your Breath" },
  exhale: { color: "#60a5fa", label: "Exhale Gently" },
  rest: { color: "#3b82f6", label: "Rest and Relax" },
};

const BreathingExercise = ({ onBack }) => {
  const [pattern, setPattern] = useState("4-7-8 (Relax)");
  const [phase, setPhase] = useState("inhale");
  const [timeLeft, setTimeLeft] = useState(patterns[pattern].inhale);
  const [running, setRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [showTips, setShowTips] = useState(true);
  const [ambientOn, setAmbientOn] = useState(false);

  const intervalRef = useRef(null);
  const ambientAudio = useRef(new Audio("/sounds/soft_wind.mp3"));

  // Initialize audio
  useEffect(() => {
    const audio = ambientAudio.current;
    audio.loop = true;
    audio.volume = 0.3;
    return () => audio.pause();
  }, []);

  // Toggle ambient sound
  const toggleAmbient = () => {
    const audio = ambientAudio.current;
    if (ambientOn) {
      audio.pause();
      setAmbientOn(false);
    } else {
      audio.play();
      setAmbientOn(true);
    }
  };

  const startExercise = () => {
    setShowTips(false);
    setRunning(true);
  };

  const pauseExercise = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
  };

  const resetExercise = () => {
    clearInterval(intervalRef.current);
    const current = patterns[pattern];
    setPhase("inhale");
    setTimeLeft(current.inhale);
    setCycleCount(0);
    setRunning(false);
    setShowTips(true);
  };

  // Breathing phase logic
  useEffect(() => {
    if (!running) return;

    const current = patterns[pattern];

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          switch (phase) {
            case "inhale":
              if (current.hold) {
                setPhase("hold");
                return current.hold;
              }
              return current.exhale || current.inhale;
            case "hold":
              if (current.exhale) {
                setPhase("exhale");
                return current.exhale;
              }
              return current.rest || current.inhale;
            case "exhale":
              if (current.rest) {
                setPhase("rest");
                return current.rest;
              }
              setPhase("inhale");
              setCycleCount((c) => c + 1);
              return current.inhale;
            case "rest":
            default:
              setPhase("inhale");
              setCycleCount((c) => c + 1);
              return current.inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, pattern, phase]);

  const { color, label } = phaseConfig[phase];

  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-center text-gray-900 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: "linear-gradient(to bottom, #dbeafe, #60a5fa)" }}
    >
      {/* Floating Background Circles */}
      <motion.div
        animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 8 }}
        className="absolute w-[40rem] h-[40rem] rounded-full bg-blue-200 opacity-30 blur-3xl pointer-events-none -z-10"
      />
      <motion.div
        animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 10 }}
        className="absolute bottom-0 w-[35rem] h-[35rem] rounded-full bg-blue-300 opacity-30 blur-3xl pointer-events-none -z-10"
      />

      {/* Back Button */}
      <button
        onClick={() => {
          pauseExercise();
          ambientAudio.current.pause();
          onBack();
        }}
        className="absolute top-6 left-6 px-4 py-2 bg-gray-700 text-white rounded-md shadow hover:bg-gray-800 transition-all z-20"
        aria-label="Go back"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-6 text-blue-900 drop-shadow-sm z-20">
        Breathing Exercises 🌬️
      </h1>

      {/* Pattern Selector */}
      <select
        value={pattern}
        disabled={running}
        onChange={(e) => {
          setPattern(e.target.value);
          resetExercise();
        }}
        className="px-4 py-2 rounded-md mb-6 bg-white/80 shadow text-gray-800 focus:ring-2 focus:ring-blue-400 transition-all z-20"
      >
        {Object.keys(patterns).map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>

      {/* Animated Breathing Circle */}
      <motion.div
        animate={{
          scale:
            running
              ? phase === "inhale"
                ? 1.3
                : phase === "exhale"
                ? 0.9
                : 1
              : 1,
          backgroundColor: color,
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="w-60 h-60 rounded-full flex flex-col items-center justify-center text-center shadow-2xl text-white font-semibold border border-white/20 z-20"
        style={{ boxShadow: `0 0 60px ${color}90` }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <p className="text-xl capitalize tracking-wide">{label}</p>
            <p className="text-3xl font-bold mt-1">{timeLeft}s</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Motivational Tip */}
      <AnimatePresence>
        {showTips && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="mt-6 italic text-sm text-blue-900 text-center px-4 z-20"
          >
            Find a comfortable position, close your eyes, and focus on your breath 🌸
          </motion.p>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-4 mt-10 flex-wrap justify-center z-20">
        {!running ? (
          <button
            onClick={startExercise}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
          >
            Start
          </button>
        ) : (
          <button
            onClick={pauseExercise}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-all"
          >
            Pause
          </button>
        )}

        <button
          onClick={resetExercise}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
        >
          Reset
        </button>

        <button
          onClick={toggleAmbient}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            ambientOn ? "bg-purple-600 text-white" : "bg-purple-300 text-gray-800"
          } hover:scale-105`}
        >
          {ambientOn ? "Stop Sound" : "Play Ambient 🎵"}
        </button>
      </div>

      {/* Progress */}
      <p className="mt-6 text-sm text-blue-900 z-20">
        Completed Cycles: <span className="font-bold">{cycleCount}</span>
      </p>
    </motion.div>
  );
};

export default BreathingExercise;
