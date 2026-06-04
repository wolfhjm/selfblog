import type { ToolboxCategory } from '~/types/toolbox'

export const assessmentCategory: ToolboxCategory = {
  id: 'assessment',
  title: '心理评测',
  subtitle: '像种一棵状态树，看见压力与资源。',
  icon: 'i-lucide-tree-pine',
  accentClass: 'border-teal-100 bg-teal-50 text-teal-700',
  tools: [
    {
      id: 'state-tree',
      title: '状态树扫描',
      subtitle: '用树的结构快速盘点根、干、枝、叶。',
      typeLabel: '自测',
      durationMinutes: 8,
      tags: ['状态树', '资源', '压力'],
      steps: [
        '根：最近支撑我的东西是什么？睡眠、饮食、关系、环境。',
        '干：我现在最主要的任务或压力是什么？',
        '枝：有哪些选择、资源或可求助对象？',
        '叶：今天能做的一片叶子是什么小动作？'
      ],
      experiment: {
        targetBehavior: '每周做一次状态树扫描，找出一个支撑资源和一个小动作。',
        motivation: '把心理状态放回生活系统里看，而不是只评价情绪。',
        ability: '每个部分写一句即可。',
        prompt: '周末复盘、连续几天状态不稳、准备做周期回顾时。',
        tinyVersion: '只写一个根和一片叶子。',
        successCriterion: '完成根、干、枝、叶四项，并执行一片叶子动作。',
        opportunity: '日记、周期回顾、低落或压力高时。',
        healthContext: '这是自我观察，不是临床测评或诊断。'
      }
    },
    {
      id: 'resource-pressure',
      title: '资源-压力盘点',
      subtitle: '看见压力，也看见能保护你的东西。',
      typeLabel: '盘点',
      durationMinutes: 10,
      tags: ['压力', '资源', '保护因素'],
      steps: [
        '列出当前前三个压力源。',
        '每个压力源旁边写一个已有资源：人、时间、经验、工具、身体状态。',
        '找出最缺的一类资源。',
        '写一个补资源动作，而不是直接硬冲目标。'
      ],
      experiment: {
        targetBehavior: '压力升高时做一次资源-压力盘点。',
        motivation: '避免只盯压力，主动补充保护因素。',
        ability: '只盘点前三项，不需要解决全部问题。',
        prompt: '觉得事情太多、哪里都在漏、想放弃时。',
        tinyVersion: '写一个压力源和一个可用资源。',
        successCriterion: '完成压力源、资源和补资源动作记录。',
        opportunity: '项目推进、复习、情绪低落、人际压力时。',
        healthContext: '长期高压需要关注恢复、支持系统和专业帮助。'
      }
    }
  ]
}

export const thinkingCategory: ToolboxCategory = {
  id: 'thinking',
  title: '思辨训练',
  subtitle: '用谬误拆解和追问训练更清醒的判断。',
  icon: 'i-lucide-brain',
  accentClass: 'border-violet-100 bg-violet-50 text-violet-700',
  tools: [
    {
      id: 'fallacy-drill',
      title: '谬误拆解练习',
      subtitle: '从一个观点里找主张、证据、前提和可能谬误。',
      typeLabel: '思辨',
      durationMinutes: 12,
      tags: ['谬误', '证据', '反例'],
      steps: [
        '写下一个观点，只保留一句主张。',
        '列出它依赖的证据和隐含前提。',
        '检查是否有偷换概念、错误类比、稻草人、诉诸情绪或二分法。',
        '写一个最强反例，再写一个更稳的版本。'
      ],
      experiment: {
        targetBehavior: '每周选一个观点做 12 分钟谬误拆解。',
        motivation: '训练思辨能力，减少被情绪化叙事带走。',
        ability: '只分析一个观点，不追求学术完整。',
        prompt: '读到强烈赞同或反感的观点时。',
        tinyVersion: '只写主张和一个隐含前提。',
        successCriterion: '完成主张、证据、前提、反例和修正版。',
        opportunity: '阅读、刷到观点内容、写作前、争论前。',
        healthContext: '思辨训练要服务于清晰，不用于攻击自己或他人。'
      }
    },
    {
      id: 'grill-me',
      title: 'Grill me 追问',
      subtitle: '让 AI 扮演严格但友好的追问者，找盲点。',
      typeLabel: '对话',
      durationMinutes: 10,
      tags: ['追问', '盲点', '对话'],
      steps: [
        '写下你想被追问的判断、计划或解释。',
        '先写自己最有把握的理由。',
        '再写自己最担心被挑战的地方。',
        '点击“带去探索”，让 AI 按证据、前提、反例和行动后果继续追问。'
      ],
      experiment: {
        targetBehavior: '对重要判断先做一次 Grill me 追问，再决定行动。',
        motivation: '暴露盲点，让决策更稳。',
        ability: '只需要提供一个判断和一个理由。',
        prompt: '准备做重要决定、想发长消息、想开启新计划前。',
        tinyVersion: '只写一个判断，让 AI 问三个问题。',
        successCriterion: '完成一轮追问，并记录一个被修正的点。',
        opportunity: '决策、写作、关系沟通、实验设计前。',
        healthContext: '追问应保持友好和可承受，避免变成自我攻击。'
      }
    }
  ]
}
