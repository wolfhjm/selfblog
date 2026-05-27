export type DeviceKind = 'mobile' | 'tablet' | 'desktop'

export function useDeviceProfile() {
  const width = useState('device:width', () => 0)

  const update = () => {
    if (import.meta.client) {
      width.value = window.innerWidth
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      update()
      window.addEventListener('resize', update, { passive: true })
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', update)
    })
  }

  const kind = computed<DeviceKind>(() => {
    if (!width.value) return 'desktop'
    if (width.value < 768) return 'mobile'
    if (width.value < 1100) return 'tablet'
    return 'desktop'
  })

  return {
    width,
    kind,
    isMobile: computed(() => kind.value === 'mobile'),
    isTablet: computed(() => kind.value === 'tablet'),
    isDesktop: computed(() => kind.value === 'desktop')
  }
}
