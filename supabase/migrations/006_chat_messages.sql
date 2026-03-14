-- Chat messages for AI menu assistant (linked to menu)
CREATE TABLE IF NOT EXISTS menu_chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id    UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_menu ON menu_chat_messages(menu_id, created_at);
