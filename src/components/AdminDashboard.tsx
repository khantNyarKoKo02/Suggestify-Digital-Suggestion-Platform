import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Plus, Settings, MessageSquare, Download, Star, Eye, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { CreateBoxForm } from './CreateBoxForm'
import { SuggestionsManager } from './SuggestionsManager'
import { QRCodeGenerator } from './QRCodeGenerator'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { supabase } from '../utils/supabase/client'

interface SuggestionBox {
  id: string
  title: string
  description: string
  color: string
  created_at: string
  owner_id: string
}

interface AdminDashboardProps {
  user: any
  onLogout: () => void
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [boxes, setBoxes] = useState<SuggestionBox[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingBox, setEditingBox] = useState<SuggestionBox | null>(null)
  const [selectedBox, setSelectedBox] = useState<SuggestionBox | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showQRCode, setShowQRCode] = useState<string | null>(null)

  useEffect(() => {
    loadBoxes()
  }, [])

  const loadBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('suggestion_boxes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Load boxes error:', error)
        toast.error('Failed to load suggestion boxes: ' + error.message)
        return
      }

      setBoxes(data || [])
    } catch (error) {
      console.error('Load boxes error:', error)
      toast.error('Failed to load suggestion boxes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBox = async (boxData: { title: string; description: string; color: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please login again')
        onLogout()
        return
      }

      const { data, error } = await supabase
        .from('suggestion_boxes')
        .insert({
          owner_id: user.id,
          title: boxData.title,
          description: boxData.description || '',
          color: boxData.color || '#3B82F6'
        })
        .select()
        .single()

      if (error) {
        console.error('Create box error:', error)
        toast.error('Failed to create suggestion box: ' + error.message)
        return
      }

      setBoxes([data, ...boxes])
      setShowCreateForm(false)
      setSelectedBox(null)
      toast.success('Suggestion box created successfully!')
    } catch (error) {
      console.error('Create box error:', error)
      toast.error('Failed to create suggestion box')
    }
  }

  const handleUpdateBox = async (boxData: { title: string; description: string; color: string }) => {
    if (!editingBox) return

    try {
      const { data, error } = await supabase
        .from('suggestion_boxes')
        .update({
          title: boxData.title,
          description: boxData.description || '',
          color: boxData.color || '#3B82F6'
        })
        .eq('id', editingBox.id)
        .select()
        .single()

      if (error) {
        console.error('Update box error:', error)
        toast.error('Failed to update suggestion box: ' + error.message)
        return
      }

      setBoxes(boxes.map(box => box.id === editingBox.id ? data : box))
      setEditingBox(null)
      toast.success('Suggestion box updated successfully!')
    } catch (error) {
      console.error('Update box error:', error)
      toast.error('Failed to update suggestion box')
    }
  }

  const handleDeleteBox = async (boxId: string) => {
    if (!confirm('Are you sure you want to delete this suggestion box? This will also delete all suggestions.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('suggestion_boxes')
        .delete()
        .eq('id', boxId)

      if (error) {
        console.error('Delete box error:', error)
        toast.error('Failed to delete suggestion box: ' + error.message)
        return
      }

      setBoxes(boxes.filter(box => box.id !== boxId))
      toast.success('Suggestion box deleted successfully!')
    } catch (error) {
      console.error('Delete box error:', error)
      toast.error('Failed to delete suggestion box')
    }
  }

  const handleExportCSV = async (boxId: string) => {
    try {
      const { data: suggestions, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('box_id', boxId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Export error:', error)
        toast.error('Failed to export suggestions: ' + error.message)
        return
      }

      // Generate CSV content
      const csvHeader = 'ID,Content,Rating,Admin Rating,Anonymous,Created At\n'
      const csvRows = (suggestions || []).map(s => 
        `"${s.id}","${s.content.replace(/"/g, '""')}","${s.rating || ''}","${s.admin_rating || ''}","${s.is_anonymous}","${s.created_at}"`
      ).join('\n')
      
      const csvContent = csvHeader + csvRows

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `suggestions-${boxId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Suggestions exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export suggestions')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
    toast.success('Logged out successfully')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (showCreateForm) {
    const isEditMode = !!selectedBox
    return (
      <CreateBoxForm
        onSubmit={isEditMode ? handleUpdateBox : handleCreateBox}
        onCancel={() => {
          setShowCreateForm(false)
          setSelectedBox(null)
        }}
        box={selectedBox}
      />
    )
  }

  if (editingBox) {
    return (
      <CreateBoxForm
        editBox={editingBox}
        onSubmit={handleUpdateBox}
        onCancel={() => setEditingBox(null)}
      />
    )
  }

  if (showSuggestions && selectedBox) {
    return (
      <SuggestionsManager
        box={selectedBox}
        onBack={() => {
          setShowSuggestions(false)
          setSelectedBox(null)
        }}
        onLogout={onLogout}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl text-gray-900">Digital Suggestion Box</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.user_metadata?.name || user.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl text-gray-900">Your Suggestion Boxes</h2>
              <p className="text-gray-600">Manage your feedback collection channels</p>
            </div>
            <Button onClick={() => {
              setSelectedBox(null)
              setShowCreateForm(true)
            }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Box
            </Button>
          </div>

          {boxes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg text-gray-900 mb-2">No suggestion boxes yet</h3>
                <p className="text-gray-600 mb-4">Create your first suggestion box to start collecting feedback</p>
                <Button onClick={() => {
                  setSelectedBox(null)
                  setShowCreateForm(true)
                }}>
                  Create Your First Box
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boxes.map((box) => (
                <Card key={box.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{box.title}</CardTitle>
                        <CardDescription className="mt-1">{box.description}</CardDescription>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 ml-3"
                        style={{ backgroundColor: box.color }}
                      ></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Badge variant="secondary" className="text-xs">
                        Created {new Date(box.created_at).toLocaleDateString()}
                      </Badge>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBox(box)
                            setShowSuggestions(true)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>

                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBox(box)
                            setShowCreateForm(true)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button> */}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingBox(box)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowQRCode(box.id)}
                          className="flex items-center gap-1"
                        >
                          <Settings className="h-3 w-3" />
                          QR Code
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportCSV(box.id)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Export
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBox(box.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {showQRCode && (
        <QRCodeGenerator
          boxId={showQRCode}
          onClose={() => setShowQRCode(null)}
        />
      )}
    </div>
  )
}
