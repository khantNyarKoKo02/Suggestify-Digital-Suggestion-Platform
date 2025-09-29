import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { ArrowLeft, Star, Download, MessageSquare, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { supabase } from '../utils/supabase/client'

interface Suggestion {
  id: string
  box_id: string
  content: string
  rating: number | null
  admin_rating: number | null
  is_anonymous: boolean
  created_at: string
}

interface SuggestionBox {
  id: string
  title: string
  description: string
  color: string
  created_at: string
}

interface SuggestionsManagerProps {
  box: SuggestionBox
  onBack: () => void
  onLogout: () => void
}

export function SuggestionsManager({ box, onBack, onLogout }: SuggestionsManagerProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSuggestions()
  }, [box.id])

  const loadSuggestions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login again')
        onLogout()
        return
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-01962606/suggestions/${box.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error('Failed to load suggestions: ' + error.error)
        return
      }

      const result = await response.json()
      setSuggestions(result.suggestions)
    } catch (error) {
      console.error('Load suggestions error:', error)
      toast.error('Failed to load suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRateSuggestion = async (suggestionId: string, rating: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login again')
        onLogout()
        return
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-01962606/suggestions/${suggestionId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ rating })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error('Failed to rate suggestion: ' + error.error)
        return
      }

      const result = await response.json()
      setSuggestions(suggestions.map(s => 
        s.id === suggestionId ? result.suggestion : s
      ))
      toast.success('Rating saved!')
    } catch (error) {
      console.error('Rate suggestion error:', error)
      toast.error('Failed to rate suggestion')
    }
  }

  const handleExportCSV = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please login again')
        onLogout()
        return
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-01962606/export/${box.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error('Failed to export suggestions: ' + error.error)
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `suggestions-${box.id}.csv`
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

  const StarRating = ({ rating, onRate, readonly = false }: { 
    rating: number | null
    onRate?: (rating: number) => void
    readonly?: boolean 
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRate && onRate(star)}
            disabled={readonly}
            className={`
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} 
              transition-transform
            `}
            aria-label={readonly ? `Rated ${rating ?? 0} star${(rating ?? 0) > 1 ? 's' : ''}` : `Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`
                h-4 w-4 
                ${(rating && star <= rating) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
                }
              `}
              aria-hidden="true"
            />
            <span className="sr-only">{readonly ? `Rated ${rating ?? 0} star${(rating ?? 0) > 1 ? 's' : ''}` : `Rate ${star} star${star > 1 ? 's' : ''}`}</span>
          </button>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading suggestions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 mr-4">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl text-gray-900">{box.title}</h1>
                <p className="text-sm text-gray-600">{suggestions.length} suggestions</p>
              </div>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6" style={{ borderColor: box.color }}>
          <CardHeader>
            <CardTitle>{box.title}</CardTitle>
            <CardDescription>{box.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Share this link for anonymous submissions: 
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                {window.location.origin}/submit/{box.id}
              </code>
            </div>
          </CardContent>
        </Card>

        {suggestions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 mb-2">No suggestions yet</h3>
              <p className="text-gray-600">Share your suggestion box link to start collecting feedback</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900">{suggestion.content}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {suggestion.is_anonymous && (
                          <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                        )}
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(suggestion.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {suggestion.rating && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">User Rating:</span>
                            <StarRating rating={suggestion.rating} readonly />
                          </div>
                        )}
                      </div>
                      
                      {/* <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Your Rating:</span>
                        <StarRating 
                          rating={suggestion.admin_rating} 
                          onRate={(rating) => handleRateSuggestion(suggestion.id, rating)}
                        />
                      </div> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
