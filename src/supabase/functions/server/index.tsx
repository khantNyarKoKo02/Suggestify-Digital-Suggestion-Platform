// @ts-nocheck
// This is a Deno Edge Function - TypeScript errors are expected in VS Code
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'

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

    const { data, error } = await supabase
      .from('suggestion_boxes')
      .insert({
        owner_id: user.id,
        title,
        description: description || '',
        color: color || '#3B82F6'
      })
      .select()
      .single()

    if (error) {
      console.log('Create suggestion box error:', error)
      return c.json({ error: error.message }, 500)
    }

    return c.json({ box: data })
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

    const { data, error } = await supabase
      .from('suggestion_boxes')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Get suggestion boxes error:', error)
      return c.json({ error: error.message }, 500)
    }

    return c.json({ boxes: data })
  } catch (error) {
    console.log('Get suggestion boxes error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/make-server-01962606/suggestion-boxes/:id', async (c) => {
  try {
    const boxId = c.req.param('id')
    
    const { data, error } = await supabase
      .from('suggestion_boxes')
      .select('*')
      .eq('id', boxId)
      .single()
    
    if (error || !data) {
      return c.json({ error: 'Suggestion box not found' }, 404)
    }

    return c.json({ box: data })
  } catch (error) {
    console.log('Get suggestion box error:', error)
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

    // Verify ownership
    const { data: existingBox } = await supabase
      .from('suggestion_boxes')
      .select('owner_id')
      .eq('id', boxId)
      .single()

    if (!existingBox || existingBox.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const { data, error } = await supabase
      .from('suggestion_boxes')
      .update({
        title,
        description: description || '',
        color: color || '#3B82F6'
      })
      .eq('id', boxId)
      .select()
      .single()

    if (error) {
      console.log('Update suggestion box error:', error)
      return c.json({ error: error.message }, 500)
    }

    return c.json({ box: data })
  } catch (error) {
    console.log('Update suggestion box error:', error)
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
    
    // Verify ownership
    const { data: existingBox } = await supabase
      .from('suggestion_boxes')
      .select('owner_id')
      .eq('id', boxId)
      .single()

    if (!existingBox || existingBox.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // Delete the box (cascade will delete suggestions)
    const { error } = await supabase
      .from('suggestion_boxes')
      .delete()
      .eq('id', boxId)

    if (error) {
      console.log('Delete suggestion box error:', error)
      return c.json({ error: error.message }, 500)
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
    const { data: box } = await supabase
      .from('suggestion_boxes')
      .select('id')
      .eq('id', boxId)
      .single()

    if (!box) {
      return c.json({ error: 'Suggestion box not found' }, 404)
    }

    const { data, error } = await supabase
      .from('suggestions')
      .insert({
        box_id: boxId,
        content,
        rating: rating || null,
        is_anonymous: isAnonymous !== undefined ? isAnonymous : true
      })
      .select()
      .single()

    if (error) {
      console.log('Create suggestion error:', error)
      return c.json({ error: error.message }, 500)
    }

    return c.json({ suggestion: data })
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
    const { data: box } = await supabase
      .from('suggestion_boxes')
      .select('owner_id')
      .eq('id', boxId)
      .single()

    if (!box || box.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('box_id', boxId)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Get suggestions error:', error)
      return c.json({ error: error.message }, 500)
    }

    return c.json({ suggestions: data })
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

    // Get the suggestion to find the box
    const { data: suggestion } = await supabase
      .from('suggestions')
      .select('box_id')
      .eq('id', suggestionId)
      .single()
    
    if (!suggestion) {
      return c.json({ error: 'Suggestion not found' }, 404)
    }

    // Verify user owns the box
    const { data: box } = await supabase
      .from('suggestion_boxes')
      .select('owner_id')
      .eq('id', suggestion.box_id)
      .single()

    if (!box || box.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // Update suggestion with admin rating
    const { data, error } = await supabase
      .from('suggestions')
      .update({ admin_rating: rating })
      .eq('id', suggestionId)
      .select()
      .single()

    if (error) {
      console.log('Rate suggestion error:', error)
      return c.json({ error: error.message }, 500)
    }

    return c.json({ suggestion: data })
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
    const { data: box } = await supabase
      .from('suggestion_boxes')
      .select('owner_id')
      .eq('id', boxId)
      .single()

    if (!box || box.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const { data: suggestions } = await supabase
      .from('suggestions')
      .select('*')
      .eq('box_id', boxId)
      .order('created_at', { ascending: false })
    
    // Generate CSV content
    const csvHeader = 'ID,Content,Rating,Admin Rating,Anonymous,Created At\n'
    const csvRows = (suggestions || []).map(s => 
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