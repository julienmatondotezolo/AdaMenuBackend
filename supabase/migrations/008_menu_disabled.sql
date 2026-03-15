-- Add disabled flag for soft-delete (owner can disable, only admin can hard-delete)
ALTER TABLE menus ADD COLUMN disabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_menus_disabled ON menus (disabled);
