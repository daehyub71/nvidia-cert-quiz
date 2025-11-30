/**
 * Color constants for NVIDIA Cert Quiz app
 * Based on NVIDIA brand colors and Stitch design system
 */

export const Colors = {
  // Primary - NVIDIA Green
  primary: '#76B900',
  primaryDark: '#5A8F00',
  primaryLight: '#8FD100',

  // Background
  backgroundLight: '#F5F5F7',
  backgroundDark: '#1A293D',

  // Surface colors
  surfaceLight: '#FFFFFF',
  surfaceDark: 'rgba(15, 23, 42, 0.5)', // slate-900/50

  // Text colors
  textLight: '#1E293B', // slate-800
  textDark: '#FFFFFF',
  textMutedLight: '#64748B', // slate-500
  textMutedDark: '#94A3B8', // slate-400

  // Status colors
  success: '#22C55E', // green-500
  error: '#EF4444', // red-500
  warning: '#F59E0B', // amber-500
  info: '#3B82F6', // blue-500

  // Feature colors
  incorrectRed: '#EF4444',
  bookmarkBlue: '#3B82F6',
  statisticsGreen: '#22C55E',
  studyPurple: '#A855F7',

  // Border colors
  borderLight: '#E2E8F0', // slate-200
  borderDark: '#334155', // slate-700

  // Transparent overlays
  overlayLight: 'rgba(255, 255, 255, 0.8)',
  overlayDark: 'rgba(26, 41, 61, 0.8)',
};

export const DarkTheme = {
  background: Colors.backgroundDark,
  surface: Colors.surfaceDark,
  text: Colors.textDark,
  textMuted: Colors.textMutedDark,
  border: Colors.borderDark,
  overlay: Colors.overlayDark,
};

export const LightTheme = {
  background: Colors.backgroundLight,
  surface: Colors.surfaceLight,
  text: Colors.textLight,
  textMuted: Colors.textMutedLight,
  border: Colors.borderLight,
  overlay: Colors.overlayLight,
};
