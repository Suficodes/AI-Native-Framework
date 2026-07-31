<script setup>
// Your project's landing page. Replace this with whatever your app does.
</script>

<template>
  <div class="page">
    <header class="head">
      <div class="eyebrow">DAK project</div>
      <h1>{{ "ai-native-control-tower" }}</h1>
      <p class="lead">
        A fresh DAK project. Swap this page out; keep the auto-updating
        ones (journey, architecture, vibe code, pm-log) intact.
      </p>
    </header>
  </div>
</template>

<style scoped>
.page { max-width: 760px; }
.eyebrow {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--text-accent);
  margin-bottom: 8px;
}
h1 {
  font-family: var(--font-display);
  font-size: 44px;
  margin: 0 0 16px;
}
.lead { font-size: 15px; line-height: 1.55; opacity: 0.78; }
</style>
