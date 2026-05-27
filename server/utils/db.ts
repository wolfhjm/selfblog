import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

let db: Database.Database | null = null

export function getDb() {
  if (db) return db

  const dbPath = join(process.cwd(), 'data', 'growth.db')
  mkdirSync(dirname(dbPath), { recursive: true })
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  seed(db)
  return db
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return expected.length === candidate.length && timingSafeEqual(candidate, expected)
}

export function stableSlug(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  if (base) return base
  return createHash('sha1').update(input).digest('hex').slice(0, 10)
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS principles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'life',
      description TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      application TEXT NOT NULL DEFAULT '',
      example TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'private',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, slug)
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      done_text TEXT NOT NULL DEFAULT '',
      feeling_text TEXT NOT NULL DEFAULT '',
      mood INTEGER CHECK(mood BETWEEN 1 AND 5),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '新的自我探索',
      type TEXT NOT NULL DEFAULT 'explore',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      source_conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
      linked_principle_id INTEGER REFERENCES principles(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'captured',
      visibility TEXT NOT NULL DEFAULT 'private',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      week_number TEXT NOT NULL DEFAULT '',
      reflection TEXT NOT NULL DEFAULT '',
      barrier TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'private',
      suggested_by_ai INTEGER NOT NULL DEFAULT 0,
      done_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

function seed(database: Database.Database) {
  const config = useRuntimeConfig()
  const existingUser = database.prepare('SELECT id FROM users WHERE email = ?').get(config.adminEmail) as { id: number } | undefined
  let userId = existingUser?.id

  if (!userId) {
    const result = database.prepare(`
      INSERT INTO users (email, display_name, password_hash)
      VALUES (?, ?, ?)
    `).run(config.adminEmail, '我的成长 OS', hashPassword(config.adminPassword))
    userId = Number(result.lastInsertRowid)
  }

  const count = database.prepare('SELECT COUNT(*) as count FROM principles WHERE user_id = ?').get(userId) as { count: number }
  if (count.count > 0) return

  const insertPrinciple = database.prepare(`
    INSERT INTO principles (user_id, slug, title, category, description, source, application, example, visibility)
    VALUES (@user_id, @slug, @title, @category, @description, @source, @application, @example, @visibility)
  `)

  const principles = [
    {
      title: '从最小可行动作开始',
      category: 'action',
      description: '当目标太大、入口太模糊时，先拆成 30 分钟内可以完成的一次性动作。',
      source: '来自 PRD 中“知道该做什么但找不到切入点”的核心问题。',
      application: '面对学习、创作、社交、健康等目标时，先问：今天能做的最小第一步是什么？',
      example: '不是“坚持画画”，而是“今晚花 30 分钟画一张不发布的速写”。'
    },
    {
      title: '不评判失败，先追问障碍',
      category: 'life',
      description: '没完成不是人格问题，而是系统里有阻力。先看见阻力，再调整下一步。',
      source: '行动实验模块的“没做也不评判”。',
      application: '打卡失败、计划中断、情绪低落时，用复盘替代责备。',
      example: '实验没做时记录“是什么挡住了我”，而不是只留下一个失败标记。'
    },
    {
      title: '把反思沉淀成原则',
      category: 'decision',
      description: '有价值的对话和情绪变化不应该散掉，要被提炼成可复用的判断框架。',
      source: '自我探索模块的一键提取洞察到原则库。',
      application: '每次深度对话后，挑一条真正能指导行动的洞察进入原则库。',
      example: '发现“我总在不确定时拖延”，可沉淀为“先做可逆的小试验”。'
    }
  ]

  for (const item of principles) {
    insertPrinciple.run({
      user_id: userId,
      slug: stableSlug(item.title),
      visibility: 'public',
      ...item
    })
  }

  database.prepare(`
    INSERT INTO experiments (user_id, title, description, status, week_number, visibility)
    VALUES (?, ?, ?, 'active', ?, 'public')
  `).run(
    userId,
    '30 分钟陌生输入实验',
    '选择一个平时不会主动接触的主题，花 30 分钟读一篇文章、看一段访谈或体验一个小工具，然后记录一句“它让我意外的地方”。',
    new Date().toISOString().slice(0, 10)
  )
}
