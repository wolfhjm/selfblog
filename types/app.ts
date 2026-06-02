export type Visibility = 'private' | 'public'
export type ExperimentStatus = 'active' | 'done' | 'partial' | 'skipped' | 'draft'
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

export interface PeriodReview {
  id: number
  user_id: number
  period_type: string
  start_date: string
  end_date: string
  title: string
  content: string
  source_summary: string
  visibility: Visibility
  created_at: string
  updated_at: string
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
  target_behavior: string
  motivation: string
  ability: string
  prompt: string
  tiny_version: string
  success_criterion: string
  failure_reason: string
  opportunity: string
  health_context: string
  completion_score: number
  actual_behavior: string
  learning: string
  experiment_type?: string
  verification_result?: string
  linked_object_type?: string | null
  linked_object_id?: number | null
  done_at: string | null
  created_at: string
  updated_at: string
  logs?: ExperimentLog[]
  log_count?: number
  latest_log_date?: string | null
}

export interface ExperimentLog {
  id: number
  user_id: number
  experiment_id: number
  log_date: string
  stage_title: string
  completion_score: number
  actual_behavior: string
  observation: string
  barrier: string
  learning: string
  next_step: string
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
  source_title?: string | null
  target_title?: string | null
  source_experiment_title?: string | null
  target_experiment_title?: string | null
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
  event_chain_id: number | null
  extracted_event_id: number | null
  event_chain_title?: string | null
  event_chain_summary?: string | null
  event_title?: string | null
  event_sort_order?: number | null
  created_at: string
  updated_at: string
}

export interface EventChain {
  id: number
  user_id: number
  source_type: string
  source_id: number | null
  title: string
  summary: string
  status: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ExtractedEvent {
  id: number
  user_id: number
  event_chain_id: number
  title: string
  objective_context: string
  event_detail: string
  activating_event: string
  belief_or_interpretation: string
  consequence: string
  body_signal: string
  emotion: string
  hidden_need: string
  hidden_fear: string
  raw_evidence: string
  sort_order: number
  created_at: string
}
