import type { ToolboxCategory } from '~/types/toolbox'

export const painEaseCategory: ToolboxCategory = {
  id: 'pain-ease',
  title: '疼痛舒缓',
  subtitle: '疼痛时让自己好受一点，同时保留边界。',
  icon: 'i-lucide-shield-check',
  accentClass: 'border-amber-100 bg-amber-50 text-amber-700',
  tools: [
    {
      id: 'pain-breath-anchor',
      title: '疼痛呼吸锚点',
      subtitle: '不和疼痛硬扛，找一个相对舒服的锚点。',
      typeLabel: '舒缓',
      durationMinutes: 5,
      caution: '剧烈、持续、原因不明或快速加重的疼痛，请优先寻求医疗帮助。',
      tags: ['疼痛', '呼吸', '注意力'],
      steps: [
        '给疼痛强度打分，只记录数字，不评价自己。',
        '找一个不痛或相对舒服的身体区域作为锚点。',
        '吸气时注意锚点，呼气时想象给疼痛区域留出一点空间。',
        '结束后决定一个照顾动作：调整姿势、补水、休息或求助。'
      ],
      experiment: {
        targetBehavior: '轻中度不适时，先做 5 分钟疼痛呼吸锚点并记录变化。',
        motivation: '在疼痛中恢复一点掌控感，避免恐慌放大。',
        ability: '不需要消除疼痛，只需找到相对舒服的锚点。',
        prompt: '疼痛让自己烦躁、害怕或难以集中时。',
        tinyVersion: '找一个舒服区域，做 3 次呼气。',
        successCriterion: '记录疼痛强度前后变化和一个照顾动作。',
        opportunity: '久坐后、轻微头痛、肌肉紧张、身体不适时。',
        healthContext: '这不是医疗处理，异常疼痛需要专业诊断。'
      }
    },
    {
      id: 'comfort-boundary',
      title: '舒适边界扫描',
      subtitle: '看清哪里可以动、哪里需要保护。',
      typeLabel: '身体观察',
      durationMinutes: 6,
      caution: '不要强行拉伸或挑战疼痛阈值。',
      tags: ['边界', '身体', '安全'],
      steps: [
        '慢慢观察疼痛周围的区域，不直接冲向最痛点。',
        '标出三个区：舒服、可忍受、需要保护。',
        '只在舒服区和可忍受区做很小的调整。',
        '记录什么让疼痛减轻、加重或没有变化。'
      ],
      experiment: {
        targetBehavior: '身体不适时做一次舒适边界扫描，避免硬扛。',
        motivation: '建立身体边界感，减少忽视或过度恐慌。',
        ability: '只观察和微调，不做高强度动作。',
        prompt: '发现自己正在忍痛继续工作或反复担心身体时。',
        tinyVersion: '只标出一个舒服区。',
        successCriterion: '记录三个区域和一个安全调整动作。',
        opportunity: '工作间隙、轻微不适、运动后恢复。',
        healthContext: '若疼痛来源不明或伴随危险信号，应停止练习并就医。'
      }
    }
  ]
}
