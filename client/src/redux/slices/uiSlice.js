/**
 * UI Slice - Redux State Management for UI State
 * Handles loading states, modals, theme, and global UI settings
 */

import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  theme: 'light',
  sidebarOpen: false,
  activeModal: null,
  modalData: null,
  globalLoading: false,
  alerts: [],
  searchQuery: '',
  mobileMenuOpen: false
};

// UI Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Toggle theme
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    // Set theme
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    // Toggle sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    // Set sidebar
    setSidebar: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    // Open modal
    openModal: (state, action) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    // Close modal
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    // Set global loading
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    // Add alert
    addAlert: (state, action) => {
      state.alerts.push({
        id: Date.now(),
        ...action.payload
      });
    },
    // Remove alert
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },
    // Clear all alerts
    clearAlerts: (state) => {
      state.alerts = [];
    },
    // Set search query
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    // Toggle mobile menu
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    // Set mobile menu
    setMobileMenu: (state, action) => {
      state.mobileMenuOpen = action.payload;
    }
  }
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebar,
  openModal,
  closeModal,
  setGlobalLoading,
  addAlert,
  removeAlert,
  clearAlerts,
  setSearchQuery,
  toggleMobileMenu,
  setMobileMenu
} = uiSlice.actions;
export default uiSlice.reducer;
