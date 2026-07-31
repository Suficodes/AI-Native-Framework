import { createRouter, createWebHistory } from "vue-router"

// Lazy-load every view — Vite splits them into separate chunks.
const routes = [
  { path: "/",             component: () => import("./views/Home.vue") },
  { path: "/journey",      component: () => import("./views/Journey.vue") },
  { path: "/architecture", component: () => import("./views/Architecture.vue") },
  { path: "/vibe-code",    component: () => import("./views/VibeCode.vue") },
  { path: "/pm-log",       component: () => import("./views/PmLog.vue") },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
