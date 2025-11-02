import { createSlice } from "@reduxjs/toolkit";

const loadFromLocalStorage = () => {
  try {
    const data = localStorage.getItem("companionAI_chat");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToLocalStorage = (messages) => {
  try {
    localStorage.setItem("companionAI_chat", JSON.stringify(messages));
  } catch {}
};

const initialState = {
  messages: loadFromLocalStorage(),
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
      saveToLocalStorage(action.payload);
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
      saveToLocalStorage(state.messages);
    },
    clearMessages: (state) => {
      state.messages = [];
      saveToLocalStorage([]);
    },
  },
});

export const { setMessages, addMessage, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
