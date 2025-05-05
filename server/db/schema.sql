-- Custom enum type
CREATE TYPE locs AS ENUM (
  'Regenstein Library',
  'Harper Library',
  'John Crerar Library'
);

-- User table
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  cell TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order group table
CREATE TABLE order_group (
  id SERIAL PRIMARY KEY,
  food_order_id INTEGER, -- Will be updated with FOREIGN KEY after food_order table is created
  user_id UUID REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Food order table
CREATE TABLE food_order (
  id SERIAL PRIMARY KEY,
  owner_id UUID REFERENCES "user"(id) NOT NULL,
  restaurant TEXT NOT NULL,
  expiration TIMESTAMP NOT NULL,
  loc locs NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Add the foreign key constraint to order_group after food_order is created
ALTER TABLE order_group ADD CONSTRAINT fk_food_order 
  FOREIGN KEY (food_order_id) REFERENCES food_order(id) ON DELETE CASCADE;

-- Code table
CREATE TABLE code (
  email TEXT NOT NULL,
  key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (email, key)
);

-- seed users table
INSERT INTO "user" (id, name, email, created_at) VALUES
  ('11111111-aaaa-bbbb-cccc-111111111111', 'Alice Nguyen', 'alice@example.com', NOW()),
  ('22222222-bbbb-cccc-dddd-222222222222', 'Bob Smith', 'bob@example.com', NOW() - INTERVAL '1 day'),
  ('33333333-cccc-dddd-eeee-333333333333', 'Charlie Li', 'charlie@example.com', NOW() - INTERVAL '2 days'),
  ('44444444-dddd-eeee-ffff-444444444444', 'Diana Patel', 'diana@example.com', NOW() - INTERVAL '3 days'),
  ('55555555-eeee-ffff-aaaa-555555555555', 'Evan Garcia', 'evan@example.com', NOW() - INTERVAL '4 days');