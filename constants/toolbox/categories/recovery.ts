import type { ToolboxCategory } from '~/types/toolbox'

export const fatigueChargeCategory: ToolboxCategory = {
  id: 'fatigue-charge',
  title: '疲惫充电',
  subtitle: '高效休息、恢复精力，不把累误判成懒。',
  icon: 'i-lucide-battery-charging',
  accentClass: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  tools: [
    {
      id: 'mindful-breath',
      title: '正念呼吸',
      subtitle: '把注意力从任务拉回呼吸，给系统降噪。',
      typeLabel: '正念',
      durationMinutes: 8,
      preparation: '坐着或站着都可以，屏幕放远一点。',
      tags: ['呼吸', '注意力', '恢复'],
      steps: [
        '把注意力放在鼻尖、胸口或腹部的呼吸触感。',
        '走神时只在心里说“想法”，然后回到下一次呼吸。',
        '不要追求放空，只练习发现自己走神了。',
        '最后问：我现在需要继续、休息，还是换一种做法？'
      ],
      experiment: {
        targetBehavior: '疲惫或注意力散掉时，做一轮 8 分钟正念呼吸。',
        motivation: '恢复注意力，让疲惫从模糊感变成可识别信号。',
        ability: '无需姿势标准，只要能观察几次呼吸。',
        prompt: '连续刷屏、发呆或任务切换超过 10 分钟时。',
        tinyVersion: '做 3 次呼吸并记录一句身体状态。',
        successCriterion: '完成一轮呼吸练习，并记录练习前后精力变化。',
        opportunity: '午后、工作切换、学习间隙、睡前。',
        healthContext: '如果长期疲惫明显影响生活，需要同时关注睡眠、饮食、运动和医疗因素。'
      }
    },
    {
      id: 'mindful-tasting',
      title: '正念品尝',
      subtitle: '用一杯饮品做低门槛感官复位。',
      typeLabel: '感官练习',
      durationMinutes: 11,
      preparation: '准备一杯水、茶、咖啡或其他安全饮品。',
      tags: ['感官', '慢下来', '恢复'],
      steps: [
        '先看颜色、形状、光泽，不急着喝。',
        '闻气味，描述它像什么，不评价好坏。',
        '小口品尝，分辨温度、质地、味道变化。',
        '喝完后写一句：我的身体现在比刚才多知道了什么？'
      ],
      experiment: {
        targetBehavior: '疲惫时用一杯饮品做 10 分钟正念品尝。',
        motivation: '通过感官锚点恢复当下感，减少无意识刷屏。',
        ability: '只需要有一杯饮品和几分钟不被打扰。',
        prompt: '想休息但又不知道怎么休息时。',
        tinyVersion: '只闻 10 秒，然后喝一小口。',
        successCriterion: '完成一次感官观察，并记录一个身体变化。',
        opportunity: '早晨、下午、夜间工作结束后。',
        healthContext: '选择适合自己健康状况的饮品，避免过量咖啡因。'
      }
    },
    {
      id: 'charge-micro-action',
      title: '充电微行动',
      subtitle: '用一个很小的动作打断耗竭循环。',
      typeLabel: '小行动',
      tags: ['Fogg', '补能', '低门槛'],
      steps: [
        '选一个 2 分钟内能完成的补能动作：倒水、开窗、伸展、洗脸、收桌面一角。',
        '把动作缩到“肯定能做”的版本。',
        '做完立即记录：是更清醒、更烦，还是没有变化？',
        '如果有效，把它绑定到一个固定提示：例如起身后、喝水前、打开电脑前。'
      ],
      experiment: {
        targetBehavior: '每天在一个固定提示后做一次 2 分钟补能动作。',
        motivation: '把恢复精力从意志力任务变成默认小动作。',
        ability: '动作必须足够小，累的时候也能做。',
        prompt: '第一次离开座位、打开电脑、准备刷手机前。',
        tinyVersion: '只站起来喝一口水。',
        successCriterion: '连续记录 3 次补能动作及其效果。',
        opportunity: '工作日、学习日、长期任务中段。',
        healthContext: '关注疲惫是否与睡眠、饮食、运动和压力长期失衡有关。'
      }
    }
  ]
}

export const sleepRelaxCategory: ToolboxCategory = {
  id: 'sleep-relax',
  title: '放松助眠',
  subtitle: '缓解压力，把反刍从脑内移到纸面。',
  icon: 'i-lucide-moon',
  accentClass: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  tools: [
    {
      id: 'sleep-unload',
      title: '睡前卸载',
      subtitle: '把脑内待办、担心和明天第一步分开。',
      typeLabel: '书写',
      durationMinutes: 10,
      tags: ['反刍', '睡前', '任务卸载'],
      steps: [
        '写下所有还在脑中转的事，不排序。',
        '把它们分成：明天可做、暂时不可控、需要找人确认。',
        '给明天只留一个第一步，写得越小越好。',
        '合上记录后，对自己说：今天的处理到这里。'
      ],
      experiment: {
        targetBehavior: '睡前反刍时做一次 10 分钟卸载记录。',
        motivation: '减少脑内循环，让大脑知道任务已被接住。',
        ability: '只需要写关键词，不要求完整日记。',
        prompt: '躺下后还在反复想明天、关系或任务时。',
        tinyVersion: '只写 3 个关键词和明天第一步。',
        successCriterion: '完成分类，并写出一个明天第一步。',
        opportunity: '睡前、任务压力高、消息太多的晚上。',
        healthContext: '若长期失眠严重影响生活，应同步考虑睡眠卫生和专业帮助。'
      }
    },
    {
      id: 'body-scan',
      title: '身体扫描',
      subtitle: '从头到脚扫一遍紧绷，让身体参与放松。',
      typeLabel: '放松',
      durationMinutes: 8,
      preparation: '坐着、躺着都可以；不要在驾驶或需要警觉时做。',
      tags: ['身体', '放松', '睡前'],
      steps: [
        '从脚趾开始，依次注意脚、腿、腹部、胸口、肩颈、脸。',
        '每到一个区域，只描述紧、松、热、冷、麻、重。',
        '遇到紧绷处，呼气时让它松 5%。',
        '最后选择一个最需要照顾的部位，给它一个小动作。'
      ],
      experiment: {
        targetBehavior: '睡前或压力后做一轮身体扫描。',
        motivation: '训练识别身体信号，减少只在脑内解决压力。',
        ability: '可以很粗略，每个部位停留一两次呼吸即可。',
        prompt: '肩颈紧、胸口闷、准备睡觉或情绪降不下来时。',
        tinyVersion: '只扫描肩颈和脸。',
        successCriterion: '扫过至少 5 个身体区域，并记录一个变化。',
        opportunity: '睡前、冥想前、长时间坐着后。',
        healthContext: '若出现异常疼痛、呼吸困难或持续身体症状，应优先就医。'
      }
    }
  ]
}
