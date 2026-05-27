export type Visibility = 'private' | 'public'
export type ExperimentStatus = 'active' | 'done' | 'skipped' | 'draft'
export type MessageRole = 'system' | 'user' | 'assistant'

export interface User {
  id: number
  email: string
  display_name: string
}

export interface Principle {
  id: number
  user_id: number
  slug: string
  title: string
  category: string
  description: string
  source: string
  application: string
  example: string
  visibility: Visibility
  created_at: string
  updated_at: string
}

export interface Checkin {
  id: number
  user_id: number
  date: string
  done_text: string
  feeling_text: string
  mood: number
  created_at: string
}

export interface Conversation {
  id: number
  user_id: number
  title: string
  type: string
  created_at: string
}

export interface Message {
  id: number
  conversation_id: number
  role: MessageRole
  content: string
  created_at: string
}

export interface Insight {
  id: number
  user_id: number
  content: string
  source_conversation_id: number | null
  linked_principle_id: number | null
  status: string
  visibility: Visibility
  created_at: string
}

export interface Experiment {
  id: number
  user_id: number
  title: string
  description: string
  status: ExperimentStatus
  week_number: string
  reflection: string
  barrier: string
  visibility: Visibility
  suggested_by_ai: number
  done_at: string | null
  created_at: string
  updated_at: string
}
