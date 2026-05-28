export type Visibility = 'private' | 'public'
export type ExperimentStatus = 'active' | 'done' | 'skipped' | 'draft'
export type MessageRole = 'system' | 'user' | 'assistant'
export type CognitiveItemType = 'pattern' | 'case' | 'reaction' | 'lesson' | 'insight'
export type VerificationStatus = 'unverified' | 'has_example' | 'testing' | 'partial' | 'strong' | 'needs_revision' | 'discarded'
export type CandidateType = CognitiveItemType | 'experiment'
export type CandidateStatus = 'pending' | 'accepted' | 'dismissed'

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
  verification_status?: VerificationStatus
  source_status?: string
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
  experiment_type?: string
  verification_result?: string
  linked_object_type?: string | null
  linked_object_id?: number | null
  done_at: string | null
  created_at: string
  updated_at: string
}

export interface CognitiveItem {
  id: number
  user_id: number
  item_type: CognitiveItemType
  title: string
  content: string
  source_type: string | null
  source_id: number | null
  verification_status: VerificationStatus
  visibility: Visibility
  link_count?: number
  created_at: string
  updated_at: string
}

export interface ObjectLink {
  id: number
  user_id: number
  source_type: string
  source_id: number
  target_type: string
  target_id: number
  relation_type: string
  confidence: number
  status: string
  created_by: string
  created_at: string
}

export interface Candidate {
  id: number
  user_id: number
  candidate_type: CandidateType
  title: string
  content: string
  source_type: string | null
  source_id: number | null
  payload: string
  status: CandidateStatus
  created_by: string
  accepted_object_type: string | null
  accepted_object_id: number | null
  created_at: string
  updated_at: string
}
