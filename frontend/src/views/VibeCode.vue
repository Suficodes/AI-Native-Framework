<script setup>
// /vibe-code — reads public/vibe-stats.json. The DAK leaderboard hook
// writes it after every Claude Code session on this repo. These are
// YOUR stats (the maintainer's), not an aggregate — see CLAUDE.md
// "Auto-Updating Pages".
import { ref, onMounted } from "vue"

const stats = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    const res = await fetch("/vibe-stats.json")
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    stats.value = await res.json()
  } catch (e) {
    error.value = e.message
  }
})
</script>

<template>
  <div class="page">
    <header class="head">
      <div class="eyebrow">Built with Claude Code</div>
      <h1>Vibe code</h1>
      <p class="lead">How much of this project was written with Claude Code, on this machine.</p>
    </header>

    <div v-if="error" class="state error">Couldn't load: {{ error }}</div>
    <div v-else-if="!stats" class="state">Loading vibe…</div>
    <div v-else class="cards">
      <div class="card">
        <div class="value">{{ stats.total_prompts }}</div>
        <div class="label">prompts</div>
      </div>
      <div class="card">
        <div class="value">{{ stats.total_api_calls }}</div>
        <div class="label">api calls</div>
      </div>
      <div class="card">
        <div class="value">{{ stats.total_lines_written }}</div>
        <div class="label">lines edited</div>
      </div>
      <div class="card">
        <div class="value">
          <!-- Use <Aed> from the design system. -->
          <Aed :value="stats.total_cost_usd || 0" :from-usd="true" />
        </div>
        <div class="label">spent</div>
      </div>
    </div>
  </div>
</template>

<script>
import Aed from "@ds/components/Aed.vue"
export default { components: { Aed } }
</script>

<style scoped>
.page { max-width: 760px; }
.head { margin-bottom: 28px; }
.eyebrow {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--text-accent);
}
h1 {
  font-family: var(--font-display);
  font-size: 32px;
  margin: 6px 0 10px;
}
.lead { opacity: 0.78; }
.state { padding: 40px; text-align: center; opacity: 0.7; }
.state.error { color: #c44; }
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.card {
  padding: 20px;
  border: 1px solid var(--border-light);
  border-radius: 10px;
}
.value {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 700;
}
.label {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.65;
  margin-top: 4px;
}
</style>
