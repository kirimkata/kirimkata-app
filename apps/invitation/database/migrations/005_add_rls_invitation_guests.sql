-- Row Level Security (RLS) Policies for invitation_guests table

-- Enable RLS
ALTER TABLE invitation_guests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Clients can view their own guests
CREATE POLICY "Clients can view own guests"
ON invitation_guests
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients 
    WHERE id = auth.uid()::uuid
  )
);

-- Policy 2: Clients can insert their own guests
CREATE POLICY "Clients can insert own guests"
ON invitation_guests
FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM clients 
    WHERE id = auth.uid()::uuid
  )
);

-- Policy 3: Clients can update their own guests
CREATE POLICY "Clients can update own guests"
ON invitation_guests
FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM clients 
    WHERE id = auth.uid()::uuid
  )
)
WITH CHECK (
  client_id IN (
    SELECT id FROM clients 
    WHERE id = auth.uid()::uuid
  )
);

-- Policy 4: Clients can delete their own guests
CREATE POLICY "Clients can delete own guests"
ON invitation_guests
FOR DELETE
USING (
  client_id IN (
    SELECT id FROM clients 
    WHERE id = auth.uid()::uuid
  )
);

-- Policy 5: Admins can view all guests
CREATE POLICY "Admins can view all guests"
ON invitation_guests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid()::uuid
  )
);

-- Policy 6: Admins can manage all guests
CREATE POLICY "Admins can manage all guests"
ON invitation_guests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid()::uuid
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid()::uuid
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON invitation_guests TO authenticated;
GRANT SELECT ON invitation_guests TO anon;
