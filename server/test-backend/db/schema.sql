-- Custom enum type
CREATE TYPE locs AS ENUM (
  'Regenstein Library',
  'Harper Library',
  'John Crerar Library'
);

-- User table
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Order group table (MUST come before food_order)
CREATE TABLE order_group (
  id SERIAL PRIMARY KEY,
  restaurant TEXT,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Food order table
CREATE TABLE food_order (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES order_group(id),
  user_id UUID REFERENCES "user"(id),
  item TEXT,
  quantity INTEGER DEFAULT 1,
  submitted_at TIMESTAMP DEFAULT now()
);

-- Code table
CREATE TABLE code (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES "user"(id),
  code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
