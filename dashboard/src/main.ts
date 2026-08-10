import { createApp } from 'vue'

import '@/design/fonts.ts'
import '@/design/base.css'

import App from './App.vue'
import router from './router/index.ts'
import { i18n } from './i18n/index.ts'

// useTheme har bivirkninger ved import: den setter data-theme på <html> med én
// gang. Importeres den først når modusvelgeren tegnes, står siden et øyeblikk
// i standardmodus selv om brukeren har valgt en annen.
import '@/design/useTheme.ts'

createApp(App).use(router).use(i18n).mount('#app')
