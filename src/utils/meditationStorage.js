// Handles saving & fetching meditation data from localStorage

export const saveMeditationSession = (type, duration) => {
  const newSession = {
    id: Date.now(),
    type,
    duration,
    timestamp: new Date().toISOString(),
  };

  const sessions = JSON.parse(localStorage.getItem("meditationSessions")) || [];

  const updatedSessions = [newSession, ...sessions].slice(0, 5); // keep last 5
  localStorage.setItem("meditationSessions", JSON.stringify(updatedSessions));

  // Update best record
  const best = JSON.parse(localStorage.getItem("bestRecord")) || 0;
  if (duration > best) localStorage.setItem("bestRecord", JSON.stringify(duration));
};

export const getMeditationData = () => {
  const sessions = JSON.parse(localStorage.getItem("meditationSessions")) || [];
  const best = JSON.parse(localStorage.getItem("bestRecord")) || 0;
  return { sessions, best };
};
