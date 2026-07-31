import { createApp } from "vue"
import App from "./App.vue"
import router from "./router.js"

// DAK design system. Provides tokens, base, components, utilities,
// and the UAESymbol font for <Aed>.
import "@ds/index.css"

// Project-specific overrides / theme hooks.
import "./styles/app.css"

createApp(App).use(router).mount("#app")
