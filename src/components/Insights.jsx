import { motion, AnimatePresence } from "framer-motion";
import { getMeditationData } from "../utils/meditationStorage";

const Insights = ({ onBack }) => {
  const { sessions = [], best = 0 } = getMeditationData();
  const total = sessions.reduce((acc, s) => acc + s.duration, 0);
  const avg = sessions.length ? (total / sessions.length).toFixed(1) : 0;

  const lastFive = [...sessions]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const hasSessions = sessions.length > 0;

  return (
    <div className="w-full min-h-screen bg-linear-to-b from-blue-100 via-blue-200 to-blue-400 flex flex-col items-center py-10 text-gray-800 overflow-y-auto">
      {/* Header */}
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl font-bold mb-6 text-blue-900 drop-shadow-sm"
      >
        🧘 Meditation Insights
      </motion.h1>

      {/* Stats Section */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white/50 backdrop-blur-lg rounded-2xl p-6 shadow-lg w-80 text-center border border-white/30"
      >
        <p className="text-lg font-medium mb-1">🌟 Best Session: <span className="font-bold">{best}</span> min</p>
        <p className="text-lg font-medium mb-1">⏳ Total Time: <span className="font-bold">{total}</span> min</p>
        <p className="text-lg font-medium">📊 Average: <span className="font-bold">{avg}</span> min/session</p>
      </motion.div>

      {/* Session History */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl mt-8 font-semibold text-blue-900"
      >
        Recent Sessions
      </motion.h2>

      <AnimatePresence>
        {hasSessions ? (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-80 mt-4 space-y-3"
          >
            {lastFive.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="bg-white/40 backdrop-blur-md p-3 rounded-lg shadow-sm border border-white/30 hover:bg-white/60 transition-all"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-700">
                    #{sessions.length - i} — {s.type}
                  </p>
                  <span className="text-sm text-blue-800 font-medium">
                    {s.duration} min
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(s.timestamp).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-gray-700 italic text-center bg-white/40 rounded-lg px-4 py-3 w-80"
          >
            No sessions yet — your journey starts today 🌱
          </motion.p>
        )}
      </AnimatePresence>

      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="mt-10 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all"
      >
        ← Back
      </motion.button>
    </div>
  );
};

export default Insights;
