-- TodayPaper 初始数据库迁移
-- 在 Supabase SQL Editor 中执行，或作为参考手动建表

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  today_update_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- 投递设置表
CREATE TABLE IF NOT EXISTS delivery_settings (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  daily_delivery BOOLEAN NOT NULL DEFAULT true,
  delivery_time TEXT NOT NULL DEFAULT '08:00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 日报表
CREATE TABLE IF NOT EXISTS daily_issues (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  issue_date DATE NOT NULL,
  content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, issue_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_issues_user_id ON daily_issues(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_issues_issue_date ON daily_issues(issue_date DESC);

-- 投递日志表
CREATE TABLE IF NOT EXISTS delivery_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  issue_date DATE NOT NULL,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_user_id ON delivery_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_created_at ON delivery_logs(created_at DESC);

-- 主题/专题海报表
CREATE TABLE IF NOT EXISTS topic_posters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'user_01',
  kind TEXT NOT NULL CHECK (kind IN ('theme', 'topic')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_topic_posters_user_id ON topic_posters(user_id);

-- 历史作品表
CREATE TABLE IF NOT EXISTS creations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'user_01',
  type TEXT NOT NULL CHECK (type IN ('daily_issue', 'theme_poster', 'topic_poster')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT NOT NULL DEFAULT '',
  href TEXT NOT NULL,
  saved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (href)
);

CREATE INDEX IF NOT EXISTS idx_creations_user_id ON creations(user_id);
CREATE INDEX IF NOT EXISTS idx_creations_created_at ON creations(created_at DESC);

-- Row Level Security (可选，若启用请根据业务补充策略)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE creations ENABLE ROW LEVEL SECURITY;
