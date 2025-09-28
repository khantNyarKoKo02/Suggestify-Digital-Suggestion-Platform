import React, { useState, useEffect } from 'react'
import { Toaster } from './components/ui/sonner'
import { LoginPage } from './components/LoginPage'
import { AdminDashboard } from './components/AdminDashboard'
import { PublicSubmissionPage } from './components/PublicSubmissionPage'
import { supabase } from './utils/supabase/client'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    checkSession()
    
    // Listen for browser navigation
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (user: any) => {
    setUser(user)
    // Navigate to dashboard
    window.history.pushState({}, '', '/')
    setCurrentPath('/')
  }

  const handleLogout = () => {
    setUser(null)
    // Navigate to login
    window.history.pushState({}, '', '/')
    setCurrentPath('/')
  }

  // Handle routing
  const pathParts = currentPath.split('/')
  console.log('Current path:', currentPath)
  console.log('Path parts:', pathParts)
  
  // Public submission page: /submit/:boxId
  if (pathParts[1] === 'submit' && pathParts[2]) {
    console.log('Routing to PublicSubmissionPage with boxId:', pathParts[2])
    return (
      <div>
        <PublicSubmissionPage boxId={pathParts[2]} />
        <Toaster />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Main admin interface
  if (user) {
    return (
      <div>
        <AdminDashboard user={user} onLogout={handleLogout} />
        <Toaster />
      </div>
    )
  }

  // Login page
  return (
    <div>
      <LoginPage onLogin={handleLogin} />
      <Toaster />
    </div>
  )
}