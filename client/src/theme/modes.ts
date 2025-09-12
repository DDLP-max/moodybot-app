export const MODE_THEME = {
  dynamic: { 
    bg: 'bg-indigo-500', 
    hover: 'hover:bg-indigo-400', 
    ring: 'ring-indigo-300',
    gradient: 'bg-gradient-to-r from-indigo-500 to-purple-500'
  },
  copy: { 
    bg: 'bg-emerald-500', 
    hover: 'hover:bg-emerald-400', 
    ring: 'ring-emerald-300',
    gradient: 'bg-gradient-to-r from-emerald-500 to-teal-500'
  },
  writer: { 
    bg: 'bg-amber-500', 
    hover: 'hover:bg-amber-400', 
    ring: 'ring-amber-300',
    gradient: 'bg-gradient-to-r from-amber-500 to-orange-500'
  },
  validation: { 
    bg: 'bg-pink-500', 
    hover: 'hover:bg-pink-600', 
    ring: 'ring-pink-300',
    gradient: 'bg-gradient-to-r from-pink-500 to-rose-500',
    // Using the exact colors from design tokens
    custom: {
      base: '#EC4899',
      hover: '#DB2777',
      ring: '#F472B6'
    }
  }
} as const;

export type ModeKey = keyof typeof MODE_THEME;
