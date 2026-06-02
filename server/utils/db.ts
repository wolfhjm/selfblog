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
      mode TEXT NOT NULL DEFAULT 'explore',
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

    CREATE TABLE IF NOT EXISTS journal_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source_conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
      checkin_id INTEGER REFERENCES checkins(id) ON DELETE SET NULL,
      visibility TEXT NOT NULL DEFAULT 'private',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS period_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period_type TEXT NOT NULL DEFAULT 'week',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source_summary TEXT NOT NULL DEFAULT '{}',
      visibility TEXT NOT NULL DEFAULT 'private',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
      target_behavior TEXT NOT NULL DEFAULT '',
      motivation TEXT NOT NULL DEFAULT '',
      ability TEXT NOT NULL DEFAULT '',
      prompt TEXT NOT NULL DEFAULT '',
      tiny_version TEXT NOT NULL DEFAULT '',
      success_criterion TEXT NOT NULL DEFAULT '',
      failure_reason TEXT NOT NULL DEFAULT '',
      opportunity TEXT NOT NULL DEFAULT '',
      health_context TEXT NOT NULL DEFAULT '',
      completion_score INTEGER NOT NULL DEFAULT 0,
      actual_behavior TEXT NOT NULL DEFAULT '',
      learning TEXT NOT NULL DEFAULT '',
      done_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS adventure_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      prompt_hint TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, title)
    );

    CREATE TABLE IF NOT EXISTS experiment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
      log_date TEXT NOT NULL,
      stage_title TEXT NOT NULL DEFAULT '',
      completion_score INTEGER NOT NULL DEFAULT 0,
      actual_behavior TEXT NOT NULL DEFAULT '',
      observation TEXT NOT NULL DEFAULT '',
      barrier TEXT NOT NULL DEFAULT '',
      learning TEXT NOT NULL DEFAULT '',
      next_step TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cognitive_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      source_type TEXT,
      source_id INTEGER,
      verification_status TEXT NOT NULL DEFAULT 'unverified',
      visibility TEXT NOT NULL DEFAULT 'private',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS object_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL,
      source_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      relation_type TEXT NOT NULL DEFAULT 'related_to',
      confidence REAL NOT NULL DEFAULT 0.7,
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, source_type, source_id, target_type, target_id, relation_type)
    );

    CREATE TABLE IF NOT EXISTS event_chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL,
      source_id INTEGER,
      title TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_by TEXT NOT NULL DEFAULT 'ai',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS extracted_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_chain_id INTEGER NOT NULL REFERENCES event_chains(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      objective_context TEXT NOT NULL DEFAULT '',
      event_detail TEXT NOT NULL DEFAULT '',
      activating_event TEXT NOT NULL DEFAULT '',
      belief_or_interpretation TEXT NOT NULL DEFAULT '',
      consequence TEXT NOT NULL DEFAULT '',
      body_signal TEXT NOT NULL DEFAULT '',
      emotion TEXT NOT NULL DEFAULT '',
      hidden_need TEXT NOT NULL DEFAULT '',
      hidden_fear TEXT NOT NULL DEFAULT '',
      raw_evidence TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      candidate_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      source_type TEXT,
      source_id INTEGER,
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      created_by TEXT NOT NULL DEFAULT 'ai',
      accepted_object_type TEXT,
      accepted_object_id INTEGER,
      event_chain_id INTEGER REFERENCES event_chains(id) ON DELETE SET NULL,
      extracted_event_id INTEGER REFERENCES extracted_events(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cognitive_items_user_type ON cognitive_items(user_id, item_type, updated_at);
    CREATE INDEX IF NOT EXISTS idx_object_links_source ON object_links(user_id, source_type, source_id);
    CREATE INDEX IF NOT EXISTS idx_object_links_target ON object_links(user_id, target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_candidates_user_status ON candidates(user_id, status, updated_at);
    CREATE INDEX IF NOT EXISTS idx_event_chains_source ON event_chains(user_id, source_type, source_id);
    CREATE INDEX IF NOT EXISTS idx_extracted_events_chain ON extracted_events(user_id, event_chain_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_experiment_logs_experiment ON experiment_logs(user_id, experiment_id, log_date);
  `)

  ensureColumn(database, 'principles', 'verification_status', "TEXT NOT NULL DEFAULT 'unverified'")
  ensureColumn(database, 'principles', 'source_status', "TEXT NOT NULL DEFAULT 'unbound'")
  ensureColumn(database, 'conversations', 'mode', "TEXT NOT NULL DEFAULT 'explore'")
  ensureColumn(database, 'experiments', 'experiment_type', "TEXT NOT NULL DEFAULT 'single'")
  ensureColumn(database, 'experiments', 'verification_result', "TEXT NOT NULL DEFAULT 'unknown'")
  ensureColumn(database, 'experiments', 'linked_object_type', 'TEXT')
  ensureColumn(database, 'experiments', 'linked_object_id', 'INTEGER')
  ensureColumn(database, 'experiments', 'target_behavior', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'motivation', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'ability', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'prompt', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'tiny_version', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'success_criterion', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'failure_reason', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'opportunity', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'health_context', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'completion_score', "INTEGER NOT NULL DEFAULT 0")
  ensureColumn(database, 'experiments', 'actual_behavior', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'experiments', 'learning', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(database, 'candidates', 'event_chain_id', 'INTEGER')
  ensureColumn(database, 'candidates', 'extracted_event_id', 'INTEGER')
}

function ensureColumn(database: Database.Database, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (columns.some((item) => item.name === column)) return
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
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
  seedAdventureCategories(database, userId)
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
    appDateString()
  )
}

function seedAdventureCategories(database: Database.Database, userId: number) {
  const count = database.prepare('SELECT COUNT(*) as count FROM adventure_categories WHERE user_id = ?').get(userId) as { count: number }
  if (count.count > 0) return

  const insert = database.prepare(`
    INSERT INTO adventure_categories (user_id, title, description, prompt_hint, sort_order)
    VALUES (@user_id, @title, @description, @prompt_hint, @sort_order)
  `)
  const categories = [
    {
      title: '新输入',
      description: '读、看、听一个平时不会主动接触的主题。',
      prompt_hint: '生成一个低成本陌生输入实验，重点是拓宽经验样本，不要求立刻产出。',
      sort_order: 10
    },
    {
      title: '微社交',
      description: '轻量连接，不强迫高压社交。',
      prompt_hint: '生成一个安全、低压力、可退出的微社交实验，避免尴尬挑战和强迫表达。',
      sort_order: 20
    },
    {
      title: '身体感知',
      description: '观察走路、呼吸、姿态、疲劳和身体信号。',
      prompt_hint: '生成一个身体观察实验，重点是看见状态，不追求运动强度。',
      sort_order: 30
    },
    {
      title: '环境变化',
      description: '换路线、换位置、整理一个角落或改变默认选项。',
      prompt_hint: '生成一个环境设计实验，让用户用很小的空间或路线变化打破惯性。',
      sort_order: 40
    },
    {
      title: '微创作',
      description: '写一句、画一张、录一段或做一个小表达。',
      prompt_hint: '生成一个不发布、不求好看的微创作实验，降低评价压力。',
      sort_order: 50
    },
    {
      title: '反惯性',
      description: '用不同顺序做一件日常小事，观察自动驾驶。',
      prompt_hint: '生成一个反惯性实验，动作要小、可逆、安全，重点是观察自动反应。',
      sort_order: 60
    },
    {
      title: '勇气练习',
      description: '做一个低风险但有点不舒服的小表达。',
      prompt_hint: '生成一个低风险勇气实验，必须允许退一步版本，不制造高风险冲突。',
      sort_order: 70
    },
    {
      title: '思辨训练',
      description: '随机一个观点，写证据、反例和隐含前提。',
      prompt_hint: '生成一个思辨练习实验，围绕主张、证据、隐含前提和反例展开。',
      sort_order: 80
    }
  ]

  for (const category of categories) {
    insert.run({ user_id: userId, ...category })
  }
}
