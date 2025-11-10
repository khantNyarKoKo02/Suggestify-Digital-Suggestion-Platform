# 🚀 Supabase Integration & Deployment Guide

## Overview
This guide will help you fully integrate and deploy the Suggestify Digital Suggestion Platform with your new Supabase instance.

---

## 📋 Prerequisites

- Supabase account with a project created
- Supabase CLI installed (recommended): `npm install -g supabase`
- Your Supabase credentials:
  - Project URL: `https://lbpbtxfvqauzopqpltqs.supabase.co`
  - Anon Key: Already configured in `.env`
  - Service Role Key: Required for edge functions

---

## Step 1: Set Up Database Schema

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lbpbtxfvqauzopqpltqs
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run** to execute the migration

### Option B: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref lbpbtxfvqauzopqpltqs

# Run migrations
supabase db push
```

### What This Creates:
- ✅ `suggestion_boxes` table with proper columns
- ✅ `suggestions` table with proper columns
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Automatic timestamp triggers

---

## Step 2: Deploy Edge Function

### Get Your Service Role Key

1. Go to **Settings** > **API** in your Supabase Dashboard
2. Find and copy your **service_role** key (keep this secret!)
3. Add it to your project's edge function secrets

### Deploy the Edge Function

#### Option A: Using Supabase Dashboard

1. Go to **Edge Functions** in your Supabase Dashboard
2. Click **Create Function**
3. Name it: `make-server-01962606`
4. Copy the contents of `src/supabase/functions/server/index.tsx`
5. Paste it into the function editor
6. Add the `kv_store.tsx` file as an import if needed
7. Set environment variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
8. Click **Deploy**

#### Option B: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root
cd /path/to/Suggestify-Digital-Suggestion-Platform

# Deploy the function
supabase functions deploy make-server-01962606 \
  --project-ref lbpbtxfvqauzopqpltqs

# Set environment secrets
supabase secrets set SUPABASE_URL=https://lbpbtxfvqauzopqpltqs.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## Step 3: Configure Frontend Environment

Your `.env` file should look like this:

```properties
# Supabase Configuration
VITE_SUPABASE_URL=https://lbpbtxfvqauzopqpltqs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxicGJ0eGZ2cWF1em9wcXBsdHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NzYzNDIsImV4cCI6MjA3ODM1MjM0Mn0.OKZqDIuWXERxKT3-S-IOEhoxPA8ZmMC3KTdb3xSgTaQ
```

---

## Step 4: Install Dependencies & Build

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run locally to test
npm run dev
```

---

## Step 5: Deploy Frontend

### Option A: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### Option B: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

### Option C: Deploy to Supabase Storage

You can also host the static site directly on Supabase Storage with a CDN.

---

## 🎯 New Features Implemented

### 1. Full Supabase Database Integration
- ✅ Replaced Deno KV with Supabase PostgreSQL
- ✅ All data now stored in proper relational tables
- ✅ Row Level Security (RLS) for data protection

### 2. Edit Suggestion Box Functionality
- ✅ Added PUT endpoint to update suggestion boxes
- ✅ Updated CreateBoxForm to support edit mode
- ✅ Added Edit button to AdminDashboard
- ✅ Users can now edit title, description, and color

### 3. Enhanced Security
- ✅ RLS policies ensure users only see their own boxes
- ✅ Public can view boxes for submission (read-only)
- ✅ Only box owners can edit/delete their boxes

---

## 🧪 Testing the Integration

### 1. Test Database Connection

```bash
# Run the dev server
npm run dev
```

Visit `http://localhost:5173` and:
1. Sign up for a new account
2. Create a suggestion box
3. Verify it appears in Supabase Dashboard > Table Editor

### 2. Test Edge Function

```bash
# Test with curl
curl -X GET \
  https://lbpbtxfvqauzopqpltqs.supabase.co/functions/v1/make-server-01962606/suggestion-boxes \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 3. Test Edit Functionality

1. Create a suggestion box
2. Click the "Edit" button on a box card
3. Modify title, description, or color
4. Submit and verify changes are saved

---

## 🔍 Troubleshooting

### Issue: "Cannot find table 'suggestion_boxes'"
**Solution:** Run the SQL migration from Step 1

### Issue: "Unauthorized" errors
**Solution:** 
- Check that your Service Role Key is set correctly
- Verify RLS policies are enabled
- Ensure you're logged in with a valid session

### Issue: Edge function not deploying
**Solution:**
- Make sure Supabase CLI is up to date: `npm update -g supabase`
- Check function logs in Supabase Dashboard
- Verify environment variables are set

### Issue: Frontend can't connect
**Solution:**
- Verify `.env` file has correct values
- Restart dev server after changing `.env`
- Check browser console for errors

---

## 📊 Database Structure

### `suggestion_boxes` Table
```sql
id              UUID (Primary Key)
owner_id        UUID (Foreign Key to auth.users)
title           TEXT
description     TEXT
color           TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `suggestions` Table
```sql
id              UUID (Primary Key)
box_id          UUID (Foreign Key to suggestion_boxes)
content         TEXT
rating          INTEGER (1-5)
admin_rating    INTEGER (1-5)
is_anonymous    BOOLEAN
created_at      TIMESTAMPTZ
```

---

## 🔐 Security Notes

1. **Never commit** your Service Role Key to git
2. Keep your `.env` file in `.gitignore`
3. RLS policies are automatically enforced
4. Use anon key for frontend, service role for edge functions only

---

## 📚 API Endpoints

All endpoints are prefixed with:
`https://lbpbtxfvqauzopqpltqs.supabase.co/functions/v1/make-server-01962606`

### Suggestion Boxes
- `POST /suggestion-boxes` - Create new box
- `GET /suggestion-boxes` - Get user's boxes
- `GET /suggestion-boxes/:id` - Get specific box
- `PUT /suggestion-boxes/:id` - Update box ✨ NEW
- `DELETE /suggestion-boxes/:id` - Delete box

### Suggestions
- `POST /suggestions` - Create suggestion
- `GET /suggestions/:boxId` - Get box suggestions
- `POST /suggestions/:suggestionId/rate` - Rate suggestion
- `GET /export/:boxId` - Export as CSV

---

## ✅ Verification Checklist

- [ ] SQL migration executed successfully
- [ ] Tables visible in Supabase Dashboard
- [ ] Edge function deployed
- [ ] Environment variables configured
- [ ] Frontend connects to Supabase
- [ ] Can create new suggestion box
- [ ] Can edit existing suggestion box ✨ NEW
- [ ] Can submit suggestions
- [ ] Can view suggestions as admin
- [ ] Can export suggestions as CSV

---

## 🎉 Success!

Once all steps are completed, your Suggestify platform will be:
- ✅ Fully integrated with Supabase
- ✅ Using PostgreSQL for data storage
- ✅ Protected with Row Level Security
- ✅ Deployed with edge functions
- ✅ Supporting full CRUD operations on suggestion boxes

Need help? Check the Supabase documentation: https://supabase.com/docs
