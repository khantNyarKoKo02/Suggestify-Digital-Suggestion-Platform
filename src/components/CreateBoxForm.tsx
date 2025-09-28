import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { ArrowLeft } from 'lucide-react'

const colorOptions = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
]

interface CreateBoxFormProps {
  onSubmit: (data: { title: string; description: string; color: string }) => void
  onCancel: () => void
}

export function CreateBoxForm({ onSubmit, onCancel }: CreateBoxFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#3B82F6'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    onSubmit(formData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={onCancel} className="flex items-center gap-2 mr-4">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl text-gray-900">Create New Suggestion Box</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Box Configuration</CardTitle>
            <CardDescription>
              Set up your new suggestion box with a title, description, and theme color
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Box Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Product Feedback, Event Suggestions"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what kind of feedback you're looking for..."
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Theme Color</Label>
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`
                        flex items-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${formData.color === color.value 
                          ? 'border-gray-400 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.value }}
                      ></div>
                      <span className="text-sm">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm text-gray-700 mb-2">Preview</h4>
                <div 
                  className="p-4 rounded-lg border-2 bg-white"
                  style={{ borderColor: formData.color }}
                >
                  <h3 className="text-lg text-gray-900">{formData.title || 'Your Box Title'}</h3>
                  <p className="text-gray-600 text-sm mt-1">{formData.description || 'Your box description'}</p>
                  <div className="mt-3 space-y-2">
                    <div className="w-full h-8 bg-gray-100 rounded"></div>
                    <div className="w-24 h-8 rounded" style={{ backgroundColor: formData.color }}></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Create Suggestion Box
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}