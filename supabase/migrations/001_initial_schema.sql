-- Create suggestion_boxes table
CREATE TABLE IF NOT EXISTS suggestion_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES suggestion_boxes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  admin_rating INTEGER CHECK (admin_rating >= 1 AND admin_rating <= 5),
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suggestion_boxes_owner ON suggestion_boxes(owner_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_box ON suggestions(box_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_created ON suggestions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE suggestion_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suggestion_boxes

-- Users can view their own boxes
CREATE POLICY "Users can view own boxes"
  ON suggestion_boxes
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can create their own boxes
CREATE POLICY "Users can create boxes"
  ON suggestion_boxes
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own boxes
CREATE POLICY "Users can update own boxes"
  ON suggestion_boxes
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own boxes
CREATE POLICY "Users can delete own boxes"
  ON suggestion_boxes
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Public can view boxes (for submission page)
CREATE POLICY "Public can view boxes"
  ON suggestion_boxes
  FOR SELECT
  USING (true);

-- RLS Policies for suggestions

-- Box owners can view suggestions for their boxes
CREATE POLICY "Owners can view suggestions"
  ON suggestions
  FOR SELECT
  USING (
    box_id IN (
      SELECT id FROM suggestion_boxes WHERE owner_id = auth.uid()
    )
  );

-- Anyone can create suggestions (anonymous submissions)
CREATE POLICY "Anyone can create suggestions"
  ON suggestions
  FOR INSERT
  WITH CHECK (true);

-- Box owners can update suggestions (for admin ratings)
CREATE POLICY "Owners can update suggestions"
  ON suggestions
  FOR UPDATE
  USING (
    box_id IN (
      SELECT id FROM suggestion_boxes WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    box_id IN (
      SELECT id FROM suggestion_boxes WHERE owner_id = auth.uid()
    )
  );

-- Box owners can delete suggestions
CREATE POLICY "Owners can delete suggestions"
  ON suggestions
  FOR DELETE
  USING (
    box_id IN (
      SELECT id FROM suggestion_boxes WHERE owner_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for suggestion_boxes
CREATE TRIGGER update_suggestion_boxes_updated_at
  BEFORE UPDATE ON suggestion_boxes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
