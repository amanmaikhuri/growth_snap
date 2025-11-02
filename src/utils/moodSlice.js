import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  aiMood: "neutral", // could be: happy, empathetic, reflective, supportive, etc.
};

const moodSlice = createSlice({
  name: "mood",
  initialState,
  reducers: {
    setAIMood: (state, action) => {
      state.aiMood = action.payload;
    },
  },
});

export const { setAIMood } = moodSlice.actions;
export default moodSlice.reducer;
