import type { ToolboxCategory } from '~/types/toolbox'

export const emotionCoolingCategory: ToolboxCategory = {
  id: 'emotion-cooling',
  title: '情绪降温',
  subtitle: '愤怒、悲伤、焦虑、恐惧先降到可思考。',
  icon: 'i-lucide-heart-pulse',
  accentClass: 'border-rose-100 bg-rose-50 text-rose-700',
  tools: [
    {
      id: 'emotion-wave',
      title: '90 秒情绪浪潮',
      subtitle: '把情绪当成身体波峰，不急着解释和行动。',
      typeLabel: '身体观察',
      durationMinutes: 2,
      tags: ['情绪命名', '身体信号', '冲动暂停'],
      steps: [
        '给当前情绪取一个尽量具体的名字，例如委屈、害怕、羞耻、愤怒。',
        '找到它最明显的身体位置，只描述温度、紧绷、重量或跳动。',
        '做 6 次慢呼吸，呼气比吸气长一点，期间只观察强度变化。',
        '问自己：现在最小的安全动作是什么？先不做重大决定。'
      ],
      experiment: {
        targetBehavior: '在强烈情绪出现时，先做 90 秒身体观察，再决定下一步。',
        motivation: '把情绪从自动反应变成可观察对象，减少冲动行为。',
        ability: '只需要停下来、命名情绪、观察身体信号，不需要立刻想明白原因。',
        prompt: '当情绪强度达到 7/10 以上，或很想立刻回复/逃开时。',
        tinyVersion: '只说出一个情绪名字，做一次长呼气。',
        successCriterion: '完成一次情绪命名和 6 次慢呼吸，并记录强度变化。',
        opportunity: '聊天冲突、工作受挫、睡前反刍、临时焦虑时。',
        healthContext: '用于日常情绪调节；若出现持续失控、自伤念头或严重惊恐，应寻求线下专业支持。'
      }
    },
    {
      id: 'abc-split',
      title: 'ABC 快速拆分',
      subtitle: '把事件、解释和后果拆开，给情绪留出空间。',
      typeLabel: '认知记录',
      durationMinutes: 6,
      tags: ['ABC', '事实/解释', '替代想法'],
      steps: [
        'A：只写客观发生了什么，像摄像头一样，不加评价。',
        'B：写下脑中自动冒出的解释、规则或担心。',
        'C：写情绪、身体反应和想做的事。',
        '补一条更温和但仍诚实的解释：还有没有别的可能？'
      ],
      experiment: {
        targetBehavior: '每次明显反刍时，用 ABC 写下事实、解释和情绪后果。',
        motivation: '训练从自动信念里退一步，发现隐藏假设。',
        ability: '每栏只写一句话，允许粗糙。',
        prompt: '当自己开始反复想同一件不舒服的事时。',
        tinyVersion: '只写 A 和 B 各一句。',
        successCriterion: '完成 A/B/C 三栏，并写出至少一个替代解释。',
        opportunity: '日记、对话前、冲突后、做决定前。',
        healthContext: '适合日常认知梳理，不替代心理咨询或诊断。'
      }
    },
    {
      id: 'evidence-gap',
      title: '证据-解释分离',
      subtitle: '把“我知道的”和“我推断的”分开放。',
      typeLabel: '思维整理',
      durationMinutes: 5,
      tags: ['证据', '解释', '不确定性'],
      steps: [
        '列 3 条直接证据：我亲眼看到、听到、确实发生的是什么？',
        '列 3 条解释：我把这些证据理解成了什么？',
        '标出最强的一条解释，并写出它还缺什么证据。',
        '决定一个低风险验证动作，而不是继续脑内审判。'
      ],
      experiment: {
        targetBehavior: '遇到不确定的人际或工作反馈时，先列证据和解释。',
        motivation: '降低读心和灾难化，提升验证意识。',
        ability: '只需要写 6 条短句，不要求马上得出结论。',
        prompt: '当自己确信“对方肯定是某种意思”时。',
        tinyVersion: '写一条证据和一条解释。',
        successCriterion: '写出证据、解释和一个验证动作。',
        opportunity: '消息未回、评价模糊、被拒绝、方案被质疑后。',
        healthContext: '用于降低焦虑性推断；如果情绪强度过高，先做情绪降温。'
      }
    }
  ]
}
