import type { ToolboxCategory } from '~/types/toolbox'

export const motivationCategory: ToolboxCategory = {
  id: 'motivation',
  title: '动力激活',
  subtitle: '找到生活乐趣，先行动起来一点。',
  icon: 'i-lucide-zap',
  accentClass: 'border-lime-100 bg-lime-50 text-lime-700',
  tools: [
    {
      id: 'two-minute-start',
      title: '两分钟启动',
      subtitle: '把启动动作缩到低于阻力。',
      typeLabel: '微行为',
      durationMinutes: 2,
      tags: ['Fogg', '启动', '低阻力'],
      steps: [
        '写下想做但卡住的事。',
        '把它缩成两分钟动作：打开文件、写标题、摆出材料、走到门口。',
        '只承诺做两分钟，到点允许停止。',
        '做完庆祝一下，并记录阻力来自哪里。'
      ],
      experiment: {
        targetBehavior: '每天对一个卡住任务做两分钟启动动作。',
        motivation: '用行动降低任务恐惧，而不是等动力出现。',
        ability: '动作必须小到不需要准备状态。',
        prompt: '打开电脑后、吃完饭后、想到“我应该做”时。',
        tinyVersion: '只打开相关文件或工具。',
        successCriterion: '完成两分钟动作，并记录是否愿意继续。',
        opportunity: '学习、创作、运动、整理、社交前。',
        healthContext: '如果长期低动力伴随明显低落和功能受损，需要关注抑郁、睡眠和压力因素。'
      }
    },
    {
      id: 'joy-sampling',
      title: '乐趣采样',
      subtitle: '不是寻找人生意义，先采一个微小有趣样本。',
      typeLabel: '探索',
      durationMinutes: 12,
      tags: ['乐趣', '新输入', '采样'],
      steps: [
        '选一个低成本样本：一首歌、一段访谈、一个陌生主题、一条新路线。',
        '体验时只找“有一点点被吸引”的地方。',
        '写下：它吸引我的是信息、氛围、技巧、故事，还是人？',
        '决定要不要把它扩展成一个随机实验。'
      ],
      experiment: {
        targetBehavior: '每周做一次 12 分钟乐趣采样。',
        motivation: '给生活增加新样本，避免只在旧回路里找动力。',
        ability: '样本必须低成本、可退出、不追求产出。',
        prompt: '周末、低落但不想刷短内容、想尝试新东西时。',
        tinyVersion: '听 30 秒或看一个标题，记录是否有兴趣。',
        successCriterion: '完成一次采样，并记录一个吸引点或无感原因。',
        opportunity: '随机实验、阅读、散步、内容输入。',
        healthContext: '用于行为激活和兴趣采样，不要求强迫自己快乐。'
      }
    }
  ]
}

export const examPressureCategory: ToolboxCategory = {
  id: 'exam-pressure',
  title: '考前减压',
  subtitle: '把压力拆成可控项、不可控项和下一步。',
  icon: 'i-lucide-graduation-cap',
  accentClass: 'border-sky-100 bg-sky-50 text-sky-700',
  tools: [
    {
      id: 'control-list',
      title: '可控清单',
      subtitle: '把压力从整体威胁拆成具体动作。',
      typeLabel: '计划',
      durationMinutes: 8,
      tags: ['可控项', '复习', '减压'],
      steps: [
        '写下最担心的三件事。',
        '每件事旁边标记：可控、部分可控、不可控。',
        '只给可控项写一个 20 分钟内能做的动作。',
        '把不可控项写成一句允许：这部分我先不解决。'
      ],
      experiment: {
        targetBehavior: '考试或压力任务前做一次可控清单。',
        motivation: '把焦虑转成可执行动作，减少无效担心。',
        ability: '只处理前三个担心，不追求完整计划。',
        prompt: '复习前、模拟考后、压力任务前一天。',
        tinyVersion: '只写一个担心和一个可控动作。',
        successCriterion: '完成三项分类，并执行一个 20 分钟动作。',
        opportunity: '考试、面试、汇报、截止日期前。',
        healthContext: '如果压力引发明显躯体症状或持续失眠，应降低负荷并求助。'
      }
    },
    {
      id: 'pre-exam-reset',
      title: '考前降噪呼吸',
      subtitle: '在开始前把注意力带回当下任务。',
      typeLabel: '呼吸',
      durationMinutes: 4,
      tags: ['呼吸', '注意力', '考前'],
      steps: [
        '双脚踩地，注意脚底接触地面的感觉。',
        '吸气数 4 拍，呼气数 6 拍，重复 8 轮。',
        '写下本场只做一件事：读题慢一点、先拿基础分、遇卡跳过。',
        '开始前看一眼这个任务句。'
      ],
      experiment: {
        targetBehavior: '每次模拟或正式考试前做 4 分钟降噪呼吸。',
        motivation: '减少开场慌乱，提高执行稳定性。',
        ability: '可以在座位上完成，不需要额外工具。',
        prompt: '进入考场、打开试卷、开始计时前。',
        tinyVersion: '做 3 次长呼气。',
        successCriterion: '完成呼吸并写下本场任务句。',
        opportunity: '考试、面试、演讲、重要沟通前。',
        healthContext: '用于压力调节，不替代复习策略和必要休息。'
      }
    }
  ]
}
