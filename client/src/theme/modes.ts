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
    btn: "bg-val text-white hover-bright shadow-lg rounded-xl",
    ring: "ring-val",
    // Legacy support for existing code
    bg: 'bg-val', 
    hover: 'hover-bright', 
    gradient: 'bg-val'
  }
} as const;

export type ModeKey = keyof typeof MODE_THEME;
