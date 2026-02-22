// Dark Mode Navy Gaming Theme - Gen Z Gamers
export const COLORS = {
  // === Backgrounds ===
  background: '#0F172A',      // Main background (Navy dark)
  surface: '#111827',         // Surface section (slightly lighter)
  card: '#1E293B',            // Card background

  // === Accent Colors ===
  primary: '#2563FF',         // Electric Blue (primary accent)
  primaryDark: '#1D4ED8',
  secondary: '#7C3AED',       // Purple (gradient end)

  // === Status Colors ===
  success: '#22C55E',         // Neon Green (OPEN)
  error: '#EF4444',           // Soft Red (FULL/error)
  warning: '#F59E0B',         // Amber (STARTING/warning)
  info: '#2563FF',

  // === Text Colors ===
  text: '#F8FAFC',            // Primary text
  textSecondary: '#94A3B8',   // Secondary text
  textMuted: '#64748B',       // Muted text

  // === Borders ===
  border: 'rgba(255,255,255,0.05)',
  borderLight: 'rgba(255,255,255,0.08)',
  borderBlue: 'rgba(37,99,255,0.3)',

  // === Legacy aliases kept for backward compatibility ===
  surfaceLight: '#1E293B',
  accent: '#F59E0B',
  infoBlue: '#2563FF',
  neonGreen: '#22C55E',
  notification: '#EF4444',
  slate: '#64748B',

  // Vibrant card accent colors (consistent with dark theme)
  cardBorders: [
    '#2563FF',  // Electric Blue
    '#7C3AED',  // Purple
    '#22C55E',  // Neon Green
    '#F59E0B',  // Amber
    '#EF4444',  // Red
    '#06B6D4',  // Cyan
    '#EC4899',  // Pink
    '#10B981',  // Emerald
  ],
};

export const GRADIENTS = {
  primary: ['#2563FF', '#7C3AED'] as const,       // Blue → Purple (main brand)
  secondary: ['#22C55E', '#10B981'] as const,     // Green gradient
  accent: ['#F59E0B', '#EF4444'] as const,        // Amber → Red
  warm: ['#EC4899', '#7C3AED'] as const,          // Pink → Purple
  cool: ['#06B6D4', '#2563FF'] as const,          // Cyan → Blue
  neutral: ['#1E293B', '#111827'] as const,       // Card gradient
  dark: ['#0F172A', '#111827'] as const,
};

// Helper to get random card border color
export const getRandomBorderColor = (): string => {
  const colors = COLORS.cardBorders;
  return colors[Math.floor(Math.random() * colors.length)];
};

// Helper to get consistent color based on id (so same card always has same color)
export const getBorderColorById = (id: string): string => {
  const colors = COLORS.cardBorders;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
};
