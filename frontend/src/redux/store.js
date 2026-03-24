import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import auctionReducer from './slices/auctionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    auction: auctionReducer,
  },
});
