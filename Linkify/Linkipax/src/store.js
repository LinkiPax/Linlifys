import { configureStore } from "@reduxjs/toolkit";
import messageReducer from "./MessageSlice"; // Update with the correct path

const store = configureStore({
  reducer: {
    messages: messageReducer, // Add message reducer here
  },
});

export default store;
