import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Timer from "../components/Timer";
import Insights from "../components/Insights";
import BreathingExercise from "../components/BreathingExcercise";
import { saveMeditationSession } from "../utils/meditationStorage";
// import { current } from "@reduxjs/toolkit";

const CalmSpace = () => {
  const [activeSound, setActiveSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(5);
  const [meditating, setMeditating] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // 🎵 Audio Refs
  const rainAudio = useRef(new Audio("/sounds/rain.mp3"));
  const forestAudio = useRef(new Audio("/sounds/forest.mp3"));
  const wavesAudio = useRef(new Audio("/sounds/waves.mp3"));
  const audios = { rain: rainAudio, forest: forestAudio, waves: wavesAudio };

  // Configure looping and default volume
  useEffect(() => {
    Object.values(audios).forEach((ref) => {
      ref.current.loop = true;
      ref.current.volume = 0.5;
    });
  }, []);

  // 🕹️ Sound control logic
  const handleSound = (type) => {
    // Pause all sounds first
    stopAll();
    setActiveSound(type);
    setIsPlaying(true);
    audios[type].current.play();
  };

  const stopAll = () => {
    Object.values(audios).forEach((ref) => {
      ref.current.pause();
      ref.current.currentTime = 0;
    });
    setIsPlaying(false);
    setActiveSound(null);
  };

  // ⏱️ Save meditation session
  const handleComplete = () => {
    saveMeditationSession(activeSound, duration);
    setMeditating(false);
    stopAll();
  };

  // 🔄 Reset intro screen once user interacts
  const handleEnterApp = () => setShowIntro(false);

  // 🧘 Meditation Screen
  if (meditating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden text-white"
        style={{
          background: "linear-gradient(to bottom, #4c9acd, #1e3a8a)",
        }}
      >
        <AnimatePresence>
          {activeSound && (
            <motion.div
              key={activeSound}
              style={{
                backgroundImage: `url(/animations/${activeSound}.gif)`,
              }}
              className="absolute inset-0 bg-cover bg-center opacity-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
          )}
        </AnimatePresence>

        <Timer
          duration={duration}
          onComplete={handleComplete}
          onBack={() => {
            setMeditating(false);
            stopAll();
          }}
        />
      </motion.div>
    );
  }

  // 📊 Insights Screen
  if (showInsights) {
    return <Insights onBack={() => setShowInsights(false)} />;
  }

  // 🌬️ Breathing Exercise Screen
  if (showBreathing) {
    return <BreathingExercise onBack={() => setShowBreathing(false)} />;
  }

  // 🪷 Intro / Onboarding Screen
  if (showIntro) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-screen flex flex-col items-center justify-center bg-linear-to-b from-blue-100 to-blue-400 text-gray-800 text-center px-8"
      >
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-bold mb-6 text-blue-900"
        >
          Welcome to Calm Space 🌿
        </motion.h1>
        <p className="text-lg max-w-md leading-relaxed mb-8 text-gray-700">
          Relax your mind, focus your breath, and find your inner peace. Choose
          soothing sounds, meditate, or try guided breathing exercises.
        </p>
        <motion.button
          onClick={handleEnterApp}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all"
        >
          Enter Calm Space
        </motion.button>
      </motion.div>
    );
  }

  // 🌄 Main CalmSpace Interface
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-screen bg-linear-to-b from-gray-50 to-blue-300 flex flex-col items-center gap-6 py-8 relative overflow-hidden text-gray-800"
    >
      <h1 className="text-4xl font-bold z-10 text-blue-900 drop-shadow-sm">
        Calm Space
      </h1>

      {/* 🌧️ Sound Selection */}
      <div className="flex flex-wrap justify-center gap-4 z-10">
        {[
          { icon: "🌧️", label: "Rain", type: "rain" },
          { icon: "🌳", label: "Forest", type: "forest" },
          { icon: "🌊", label: "Waves", type: "waves" },
        ].map((item) => (
          <button
            key={item.type}
            onClick={() => handleSound(item.type)}
            className={`h-28 w-24 flex flex-col items-center justify-between rounded-xl border border-white/20 backdrop-blur-lg shadow-md transition-all ${
              activeSound === item.type
                ? "bg-white/70 scale-105 shadow-lg"
                : "bg-white/40 hover:bg-white/60"
            }`}
          >
            <div className="text-5xl">{item.icon}</div>
            <p className="font-semibold">{item.label}</p>
          </button>
        ))}
      </div>

      {/* 🕒 Duration Buttons */}
      <div className="flex gap-3 mt-4 z-10 px-2.5">
        {[5, 10, 15, 20].map((min) => (
          <button
            key={min}
            onClick={() => setDuration(min)}
            className={`px-5 py-2 rounded-lg border text-sm font-semibold transition-all ${
              duration === min
                ? "bg-blue-600 text-white border-blue-700"
                : "bg-white/40 text-gray-800 hover:bg-white/70"
            }`}
          >
            {min} min
          </button>
        ))}
      </div>

      {/* 🎬 Start / 🛑 Stop Buttons */}
      <div className="flex gap-2 items-center z-10">
        {/* 🎬 Start Meditation */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!activeSound}
          onClick={() => setMeditating(true)}
          className={`z-10 mt-4 px-6 py-3 rounded-md font-semibold shadow-md transition-all ${
            activeSound
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          Start Meditation
        </motion.button>

        {/* 🛑 Stop Sound */}
        {isPlaying && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={stopAll}
            className="z-10 mt-4 px-6 py-3 bg-red-600 text-white rounded-md font-semibold shadow-md hover:bg-red-700 transition-all"
          >
            Stop Sound
          </motion.button>
        )}
      </div>

      {/* 📈 View Insights & 🌬️ Breathing Exercises */}
      <div className="flex gap-4 mt-3 z-10 px-4">
        {/* 📈 View Insights */}
        <button
          onClick={() => setShowInsights(true)}
          className="z-10 mt-3 px-6 py-3 bg-purple-600 text-white rounded-md font-semibold shadow-md hover:bg-purple-700 transition-all"
        >
          View Insights
        </button>

        {/* 🌬️ Breathing Exercises */}
        <button
          onClick={() => setShowBreathing(true)}
          className="z-10 mt-3 px-6 py-3 bg-blue-600 text-white rounded-md font-semibold shadow-md hover:bg-blue-700 transition-all"
        >
          Breathing Exercises 🌬️
        </button>
      </div>


      {/* 🆘 Emergency Help */}
      <button
        type="button"
        className="z-10 mt-4 px-6 py-3 bg-red-600 text-white rounded-md font-semibold shadow-md hover:bg-red-700 transition-all"
        onClick={() => alert("If you’re feeling overwhelmed, please reach out to a trusted friend, family member, or local helpline 💜")}
      >
        Emergency Help?
      </button>

      {/* Background animation for sound */}
      <AnimatePresence>
        {isPlaying && activeSound && (
          <motion.div
            key={activeSound}
            style={{
              backgroundImage: `url(/animations/${activeSound}.gif)`,
            }}
            className="absolute inset-0 bg-cover bg-center opacity-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CalmSpace;
