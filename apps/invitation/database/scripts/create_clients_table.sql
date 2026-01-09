-- Create admins table for admin users
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_encrypted TEXT NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create clients table for client management
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_encrypted TEXT NOT NULL,
  email VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint to invitation_contents
ALTER TABLE clients
ADD CONSTRAINT fk_clients_slug
FOREIGN KEY (slug) REFERENCES invitation_contents(slug)
ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_clients_username ON clients(username);
CREATE INDEX idx_clients_slug ON clients(slug);

-- Add trigger to update admins updated_at timestamp
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_admins_updated_at();

-- Add trigger to update clients updated_at timestamp
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_clients_updated_at();

-- Insert sample admin user
-- Username: admin
-- Password: admin123 (will be encrypted by the application)
-- Note: You need to run the application to encrypt and insert the admin user
-- Or manually encrypt 'admin123' using your encryption key and insert here

-- Example placeholder (replace with actual encrypted value):
-- INSERT INTO admins (username, password_encrypted, email)
-- VALUES ('admin', 'ENCRYPTED_PASSWORD_HERE', 'admin@kirimkata.com')
-- ON CONFLICT (username) DO NOTHING;
