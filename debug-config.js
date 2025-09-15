// Debug configuration for validation
export const DEBUG_VALIDATION = process.env.NODE_ENV === 'development' || process.env.DEBUG_VALIDATION === 'true';

export const debugLog = (message, data) => {
  if (DEBUG_VALIDATION) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

export const debugGroup = (name, fn) => {
  if (DEBUG_VALIDATION) {
    console.groupCollapsed(name);
    fn();
    console.groupEnd();
  } else {
    fn();
  }
};
