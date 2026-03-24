import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../utils/api';

export const fetchAuctions = createAsyncThunk('auction/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await API.get('/user/auctions', { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch auctions');
  }
});

export const fetchAuction = createAsyncThunk('auction/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await API.get(`/user/auctions/${id}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const auctionSlice = createSlice({
  name: 'auction',
  initialState: {
    auctions: [],
    selectedAuction: null,
    bids: [],
    total: 0,
    pages: 1,
    page: 1,
    loading: false,
    error: null,
    filters: { status: '', category: '', search: '' },
  },
  reducers: {
    setFilters(state, action) { state.filters = { ...state.filters, ...action.payload }; },
    updateCurrentBid(state, action) {
      const { amount, bidder, timestamp } = action.payload;
      if (state.selectedAuction) {
        state.selectedAuction.currentBid = amount;
        state.bids = [{ amount, user: { name: bidder }, createdAt: timestamp, _id: Date.now() }, ...state.bids];
      }
    },
    updateAuctionStatus(state, action) {
      if (state.selectedAuction) state.selectedAuction.status = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuctions.pending, (s) => { s.loading = true; })
      .addCase(fetchAuctions.fulfilled, (s, a) => {
        s.loading = false;
        s.auctions = a.payload.auctions;
        s.total = a.payload.total;
        s.pages = a.payload.pages;
        s.page = a.payload.page;
      })
      .addCase(fetchAuctions.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchAuction.pending, (s) => { s.loading = true; })
      .addCase(fetchAuction.fulfilled, (s, a) => {
        s.loading = false;
        s.selectedAuction = a.payload.auction;
        s.bids = a.payload.bids;
      })
      .addCase(fetchAuction.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { setFilters, updateCurrentBid, updateAuctionStatus } = auctionSlice.actions;
export default auctionSlice.reducer;
