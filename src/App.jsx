import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import LoadingScreen from './components/LoadingScreen'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  const { setIsLoading } = useAuthStore()
  const [appLoading, setAppLoading] = useState(true)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)

  useEffect(() => {
    // Simulate initial app load
    const timer = setTimeout(() => {
      setAppLoading(false)
      setShowLoadingScreen(false)
      setIsLoading(false)
    }, 3500) // 3.5 seconds loading screen

    return () => clearTimeout(timer)
  }, [setIsLoading])

  if (showLoadingScreen && appLoading) {
    return <LoadingScreen />
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected user routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected admin routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}