"use client"
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user },
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    loadUser();
  }, []);

  // Load current user
  const loadUser = async () => {
    const token = apiService.getAuthToken();
    
    if (!token) {
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER_FAILURE,
        payload: { error: 'No token found' },
      });
      return;
    }

    try {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
      const response = await apiService.getCurrentUser();
      
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
        payload: { user: response.user },
      });
    } catch (error) {
      console.error('Load user error:', error);
      apiService.removeAuthToken(); // Remove invalid token
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER_FAILURE,
        payload: { error: error.message },
      });
    }
  };

  // Login
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await apiService.login(credentials);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.user },
      });

      return { success: true, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await apiService.register(userData);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.user },
      });

      return { success: true, message: response.message };
    } catch (error) {
      console.error('Register error:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: true };
    }
  };

  // Update profile
  const updateProfile = async (userData) => {
    try {
      const response = await apiService.updateProfile(userData);
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { user: response.user },
      });

      return { success: true, message: response.message };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await apiService.changePassword(passwordData);
      return { success: true, message: response.message };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;