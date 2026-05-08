import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin-dashboard' : '/dashboard'} replace />
  }

  return children
}   