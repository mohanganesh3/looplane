/**
 * Auth Slice - Redux State Management for Authentication
 * Handles user authentication state, login, logout, and profile updates
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  authChecked: false,
  requiresTwoFactor: false,
};

// Async Thunks

// Check authentication status
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/user/profile');
      if (response.data?.success && response.data?.user) {
        const userData = response.data.user;
        
        // Check if account is suspended or deleted
        if (userData.accountStatus === 'SUSPENDED' || userData.isSuspended) {
          return rejectWithValue('Account is suspended');
        }
        if (userData.accountStatus === 'DELETED') {
          return rejectWithValue('Account is deleted');
        }
        
        return userData;
      }
      return rejectWithValue('Not authenticated');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Authentication check failed');
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, otp }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/login', { email, password, otp });
      if (response.data?.success) {
        return response.data.user;
      }
      return rejectWithValue(response.data?.message || 'Login failed');
    } catch (error) {
      // Check for two-factor auth requirement
      if (error.response?.status === 403 && error.response?.data?.requiresTwoFactor) {
        return rejectWithValue({ requiresTwoFactor: true, message: error.response.data.message });
      }
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Register user
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      if (response.data?.success) {
        if (response.data.userId) {
          localStorage.setItem('pendingUserId', response.data.userId);
        }
        return response.data;
      }
      return rejectWithValue(response.data?.message || 'Registration failed');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/api/auth/logout');
      localStorage.removeItem('pendingUserId');
      return null;
    } catch (error) {
      // Still logout locally even if API fails
      localStorage.removeItem('pendingUserId');
      return null;
    }
  }
);

// Update profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/user/profile', profileData);
      if (response.data?.success) {
        // Fetch updated user data
        const userResponse = await api.get('/api/user/profile');
        return userResponse.data?.user;
      }
      return rejectWithValue(response.data?.message || 'Update failed');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Profile update failed');
    }
  }
);

// Update profile picture
export const updateProfilePicture = createAsyncThunk(
  'auth/updateProfilePicture',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/user/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: [(data) => data]
      });
      if (response.data?.success) {
        return response.data.profilePhoto;
      }
      return rejectWithValue(response.data?.message || 'Upload failed');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Picture upload failed');
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set user directly (for context sync)
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.authChecked = true;
    },
    // Clear user (logout sync)
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Update user locally
    updateUserLocal: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    // Reset two-factor requirement
    resetTwoFactor: (state) => {
      state.requiresTwoFactor = false;
    },
    // Set loading
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.authChecked = true;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.authChecked = true;
        state.error = null; // Don't show error for auth check failure
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.requiresTwoFactor = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.requiresTwoFactor = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        if (action.payload?.requiresTwoFactor) {
          state.requiresTwoFactor = true;
          state.error = action.payload.message;
        } else {
          state.error = action.payload || 'Login failed';
        }
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Profile Picture
      .addCase(updateProfilePicture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfilePicture.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          if (!state.user.profile) state.user.profile = {};
          state.user.profile.photo = action.payload;
        }
        state.error = null;
      })
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setUser, clearUser, clearError, updateUserLocal, resetTwoFactor, setLoading } = authSlice.actions;
export default authSlice.reducer;
