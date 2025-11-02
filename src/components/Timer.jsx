import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Timer = ({ duration = 5, onComplete, onBack }) => {
  // duration in minutes
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Format time as mm:ss
  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Start / stop logic
  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, onComplete]);

  // Reset function
  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setTimeLeft(duration * 60);
  };

  // Calculate progress (0 to 1)
  const progress = (timeLeft / (duration * 60)) * 100;

  return (
    <div className="flex flex-col items-center gap-6 mt-6 text-white z-10">
      {/* Timer Circle */}
      <motion.div
        animate={{ scale: running ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 4, repeat: running ? Infinity : 0, ease: "easeInOut" }}
        className="relative w-48 h-48 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center"
      >
        {/* Animated progress ring */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-green-400/70"
          style={{
            clipPath: `inset(${100 - progress}% 0 0 0 round 50%)`,
            opacity: running ? 1 : 0.4,
            transition: "clip-path 1s linear",
          }}
        ></motion.div>

        {/* Time text */}
        <p className="text-3xl font-bold">{formatTime(timeLeft)}</p>
      </motion.div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => setRunning((r) => !r)}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            running
              ? "bg-yellow-600 hover:bg-yellow-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {running ? "Pause" : "Start"}
        </button>

        <button
          onClick={resetTimer}
          className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition-all"
        >
          Reset
        </button>

        <button
          onClick={() => {
            resetTimer();
            onBack?.();
          }}
          className="px-6 py-3 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-all"
        >
          Stop Meditation
        </button>
      </div>
    </div>
  );
};

export default Timer;
