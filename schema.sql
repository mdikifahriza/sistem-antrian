-- Create queues table
CREATE TABLE queues (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  clinic VARCHAR(100) NOT NULL,
  number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('WAITING', 'CALLED', 'DONE', 'SKIPPED')),
  called_at TIMESTAMP WITH TIME ZONE,
  counter INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_queues_date_status ON queues(date, status);
CREATE INDEX idx_queues_date_number ON queues(date, number);
CREATE INDEX idx_queues_date_clinic ON queues(date, clinic);
CREATE INDEX idx_queues_created_at ON queues(created_at);

-- Enable Row Level Security (optional, for production)
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations" ON queues FOR ALL USING (true);
