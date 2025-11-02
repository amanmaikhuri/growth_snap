import { configureStore } from "@reduxjs/toolkit";
import moodReducer from "./moodSlice";
import chatReducer from "./chatSlice";

const store = configureStore({
  reducer: {
    mood: moodReducer,
    chat: chatReducer,
  },
});

export default store;
