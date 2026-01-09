-- Create invitation_guests table
CREATE TABLE IF NOT EXISTS invitation_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to clients table (using id instead of slug)
  CONSTRAINT fk_client_id FOREIGN KEY (client_id) 
    REFERENCES clients(id) ON DELETE CASCADE
);

-- Create index for faster queries by client_id
CREATE INDEX IF NOT EXISTS idx_invitation_guests_client_id 
  ON invitation_guests(client_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invitation_guests_updated_at
  BEFORE UPDATE ON invitation_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
