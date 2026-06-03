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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS thinking_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      world_type TEXT NOT NULL DEFAULT 'reality',
      fallacy_type TEXT NOT NULL DEFAULT '',
      difficulty INTEGER NOT NULL DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 5),
      prompt TEXT NOT NULL DEFAULT '',
      question TEXT NOT NULL DEFAULT '',
      options TEXT NOT NULL DEFAULT '[]',
      correct_option TEXT NOT NULL DEFAULT '',
      short_explanation TEXT NOT NULL DEFAULT '',
      deep_explanation TEXT NOT NULL DEFAULT '',
      rebuttal TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      visibility TEXT NOT NULL DEFAULT 'private',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS thinking_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      challenge_id INTEGER NOT NULL REFERENCES thinking_challenges(id) ON DELETE CASCADE,
      selected_option TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cognitive_items_user_type ON cognitive_items(user_id, item_type, updated_at);
    CREATE INDEX IF NOT EXISTS idx_object_links_source ON object_links(user_id, source_type, source_id);
    CREATE INDEX IF NOT EXISTS idx_object_links_target ON object_links(user_id, target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_candidates_user_status ON candidates(user_id, status, updated_at);
    CREATE INDEX IF NOT EXISTS idx_thinking_challenges_user_world ON thinking_challenges(user_id, world_type, status, updated_at);
    CREATE INDEX IF NOT EXISTS idx_thinking_attempts_user_challenge ON thinking_attempts(user_id, challenge_id, created_at);
  `)

  ensureColumn(database, 'principles', 'verification_status', "TEXT NOT NULL DEFAULT 'unverified'")
  ensureColumn(database, 'principles', 'source_status', "TEXT NOT NULL DEFAULT 'unbound'")
  ensureColumn(database, 'experiments', 'experiment_type', "TEXT NOT NULL DEFAULT 'single'")
  ensureColumn(database, 'experiments', 'verification_result', "TEXT NOT NULL DEFAULT 'unknown'")
  ensureColumn(database, 'experiments', 'linked_object_type', 'TEXT')
  ensureColumn(database, 'experiments', 'linked_object_id', 'INTEGER')
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
  if (count.count > 0) {
    seedThinkingChallenges(database, userId)
    return
  }

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

  seedThinkingChallenges(database, userId)
}

function seedThinkingChallenges(database: Database.Database, userId: number) {
  const count = database.prepare('SELECT COUNT(*) as count FROM thinking_challenges WHERE user_id = ?').get(userId) as { count: number }
  if (count.count > 0) return

  const insertChallenge = database.prepare(`
    INSERT INTO thinking_challenges (
      user_id,
      title,
      world_type,
      fallacy_type,
      difficulty,
      prompt,
      question,
      options,
      correct_option,
      short_explanation,
      deep_explanation,
      rebuttal,
      tags,
      visibility
    )
    VALUES (
      @user_id,
      @title,
      @world_type,
      @fallacy_type,
      @difficulty,
      @prompt,
      @question,
      @options,
      @correct_option,
      @short_explanation,
      @deep_explanation,
      @rebuttal,
      @tags,
      @visibility
    )
  `)

  const challenges = [
    {
      title: 'AI 写的方案为什么不能直接交？',
      world_type: 'reality',
      fallacy_type: '偷换概念',
      difficulty: 2,
      prompt: '你用 AI 很快写出一份方案。领导说：“既然 AI 都能写出来，那你其实没什么价值。”同事补了一句：“AI 写得这么快，所以人类思考已经没必要了。”',
      question: '这段话里最明显的逻辑问题是什么？',
      options: [
        { key: 'A', label: '偷换概念：把“AI 能生成文本”偷换成“人类思考没价值”', explanation: '正确。生成文本不等于理解、判断、负责和解释。' },
        { key: 'B', label: '诉诸多数：因为很多人用 AI，所以 AI 一定正确', explanation: '这里没有用“多数人都这么做”作为主要论据。' },
        { key: 'C', label: '循环论证：因为 AI 有价值，所以 AI 有价值', explanation: '这段话不是在用结论证明结论。' },
        { key: 'D', label: '没有问题', explanation: '这段话把不同概念混在一起，确实有明显问题。' }
      ],
      correct_option: 'A',
      short_explanation: 'AI 能生成内容，不等于人类思考、理解和责任没有价值。',
      deep_explanation: '这段论证把“AI 可以产出一段方案文本”偷换成了“人类不需要理解方案”。真正的工作价值还包括定义问题、判断输出是否可靠、解释关键逻辑、承担后果和做取舍。',
      rebuttal: 'AI 可以帮我提高生成速度，但交付前我仍然需要理解逻辑、检查质量，并能回答关键追问。',
      tags: 'AI协作,输入质量,主动加工,偷换概念'
    },
    {
      title: '龙火审判',
      world_type: 'fantasy',
      fallacy_type: '相关不等于因果',
      difficulty: 1,
      prompt: '王国粮仓失火。宰相说：“火灾发生前，北境商人刚进城。既然他们来了以后就着火了，那一定是他们带来了灾祸。为了安全，我们必须驱逐所有北境人。”',
      question: '这段论证最主要的问题是什么？',
      options: [
        { key: 'A', label: '相关不等于因果', explanation: '正确。时间先后不等于因果关系。' },
        { key: 'B', label: '假两难', explanation: '这里虽然提出了驱逐方案，但核心错误是把先后关系当成因果。' },
        { key: 'C', label: '诉诸权威', explanation: '宰相有权力，但论证重点不是“因为我是宰相所以对”。' },
        { key: 'D', label: '循环论证', explanation: '这不是用结论重复证明结论。' }
      ],
      correct_option: 'A',
      short_explanation: '北境商人进城和粮仓失火相邻发生，不代表前者导致后者。',
      deep_explanation: '要证明因果关系，需要机制和证据，例如谁接触过粮仓、火源从哪里来、是否有其他嫌疑人。只凭时间顺序就扩大到驱逐所有北境人，是危险的因果跳跃。',
      rebuttal: '我们只能说两件事时间接近，还不能说他们导致火灾。先查火源、目击证据和其他可能原因。',
      tags: '幻想类,因果判断,证据分析,相关不等于因果'
    }
  ]

  for (const challenge of challenges) {
    insertChallenge.run({
      user_id: userId,
      visibility: 'private',
      ...challenge,
      options: JSON.stringify(challenge.options)
    })
  }
}
