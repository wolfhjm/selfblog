import type { ToolboxCategory } from '~/types/toolbox'
import { motivationCategory, examPressureCategory } from './categories/activation'
import { painEaseCategory } from './categories/body'
import { emotionCoolingCategory } from './categories/emotion'
import { fatigueChargeCategory, sleepRelaxCategory } from './categories/recovery'
import { assessmentCategory, thinkingCategory } from './categories/reflection'

export const toolboxCategories: ToolboxCategory[] = [
  emotionCoolingCategory,
  painEaseCategory,
  fatigueChargeCategory,
  sleepRelaxCategory,
  motivationCategory,
  examPressureCategory,
  assessmentCategory,
  thinkingCategory
]
