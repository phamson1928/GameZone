// Vibrant White Theme for Gamers
export const COLORS = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLight: '#f8fafc',
  
  // Punchy primary colors
  primary: '#2563eb',      // Electric Blue (Updated)
  secondary: '#00D26A',    // Vivid Green  
  accent: '#FFB800',       // Bright Gold
  seaBlue: '#0ea5e9',      // Sea Blue for small details (sky-500)
  
  // High contrast text
  text: '#111827',
  textSecondary: '#4B5563',
  
  // Bright status colors
  success: '#00C851',
  error: '#FF3547',
  warning: '#FFBB33',
  info: '#33B5E5',
  infoBlue: '#3b82f6',
  neonGreen: '#10b981',
  
  card: '#FFFFFF',
  border: '#D1D5DB',        // More visible border (was #F3F4F6)
  borderLight: '#E5E7EB',   // Lighter variant for subtle borders
  borderBlue: '#dbeafe',
  notification: '#FF3547',
  
  // Vibrant card borders
  cardBorders: [
    '#2D5BFF',  // Electric Blue
    '#F72585',  // Neon Pink
    '#7209B7',  // Deep Purple
    '#4CC9F0',  // Cyan
    '#FF9F1C',  // Bright Orange
    '#00D26A',  // Vivid Green
    '#FFD166',  // Sunny Yellow
    '#EF476F',  // Hot Red-Pink
  ],
  
  slate: '#64748B',
};

export const GRADIENTS = {
  primary: ['#2D5BFF', '#5C82FF'] as const,
  secondary: ['#00D26A', '#45E891'] as const,
  accent: ['#FFB800', '#FFD666'] as const,
  warm: ['#FF9F1C', '#FFB84C'] as const,
  cool: ['#4CC9F0', '#7ADBF5'] as const,
  neutral: ['#F3F4F6', '#FFFFFF'] as const,
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
