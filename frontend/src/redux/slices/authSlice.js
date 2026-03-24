import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../utils/api';
import toast from 'react-hot-toast';

// Helper to save auth state to localStorage
const saveAuth = (token, user, role) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({ ...user, role }));
};

const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const loginAdmin = createAsyncThunk('auth/loginAdmin', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/admin/login', data);
    const { token, admin } = res.data;
    saveAuth(token, admin, 'admin');
    return { token, user: { ...admin, role: 'admin' } };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const loginPainter = createAsyncThunk('auth/loginPainter', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/painter/login', data);
    const { token, painter } = res.data;
    saveAuth(token, painter, 'painter');
    return { token, user: { ...painter, role: 'painter' } };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const loginUser = createAsyncThunk('auth/loginUser', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/user/login', data);
    const { token, user } = res.data;
    saveAuth(token, user, 'user');
    return { token, user: { ...user, role: 'user' } };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/user/register', data);
    const { token, user } = res.data;
    saveAuth(token, user, 'user');
    return { token, user: { ...user, role: 'user' } };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const registerPainter = createAsyncThunk('auth/registerPainter', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/painter/register', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

const savedUser = (() => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    user: savedUser,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      clearAuth();
      state.token = null;
      state.user = null;
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const fulfilled = (state, action) => {
      state.loading = false;
      if (action.payload.token) {
        state.token = action.payload.token;
        state.user = action.payload.user;
      }
    };
    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
      toast.error(action.payload);
    };

    [loginAdmin, loginPainter, loginUser, registerUser, registerPainter].forEach((thunk) => {
      builder.addCase(thunk.pending, pending);
      builder.addCase(thunk.fulfilled, fulfilled);
      builder.addCase(thunk.rejected, rejected);
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
