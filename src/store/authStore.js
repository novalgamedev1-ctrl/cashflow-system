import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setRole: (role) => set({ role }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setIsLoading: (isLoading) => set({ isLoading }),

      logout: () => set({
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
      }),

      login: (user, token, role) => set({
        user,
        token,
        role,
        isAuthenticated: true,
        isLoading: false,
      }),
    }),
    {
      name: 'cashflow-auth',
    }
  )
)