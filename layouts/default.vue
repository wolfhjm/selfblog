<template>
  <div class="app-shell" :data-device="kind">
    <AppHeader />
    <main class="app-main app-main--workspace">
      <slot />
    </main>
    <BottomNav v-if="user && kind !== 'desktop'" />
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { kind } = useDeviceProfile()
</script>
