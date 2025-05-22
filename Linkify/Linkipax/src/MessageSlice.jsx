import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    list: [], // Changed from 'messages' to 'list' to avoid confusion
    unreadCount: 0,
    typingStatus: false,
    currentConversation: null,
    loading: false,
    error: null
  },
  reducers: {
    setMessages: (state, action) => { 
      state.list = action.payload;
      state.loading = false;
      state.error = null;
    },
    addMessage: (state, action) => {
      state.list.push(action.payload);
    },
    markMessagesAsRead: (state, action) => {
      const messageIds = action.payload;
      state.list = state.list.map(message => {     
        if (messageIds.includes(message._id)) {
          return { ...message, isRead: true };
        }
        return message;
      });
    },
    setTypingStatus: (state, action) => {
      state.typingStatus = action.payload;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearMessages: (state) => {
      state.list = [];
      state.unreadCount = 0;
      state.typingStatus = false;
    }
  }
});

export const { 
  setMessages, 
  addMessage, 
  markMessagesAsRead,
  setTypingStatus,
  setUnreadCount,
  setLoading,
  setError,
  clearMessages 
} = messageSlice.actions;

export const selectMessages = state => state.messages.list;
export const selectUnreadCount = state => state.messages.unreadCount;
export const selectTypingStatus = state => state.messages.typingStatus;
export const selectMessagesLoading = state => state.messages.loading;
export const selectMessagesError = state => state.messages.error;

export default messageSlice.reducer;