// Shree.jsx
import {
  LuDelete,
  LuSend,
  LuClock,
  LuTrash2,
  LuCopy,
  LuShare2,
} from "react-icons/lu";
import { AiOutlineEdit } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import localforage from "localforage";
import { useUser } from "@clerk/clerk-react";

const STORAGE_KEY = "shree_chats_v1";
const STORAGE_THRESHOLD_BYTES = 200 * 1024 * 1024;
const SAFE_MARGIN = 0.9;

function generateId() {
  return (
    (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
    "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}

const CompanionAI = () => {
  const {isLoaded, isSignedIn, user  } = useUser();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userMsg, setUserMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [visibleActionId, setVisibleActionId] = useState(null); // for tap/click to show actions
  const chatRef = useRef(null);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // === LocalForage setup ===
  useEffect(() => {
    localforage.config({ name: "ShreeAI", storeName: "shree_ai_store" });
  }, []);

  // === Load chats on mount ===
  useEffect(() => {
    (async () => {
      try {
        const saved = (await localforage.getItem(STORAGE_KEY)) || [];
        if (saved.length > 0) {
          setChats(saved);
          setActiveChatId(saved[0].id);
        } else {
          const displayName =
            isLoaded && isSignedIn
              ? user.firstName || user.username || "Friend"
              : "Guest";
          const initial = createNewChat(
            `Hello ${displayName}, I'm Shree. How are you feeling today?`,
            true
          );
          setChats([initial]);
          setActiveChatId(initial.id);
          await localforage.setItem(STORAGE_KEY, [initial]);
        }
      } catch (err) {
        console.error("Failed to load chats", err);
      }
    })();
  }, [isLoaded, isSignedIn, user]);

  // === Auto-save chats (debounced) ===
  useEffect(() => {
    const t = setTimeout(() => saveChats(chats), 400);
    return () => clearTimeout(t);
  }, [chats]);

  // === Scroll detection (to avoid auto-scroll while user is reading) ===
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom =
        Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 10;
      setIsUserScrolling(!atBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // === Helpers ===
  function createNewChat(initialAiText = "Hello! How can I help you?", greeting = false) {
    const chatId = generateId();
    return {
      id: chatId,
      title: greeting ? "Welcome" : "New Chat",
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      messages: [
        {
          id: generateId(),
          role: "ai",
          text: initialAiText,
          createdAt: Date.now(),
        },
      ],
    };
  }

  async function saveChats(currentChats) {
    try {
      const serialized = JSON.stringify(currentChats || []);
      const newSize = new TextEncoder().encode(serialized).length;
      const { quota = 0 } = (await navigator.storage?.estimate()) || {};
      const effectiveQuota = quota || STORAGE_THRESHOLD_BYTES;

      if (
        newSize > STORAGE_THRESHOLD_BYTES ||
        newSize > effectiveQuota * SAFE_MARGIN
      ) {
        const ok = window.confirm(
          `Storage may exceed ${(STORAGE_THRESHOLD_BYTES / (1024 * 1024)).toFixed(
            0
          )} MB. Delete oldest chats?`
        );
        if (ok) {
          let trimmed = [...currentChats];
          while (trimmed.length > 1) {
            trimmed.sort((a, b) => a.createdAt - b.createdAt);
            trimmed.shift();
            const serializedTrim = JSON.stringify(trimmed);
            const newTrimSize = new TextEncoder().encode(serializedTrim).length;
            if (
              newTrimSize <= STORAGE_THRESHOLD_BYTES &&
              (!quota || newTrimSize < quota * SAFE_MARGIN)
            )
              break;
          }
          setChats(trimmed);
          await localforage.setItem(STORAGE_KEY, trimmed);
          return;
        }
      }

      await localforage.setItem(STORAGE_KEY, currentChats || []);
    } catch (err) {
      console.error("Error saving chats", err);
    }
  }

  const getActiveChat = () => chats.find((c) => c.id === activeChatId) || null;

  function updateChat(updatedChat) {
    setChats((prev) =>
      prev.map((c) =>
        c.id === updatedChat.id ? { ...updatedChat, lastUpdated: Date.now() } : c
      )
    );
  }

  // === AI interaction ===
  async function sendAiQuery(prompt) {
    if (!apiKey) return "Internal Server Error: missing API key.";
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `You are Shree, an empathetic assistant. Keep responses concise and kind. User says: ${prompt}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return `API error: ${err?.error?.message || "unknown"}`;
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "I’m sorry, I couldn’t understand that.";
      return text;
    } catch (err) {
      console.error(err);
      return "Network or server error.";
    }
  }

  // === Submit user message ===
  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const text = userMsg.trim();
    if (!text) return;

    const chat = getActiveChat();
    const userMessage = {
      id: generateId(),
      role: "user",
      text,
      createdAt: Date.now(),
    };

    if (!chat) {
      const newChat = createNewChat(
        `Hello ${isLoaded && isSignedIn ? (user.firstName || user.username) : "Guest"}, I'm Shree.`,
        true
      );
      newChat.messages.push(userMessage);
      setChats((p) => [newChat, ...p]);
      setActiveChatId(newChat.id);
      setUserMsg("");
      runAiForChat(newChat.id, text);
      return;
    }

    const updated = { ...chat, messages: [...chat.messages, userMessage] };
    updateChat(updated);
    setUserMsg("");
    runAiForChat(chat.id, text);
  };

  async function runAiForChat(chatId, userPrompt) {
    setIsTyping(true);
    const typingId = generateId();
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, { id: typingId, role: "ai-typing", text: "", createdAt: Date.now() }],
              lastUpdated: Date.now(),
            }
          : c
      )
    );

    const aiText = await sendAiQuery(userPrompt);

    // animated reveal (simple)
    let i = 0;
    let current = "";
    const speed = 6;
    const interval = setInterval(() => {
      if (i < aiText.length) {
        current += aiText.charAt(i++);
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== chatId) return c;
            const msgs = c.messages.map((m) => (m.id === typingId ? { ...m, text: current } : m));
            return { ...c, messages: msgs };
          })
        );
        if (!isUserScrolling && chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== chatId) return c;
            const msgs = c.messages.map((m) =>
              m.id === typingId ? { ...m, id: generateId(), role: "ai", text: aiText, createdAt: Date.now() } : m
            );
            return { ...c, messages: msgs, lastUpdated: Date.now() };
          })
        );
      }
    }, speed);
  }

  // === Message actions (operate on single message) ===
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // small non-blocking notification
      window.alert("Copied to clipboard");
    } catch {
      window.alert("Copy failed");
    }
  };

  const handleShare = async (text) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Shared from Shree", text });
      } else {
        await navigator.clipboard.writeText(`Shared from Shree:\n\n${text}`);
        window.alert("Share not supported — copied to clipboard instead.");
      }
    } catch {
      // ignore
    }
  };

  const handleEditMessage = async (chatId, messageId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    const msg = chat.messages.find((m) => m.id === messageId);
    if (!msg) return;
    if (msg.role !== "user") {
      window.alert("Only user messages can be edited.");
      return;
    }
    const newText = window.prompt("Edit your prompt:", msg.text);
    if (newText === null) return;
    const trimmed = newText.trim();
    if (!trimmed) {
      window.alert("Prompt cannot be empty.");
      return;
    }

    const updatedMsgs = chat.messages.map((m) => (m.id === messageId ? { ...m, text: trimmed, editedAt: Date.now() } : m));
    const updatedChat = { ...chat, messages: updatedMsgs, lastUpdated: Date.now() };
    updateChat(updatedChat);

    // remove the AI reply that followed the original message (if any)
    const idx = updatedMsgs.findIndex((m) => m.id === messageId);
    const maybeAiIdx = idx + 1;
    if (updatedMsgs[maybeAiIdx] && updatedMsgs[maybeAiIdx].role && updatedMsgs[maybeAiIdx].role.startsWith("ai")) {
      updatedChat.messages.splice(maybeAiIdx, 1);
    }
    updateChat(updatedChat);
    // rerun AI for the edited prompt
    runAiForChat(chatId, trimmed);
  };

  const handleDeleteMessage = (chatId, messageId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    if (!window.confirm("Delete this message?")) return;
    const updated = { ...chat, messages: chat.messages.filter((m) => m.id !== messageId), lastUpdated: Date.now() };
    updateChat(updated);
  };

  // === Chat-level actions ===
  const handleNewChat = () => {
    const displayName = isLoaded && isSignedIn ? user.firstName || user.username || "Friend" : "Guest";
    const newC = createNewChat(`Hello ${displayName}! I'm Shree.`, true);
    setChats((p) => [newC, ...p]);
    setActiveChatId(newC.id);
  };

  const handleClearActiveChat = () => {
    const chat = getActiveChat();
    if (!chat) return;
    if (!window.confirm("Clear this chat's messages? This cannot be undone.")) return;
    const reset = {
      ...chat,
      messages: [
        { id: generateId(), role: "ai", text: "Chat cleared! How are you feeling right now?", createdAt: Date.now() },
      ],
      lastUpdated: Date.now(),
    };
    updateChat(reset);
  };

  const handleDeleteChat = (chatId) => {
    if (!window.confirm("Delete this chat permanently?")) return;
    const remain = chats.filter((c) => c.id !== chatId);
    setChats(remain);
    if (activeChatId === chatId) {
      if (remain.length > 0) setActiveChatId(remain[0].id);
      else {
        const newChat = createNewChat("Hello! Start a new conversation when you're ready.", true);
        setChats([newChat]);
        setActiveChatId(newChat.id);
      }
    }
  };

  const handleClearAllChats = () => {
    if (!window.confirm("Clear all chats? This will remove every saved chat.")) return;
    const init = createNewChat("Hello! Start a new conversation when you're ready.", true);
    setChats([init]);
    setActiveChatId(init.id);
  };

  const handleCheckStorage = async () => {
    if (!navigator.storage?.estimate) {
      alert("Storage estimate not available in this browser.");
      return;
    }
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    alert(
      `Estimated usage: ${(usage / (1024 * 1024)).toFixed(2)} MB\nQuota: ${(quota / (1024 * 1024)).toFixed(2)} MB`
    );
  };

  // visibleActionId: toggle behavior for mobile tap
  const toggleActions = (msgId) => {
    setVisibleActionId((prev) => (prev === msgId ? null : msgId));
  };

  const activeChat = getActiveChat();

  // === Render ===
  return (
    <div className="h-[calc(100vh-64px)] w-full max-w-5xl mx-auto px-2 py-1 flex gap-3 overflow-x-hidden">
      {/* Sidebar */}
      <div
        className={`transition-all duration-200 ${isHistoryOpen ? "w-64" : "w-12"} bg-white/90 p-2 flex flex-col border-r-2 border-gray-500`}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setIsHistoryOpen((s) => !s)}
            className="p-1 rounded hover:bg-gray-100"
            title="Show Chat History"
          >
            <LuClock size={24}/>
          </button>
          {isHistoryOpen && (
            <div className="flex gap-1">
              <button
                onClick={handleNewChat}
                className="w-18 flex gap-2 items-center px-2 py-2 bg-green-500 text-white rounded text-sm"
              >
                <FaEdit size={24}/> New
              </button>
            </div>
          )}
        </div>

        {/* Buttons under history icon (visible when history open) */}
        {isHistoryOpen && (
          <div className="flex flex-col gap-2 mb-2">
            <button
              onClick={handleClearAllChats}
              className="w-full flex items-center gap-2 justify-center bg-red-500 text-white px-2 py-1 rounded text-sm"
            >
              <LuDelete /> Clear All
            </button>
            <button
              onClick={handleCheckStorage}
              className="w-full flex items-center gap-2 justify-center border px-2 py-1 rounded text-sm"
            >
              <LuTrash2 /> Check Storage
            </button>
          </div>
        )}

        {isHistoryOpen ? (
          <div className="flex-1 overflow-auto">
            {chats.length === 0 && <div className="text-sm italic">No chats yet</div>}
            <ul className="flex flex-col gap-2">
              {chats.map((chat) => (
                <li
                  key={chat.id}
                  className="flex items-center justify-between gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setIsHistoryOpen(false);
                  }}
                >
                  <div className="flex-1 w-[90%]">
                    <div className="font-medium text-sm">
                      {chat.title || new Date(chat.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {chat.messages[chat.messages.length - 1]?.text?.slice(0, 80)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                      title="Delete chat"
                      className="p-1 rounded hover:bg-red-50"
                    >
                      <LuTrash2 />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-xs text-gray-500 self-center mt-2">History</div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl px-1.5 font-mono italic text-purple-500 font-bold">Shree</h1>
            <p className="text-blue-500 text-xs">{"[ Your AI Companion ]"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearActiveChat}
              className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-md flex items-center gap-1"
            >
              <LuDelete size={16} /> Clear
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatRef}
          className="flex-1 p-2 mt-2 rounded-md flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 bg-white"
        >
          {!activeChat && <div className="italic text-gray-500">No active chat — start a new one.</div>}

          {activeChat?.messages.map((msg) => {
            const isUser = msg.role === "user";
            const showActions = visibleActionId === msg.id;
            return (
              <div
                key={msg.id}
                className={`relative px-2 py-1.5 rounded-md max-w-[95%] md:max-w-[80%] text-sm md:text-lg ${
                  isUser ? "ml-auto bg-blue-500 text-white rounded-bl-2xl" : "mr-auto bg-gray-300 text-black rounded-br-2xl"
                }`}
                onClick={() => toggleActions(msg.id)}
              >
                {msg.role.startsWith("ai") ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={{
                    code({ inline, children, ...props }) {
                      return inline ? (
                        <code className="px-1 rounded bg-black/10">{children}</code>
                      ) : (
                        <pre className="overflow-auto p-3 rounded-md border"><code {...props}>{children}</code></pre>
                      );
                    },
                    li: ({ children }) => <li className="ml-5 list-disc">{children}</li>,
                  }}>
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}

                {/* Actions container below each message */}
                <div
                  className={`mt-2 flex items-center gap-3 text-xs ${
                    showActions ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                  } transition-opacity`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleCopy(msg.text)}
                    title="Copy"
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <LuCopy size={16} />
                  </button>

                  <button
                    onClick={() => handleShare(msg.text)}
                    title="Share"
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <LuShare2 size={16} />
                  </button>

                  {isUser && (
                    <>
                      <button
                        onClick={() => handleEditMessage(activeChat.id, msg.id)}
                        title="Edit"
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <AiOutlineEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(activeChat.id, msg.id)}
                        title="Delete"
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <LuTrash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="mr-auto bg-gray-200 text-black rounded-br-2xl px-2 py-1 text-sm md:text-lg w-fit">
              <span className="opacity-70">Shree is typing…</span>
            </div>
          )}
        </div>

        {/* Input Box */}
        <form
          onSubmit={handleSubmit}
          className="py-2 flex gap-2 items-center mt-2 absolute bottom-0 left-0 right-0 bg-white px-2"
        >
          <textarea
            id="user-msg"
            placeholder="Type your message..."
            value={userMsg}
            onChange={(e) => setUserMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="w-full h-18 border border-blue-500 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={!userMsg.trim() || isTyping}
            className={`text-white p-3 rounded-md flex items-center justify-center transition ${
              userMsg.trim()
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <LuSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanionAI;
