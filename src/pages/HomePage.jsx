import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { RiChatAiFill, RiRefreshLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import quotes from "../data/quotes.json";

const HomePage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [message, setMessage] = useState("");
  const [author, setAuthor] = useState("");
  const [bgColor, setBgColor] = useState(() => localStorage.getItem("bgColor") || "#ffffff");
  const [textColor, setTextColor] = useState(() => localStorage.getItem("textColor") || "#000000");
  const [moodHistory, setMoodHistory] = useState(() => JSON.parse(localStorage.getItem("moodHistory")) || []);
  const [currentMood, setCurrentMood] = useState(null);

  // 🎯 Mood data
  const moods = [
    { emoji: "😭", desc: "Terrible", bg: "#2e2e2e", text: "#ffffff" },
    { emoji: "😞", desc: "Bad", bg: "#ffb3b3", text: "#222222" },
    { emoji: "😐", desc: "Neutral", bg: "#e0e0e0", text: "#222222" },
    { emoji: "🙂", desc: "Okay", bg: "#fff3b0", text: "#222222" },
    { emoji: "😊", desc: "Good", bg: "#b6f0c1", text: "#222222" },
    { emoji: "🤩", desc: "Excellent", bg: "#357edd", text: "#ffffff" },
  ];

  // 💬 Load a random quote
  const loadRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setMessage(quotes[randomIndex].quote);
    setAuthor(quotes[randomIndex].author);
  };

  useEffect(() => {
    loadRandomQuote();
  }, []);

  // 💾 Persist color preferences
  useEffect(() => {
    localStorage.setItem("bgColor", bgColor);
    localStorage.setItem("textColor", textColor);
  }, [bgColor, textColor]);

  // 💾 Save mood history
  const handleMoodClick = (mood) => {
    setBgColor(mood.bg);
    setTextColor(mood.text);
    setCurrentMood(mood.desc);

    const newHistory = [
      { mood: mood.desc, timestamp: new Date().toISOString() },
      ...moodHistory.slice(0, 4),
    ];
    setMoodHistory(newHistory);
    localStorage.setItem("moodHistory", JSON.stringify(newHistory));
  };

  if (!isLoaded) return <p className="text-center mt-20">Loading...</p>;
  if (!isSignedIn) return <p className="text-center mt-20">Please sign in to continue</p>;

  return (
    <motion.div
      className="min-h-screen w-full flex flex-col gap-8 items-center px-4 py-6 transition-colors duration-700"
      style={{ backgroundColor: bgColor, color: textColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 🧠 Quote Section */}
      <div className="w-full md:w-2/3 lg:w-1/2 px-3.5 py-4 border-l-4 border-amber-500 bg-white/20 rounded-md shadow-sm relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-lg font-medium italic">“{message}”</p>
            <p className="text-right font-semibold mt-2">— {author}</p>
          </motion.div>
        </AnimatePresence>
        <button
          onClick={loadRandomQuote}
          className="absolute top-3 right-3 p-2 bg-amber-400/80 rounded-full hover:bg-amber-500 transition-all"
          title="New Quote"
        >
          <RiRefreshLine className="text-white text-lg" />
        </button>
      </div>

      {/* 👋 Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome, {user.firstName} 👋</h1>
        <p className="text-md mt-2 opacity-80">How are you feeling today?</p>
      </div>

      {/* 😊 Mood Selector */}
      <div className="flex flex-wrap justify-center gap-3">
        {moods.map((mood) => (
          <motion.button
            key={mood.desc}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMoodClick(mood)}
            className={`text-5xl p-3 rounded-lg border border-transparent transition-all ${
              currentMood === mood.desc ? "scale-110 bg-white/30" : "hover:bg-white/20"
            }`}
            style={{ color: textColor }}
          >
            <span role="img" aria-label={mood.desc}>
              {mood.emoji}
            </span>
            <p className="text-sm">{mood.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* 🧘 Motivation Box */}
      <motion.div
        className="relative mt-6 px-6 py-4 md:w-3/4 lg:w-1/2 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 rounded-xl shadow-lg text-center text-white overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-lg font-semibold">
          Remember, deep breaths help slow your heartbeat 💖
        </p>
        <RiChatAiFill className="absolute bottom-4 right-4 text-white/80 text-2xl" />
      </motion.div>

      {/* 🕒 Mood History */}
      {moodHistory.length > 0 && (
        <div className="mt-6 w-full md:w-1/2 bg-white/20 rounded-lg p-4 shadow-inner text-center">
          <h3 className="font-semibold mb-2 text-lg">Recent Mood History</h3>
          <ul className="space-y-1 text-sm">
            {moodHistory.map((entry, idx) => (
              <li key={idx} className="opacity-80">
                {entry.mood} — {new Date(entry.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default HomePage;
