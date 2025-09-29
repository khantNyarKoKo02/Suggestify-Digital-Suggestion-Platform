// @ts-nocheck
// This is a Deno Edge Function - TypeScript errors are expected in VS Code
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Helper function to verify authorization
async function verifyAuth(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    console.log('Authorization error:', error);
    return null;
  }

  return user;
}

// Auth routes
app.post('/make-server-01962606/auth/signup', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })

    if (error) {
      console.log('Signup error:', error)
      return c.json({ error: error.message }, 400)
    }

    return c.json({ user: data.user })
  } catch (error) {
    console.log('Signup server error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Suggestion Box routes
app.post('/make-server-01962606/suggestion-boxes', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json()
    const { title, description, color } = body

    if (!title) {
      return c.json({ error: 'Title is required' }, 400)
    }

    const boxId = crypto.randomUUID()
    const boxData = {
      id: boxId,
      owner_id: user.id,
      title,
      description: description || '',
      color: color || '#3B82F6',
      created_at: new Date().toISOString()
    }

    await kv.set(`suggestion_box_${boxId}`, boxData)

    // Add to user's boxes list
    const userBoxes = await kv.get(`user_boxes_${user.id}`) || []
    userBoxes.push(boxId)
    await kv.set(`user_boxes_${user.id}`, userBoxes)

    return c.json({ box: boxData })
  } catch (error) {
    console.log('Create suggestion box error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/make-server-01962606/suggestion-boxes', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userBoxes = await kv.get(`user_boxes_${user.id}`) || []
    const boxes = []

    for (const boxId of userBoxes) {
      const box = await kv.get(`suggestion_box_${boxId}`)
      if (box) {
        boxes.push(box)
      }
    }

    return c.json({ boxes })
  } catch (error) {
    console.log('Get suggestion boxes error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/make-server-01962606/suggestion-boxes/:id', async (c) => {
  try {
    const boxId = c.req.param('id')
    const box = await kv.get(`suggestion_box_${boxId}`)

    if (!box) {
      return c.json({ error: 'Suggestion box not found' }, 404)
    }

    return c.json({ box })
  } catch (error) {
    console.log('Get suggestion box error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.delete('/make-server-01962606/suggestion-boxes/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boxId = c.req.param('id')
    const box = await kv.get(`suggestion_box_${boxId}`)

    if (!box) {
      return c.json({ error: 'Suggestion box not found' }, 404)
    }

    if (box.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // Delete the box
    await kv.del(`suggestion_box_${boxId}`)

    // Remove from user's boxes list
    const userBoxes = await kv.get(`user_boxes_${user.id}`) || []
    const updatedBoxes = userBoxes.filter((id: string) => id !== boxId)
    await kv.set(`user_boxes_${user.id}`, updatedBoxes)

    // Delete all suggestions for this box
    const suggestions = await kv.getByPrefix(`suggestion_${boxId}_`)
    for (const suggestion of suggestions) {
      await kv.del(`suggestion_${boxId}_${suggestion.id}`)
    }

    return c.json({ success: true })
  } catch (error) {
    console.log('Delete suggestion box error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.put('/make-server-01962606/suggestion-boxes/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boxId = c.req.param('id')
    const body = await c.req.json()
    const { title, description, color } = body

    if (!title) {
      return c.json({ error: 'Title is required' }, 400)
    }

    const box = await kv.get(`suggestion_box_${boxId}`)

    if (!box) {
      return c.json({ error: 'Suggestion box not found' }, 404)
    }

    if (box.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // Update the box data
    const updatedBoxData = {
      ...box,
      title,
      description: description || '',
      color: color || '#3B82F6'
    }

    await kv.set(`suggestion_box_${boxId}`, updatedBoxData)

    return c.json({ box: updatedBoxData })
  } catch (error) {
    console.log('Update suggestion box error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Suggestion routes
app.post('/make-server-01962606/suggestions', async (c) => {
  try {
    const body = await c.req.json()
    const { boxId, content, rating, isAnonymous } = body

    if (!boxId || !content) {
      return c.json({ error: 'Box ID and content are required' }, 400)
    }

    // Verify box exists
    const box = await kv.get(`suggestion_box_${boxId}`)
    if (!box) {
      return c.json({ error: 'Suggestion box not found' }, 404)
    }

    const suggestionId = crypto.randomUUID()
    const suggestionData = {
      id: suggestionId,
      box_id: boxId,
      content,
      rating: rating || null,
      is_anonymous: isAnonymous || false,
      created_at: new Date().toISOString()
    }

    await kv.set(`suggestion_${boxId}_${suggestionId}`, suggestionData)

    return c.json({ suggestion: suggestionData })
  } catch (error) {
    console.log('Create suggestion error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/make-server-01962606/suggestions/:boxId', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boxId = c.req.param('boxId')

    // Verify user owns this box
    const box = await kv.get(`suggestion_box_${boxId}`)
    if (!box || box.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const suggestions = await kv.getByPrefix(`suggestion_${boxId}_`)
    return c.json({ suggestions })
  } catch (error) {
    console.log('Get suggestions error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/make-server-01962606/suggestions/:suggestionId/rate', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const suggestionId = c.req.param('suggestionId')
    const body = await c.req.json()
    const { rating } = body

    if (!rating || rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400)
    }

    // Find the suggestion
    const suggestions = await kv.getByPrefix(`suggestion_`)
    const suggestion = suggestions.find(s => s.id === suggestionId)

    if (!suggestion) {
      return c.json({ error: 'Suggestion not found' }, 404)
    }

    // Verify user owns the box
    const box = await kv.get(`suggestion_box_${suggestion.box_id}`)
    if (!box || box.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // Update suggestion with admin rating
    suggestion.admin_rating = rating
    await kv.set(`suggestion_${suggestion.box_id}_${suggestion.id}`, suggestion)

    return c.json({ suggestion })
  } catch (error) {
    console.log('Rate suggestion error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/make-server-01962606/export/:boxId', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boxId = c.req.param('boxId')

    // Verify user owns this box
    const box = await kv.get(`suggestion_box_${boxId}`)
    if (!box || box.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const suggestions = await kv.getByPrefix(`suggestion_${boxId}_`)

    // Generate CSV content
    const csvHeader = 'ID,Content,Rating,Admin Rating,Anonymous,Created At\n'
    const csvRows = suggestions.map(s =>
      `"${s.id}","${s.content.replace(/"/g, '""')}","${s.rating || ''}","${s.admin_rating || ''}","${s.is_anonymous}","${s.created_at}"`
    ).join('\n')

    const csvContent = csvHeader + csvRows

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="suggestions-${boxId}.csv"`
      }
    })
  } catch (error) {
    console.log('Export suggestions error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

Deno.serve(app.fetch)