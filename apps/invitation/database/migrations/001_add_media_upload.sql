-- Add quota columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS quota_photos INTEGER DEFAULT 10;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS quota_music INTEGER DEFAULT 1;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS quota_videos INTEGER DEFAULT 1;

-- Create client_media table
CREATE TABLE IF NOT EXISTS client_media (
  id SERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'photo', 'music', 'video'
  file_size INTEGER NOT NULL, -- in bytes
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_client_media_client_type ON client_media(client_id, file_type);
CREATE INDEX IF NOT EXISTS idx_client_media_uploaded_at ON client_media(uploaded_at DESC);

-- Enable Row Level Security
ALTER TABLE client_media ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can only view their own media
CREATE POLICY "Clients can view own media"
  ON client_media
  FOR SELECT
  USING (client_id = auth.uid());

-- RLS Policy: Clients can only insert their own media
CREATE POLICY "Clients can insert own media"
  ON client_media
  FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- RLS Policy: Clients can only update their own media
CREATE POLICY "Clients can update own media"
  ON client_media
  FOR UPDATE
  USING (client_id = auth.uid());

-- RLS Policy: Clients can only delete their own media
CREATE POLICY "Clients can delete own media"
  ON client_media
  FOR DELETE
  USING (client_id = auth.uid());
