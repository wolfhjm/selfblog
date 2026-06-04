import type { ToolboxCategory, ToolboxPracticeDraft, ToolboxTool } from '~/types/toolbox'

export function formatToolboxDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function toolboxLogPayload(category: ToolboxCategory | undefined, tool: ToolboxTool | undefined, practice: ToolboxPracticeDraft, elapsedSeconds: number) {
  return {
    category_id: category?.id || '',
    category_title: category?.title || '',
    tool_id: tool?.id || '',
    tool_title: tool?.title || '',
    tool_type: tool?.typeLabel || '',
    duration_seconds: elapsedSeconds,
    intensity_before: practice.intensityBefore,
    intensity_after: practice.intensityAfter,
    context: practice.context,
    reflection: practice.reflection,
    next_step: practice.nextStep
  }
}

export function toolboxConversationPrompt(category: ToolboxCategory | undefined, tool: ToolboxTool | undefined, practice: ToolboxPracticeDraft, elapsedSeconds: number) {
  return [
    '我刚做了一次心理工具箱练习，想继续做结构化复盘。',
    `类别：${category?.title}`,
    `工具：${tool?.title}`,
    `工具逻辑：${tool?.tags.join('、')}`,
    `用时：${formatToolboxDuration(elapsedSeconds)}`,
    `开始强度：${practice.intensityBefore}/10`,
    `结束强度：${practice.intensityAfter}/10`,
    `当时情境：${practice.context || '没有记录'}`,
    `完成后感受：${practice.reflection || '没有记录'}`,
    `下一步：${practice.nextStep || '没有记录'}`,
    '',
    '请你用温和但有洞察的方式帮我继续追问：客观环境是什么、触发事件是什么、我当时的解释/信念是什么、情绪和身体信号是什么、隐藏需求或恐惧可能是什么、下一步可以怎样变成更小的行动实验。一次只问一个关键问题。'
  ].join('\n')
}

export function toolboxExperimentPayload(tool: ToolboxTool, practice: ToolboxPracticeDraft, elapsedSeconds: number) {
  return {
    title: `练习：${tool.title}`,
    description: [
      tool.subtitle,
      practice.context ? `最近触发场景：${practice.context}` : '',
      practice.reflection ? `本次感受：${practice.reflection}` : ''
    ].filter(Boolean).join('\n'),
    status: 'draft',
    visibility: 'private',
    week_number: appDateString(),
    suggested_by_ai: 0,
    target_behavior: tool.experiment.targetBehavior,
    motivation: tool.experiment.motivation,
    ability: tool.experiment.ability,
    prompt: tool.experiment.prompt,
    tiny_version: tool.experiment.tinyVersion,
    success_criterion: tool.experiment.successCriterion,
    opportunity: tool.experiment.opportunity,
    health_context: tool.experiment.healthContext,
    completion_score: 0,
    actual_behavior: elapsedSeconds ? `已尝试 ${formatToolboxDuration(elapsedSeconds)}。` : '',
    learning: practice.reflection || ''
  }
}

export function readableToolboxError(err: any, fallback: string) {
  return String(err?.message || err?.statusMessage || fallback).replace(/\s+/g, ' ').slice(0, 180)
}
