// This store is kept for backward compatibility.
// The primary auth is now handled by contexts/AuthContext.tsx
// All new code should use useAuth() from @/contexts/AuthContext

export const useAuthStore = () => null;
export function initializeAuthListener() {}
