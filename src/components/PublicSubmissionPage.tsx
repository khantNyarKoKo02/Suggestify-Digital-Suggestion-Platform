import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Star, MessageSquare, CheckCircle, Sparkles, Send } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../utils/supabase/client'

interface SuggestionBox {
  id: string
  title: string
  description: string
  color: string
}

interface PublicSubmissionPageProps {
  boxId: string
}

// Helper function to convert hex to HSL
const hexToHsl = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

// Generate theme colors based on primary color
const generateThemeColors = (primaryColor: string) => {
  const hsl = hexToHsl(primaryColor)

  return {
    primary: primaryColor,
    primaryLight: `hsl(${hsl.h}, ${Math.max(20, hsl.s - 20)}%, ${Math.min(95, hsl.l + 30)}%)`,
    primaryDark: `hsl(${hsl.h}, ${Math.min(100, hsl.s + 10)}%, ${Math.max(10, hsl.l - 20)}%)`,
    primaryVeryLight: `hsl(${hsl.h}, ${Math.max(10, hsl.s - 30)}%, ${Math.min(98, hsl.l + 40)}%)`,
    gradient: `linear-gradient(135deg, ${primaryColor}, hsl(${hsl.h}, ${Math.min(100, hsl.s + 20)}%, ${Math.max(20, hsl.l - 10)}%))`,
    backgroundGradient: `linear-gradient(180deg, hsl(${hsl.h}, ${Math.max(10, hsl.s - 40)}%, 98%) 0%, hsl(${hsl.h}, ${Math.max(5, hsl.s - 50)}%, 95%) 100%)`
  }
}

