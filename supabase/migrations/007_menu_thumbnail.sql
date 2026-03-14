-- Add thumbnail column to menus table for dashboard preview
ALTER TABLE menus ADD COLUMN IF NOT EXISTS thumbnail TEXT;
