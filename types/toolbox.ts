export type ToolboxToolExperiment = {
  targetBehavior: string
  motivation: string
  ability: string
  prompt: string
  tinyVersion: string
  successCriterion: string
  opportunity: string
  healthContext: string
}

export type ToolboxTool = {
  id: string
  title: string
  subtitle: string
  typeLabel: string
  durationMinutes?: number
  preparation?: string
  caution?: string
  tags: string[]
  steps: string[]
  experiment: ToolboxToolExperiment
}

export type ToolboxCategory = {
  id: string
  title: string
  subtitle: string
  icon: string
  accentClass: string
  tools: ToolboxTool[]
}

export type ToolboxPracticeDraft = {
  intensityBefore: number
  intensityAfter: number
  context: string
  reflection: string
  nextStep: string
}

export type ToolboxLog = {
  id: number
  user_id: number
  category_id: string
  category_title: string
  tool_id: string
  tool_title: string
  tool_type: string
  duration_seconds: number
  intensity_before: number
  intensity_after: number
  context: string
  reflection: string
  next_step: string
  created_at: string
  updated_at: string
}