export function PublicSubmissionPage({ boxId }: PublicSubmissionPageProps) {
  const [box, setBox] = useState<SuggestionBox | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    content: '',
    rating: 0
  })

  useEffect(() => {
    loadBox()
  }, [boxId])

  const loadBox = async () => {
    try {
      const { data, error } = await supabase
        .from('suggestion_boxes')
        .select('*')
        .eq('id', boxId)
        .single()

      if (error || !data) {
        console.error('Error loading box:', error)
        toast.error('Suggestion box not found')
        return
      }

      setBox(data)
    } catch (error) {
      console.error('Load box error:', error)
      toast.error('Failed to load suggestion box')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      toast.error('Please enter your suggestion')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('suggestions')
        .insert({
          box_id: boxId,
          content: formData.content,
          rating: formData.rating > 0 ? formData.rating : null,
          is_anonymous: true
        })

      if (error) {
        console.error('Submit error:', error)
        toast.error('Failed to submit suggestion: ' + error.message)
        return
      }

      setSubmitted(true)
      toast.success('Suggestion submitted successfully!')
    } catch (error) {
      console.error('Submit suggestion error:', error)
      toast.error('Failed to submit suggestion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({ rating, onRate, theme }: {
    rating: number
    onRate: (rating: number) => void
    theme: any
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="cursor-pointer hover:scale-110 transition-transform duration-200"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`h-6 w-6 transition-colors duration-200 ${star <= rating
                  ? 'fill-current text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
                }`}
              aria-hidden="true"
            />
            <span className="sr-only">{`Rate ${star} star${star > 1 ? 's' : ''}`}</span>
          </button>
        ))}
        {rating > 0 && (
          <button
            type="button"
            onClick={() => onRate(0)}
            className="ml-3 text-sm opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: theme.primaryDark }}
          >
            Clear
          </button>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
        />
        <div className="relative z-10 text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600">Loading suggestion box...</p>
        </div>
      </div>
    )
  }

  if (!box) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
        />
        <Card className="relative z-10 w-full max-w-md text-center shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl text-gray-900 mb-3">Suggestion Box Not Found</h3>
            <p className="text-gray-600 mb-6">This suggestion box may have been removed or the link is invalid.</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-6"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const theme = generateThemeColors(box.color)

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className="absolute inset-0"
          style={{ background: theme.backgroundGradient }}
        />
        <Card className="relative z-10 w-full max-w-md text-center shadow-xl border-0">
          <CardContent className="pt-8 pb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ background: theme.gradient }}
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl text-gray-900 mb-3">Thank You!</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Your suggestion has been submitted successfully.
              <br />We appreciate your valuable feedback!
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setSubmitted(false)
                  setFormData({ content: '', rating: 0 })
                }}
                style={{ background: theme.gradient }}
                className="w-full text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Submit Another Suggestion
              </Button>
              <Button
                onClick={() => window.close()}
                variant="outline"
                className="w-full"
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Dynamic themed background */}
      <div
        className="absolute inset-0"
        style={{ background: theme.backgroundGradient }}
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: theme.primary }}
        />
        <div
          className="absolute top-1/3 -left-20 w-32 h-32 rounded-full opacity-5"
          style={{ backgroundColor: theme.primary }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-24 h-24 rounded-full opacity-8"
          style={{ backgroundColor: theme.primary }}
        />
      </div>

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: theme.primary }}
              />
              <div
                className="w-2 h-2 rounded-full mx-2 opacity-60"
                style={{ backgroundColor: theme.primary }}
              />
              <div
                className="w-1 h-1 rounded-full opacity-40"
                style={{ backgroundColor: theme.primary }}
              />
            </div>
            <h1 className="text-3xl mb-3 text-gray-900">{box.title}</h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
              {box.description}
            </p>
          </div>

          {/* Main Submission Card */}
          <Card className="shadow-2xl border-0 overflow-hidden">
            {/* Gradient header */}
            <div
              className="h-2"
              style={{ background: theme.gradient }}
            />

            <CardHeader className="text-center pt-8 pb-6">
              <div className="flex items-center justify-center mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: theme.primaryLight }}
                >
                  <Sparkles
                    className="h-6 w-6"
                    style={{ color: theme.primary }}
                  />
                </div>
              </div>
              <CardTitle className="text-xl text-gray-900">Share Your Thoughts</CardTitle>
              <CardDescription className="text-base text-gray-600">
                Your feedback helps us improve. This submission is completely anonymous.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Suggestion Input */}
                <div className="space-y-3">
                  <Label htmlFor="content" className="text-gray-700 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" style={{ color: theme.primary }} />
                    Your Suggestion *
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Share your thoughts, ideas, feedback, or suggestions..."
                    rows={6}
                    required
                    className="resize-none border-2 focus:border-opacity-50 transition-all duration-200"
                    style={{
                      borderColor: theme.primaryLight,
                      '--tw-ring-color': theme.primary
                    } as React.CSSProperties}
                  />
                  <div
                    className="text-xs px-4 py-2 rounded-full inline-flex items-center gap-2"
                    style={{
                      backgroundColor: theme.primaryVeryLight,
                      color: theme.primaryDark
                    }}
                  >
                    <CheckCircle className="h-3 w-3" />
                    100% Anonymous - No personal information is collected
                  </div>
                </div>

                {/* Rating Section */}
                <div className="space-y-4">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Star className="h-4 w-4" style={{ color: theme.primary }} />
                    Rate Your Experience (Optional)
                  </Label>
                  <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: theme.primaryVeryLight }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <StarRating
                        rating={formData.rating}
                        onRate={(rating) => setFormData({ ...formData, rating })}
                        theme={theme}
                      />
                      <span className="text-sm" style={{ color: theme.primaryDark }}>
                        {formData.rating > 0 ? (
                          <>
                            <strong>{formData.rating}/5 stars</strong> -
                            {formData.rating === 1 && ' Very Dissatisfied'}
                            {formData.rating === 2 && ' Dissatisfied'}
                            {formData.rating === 3 && ' Neutral'}
                            {formData.rating === 4 && ' Satisfied'}
                            {formData.rating === 5 && ' Very Satisfied'}
                          </>
                        ) : (
                          'No rating selected'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  style={{ background: theme.gradient }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Submit Suggestion
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Powered by <span style={{ color: theme.primary }}>Digital Suggestion Box</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
