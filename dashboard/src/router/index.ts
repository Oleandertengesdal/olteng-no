import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

/**
 * To ruter. Dashbordet, og løftet om at ingenting forlater nettleseren.
 *
 * Stiene er norske, med engelske alias. Siden er norsk først, men en lenke
 * noen deler skal ikke bli ugyldig fordi mottakeren gjettet på /privacy.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/lenker',
      alias: '/links',
      name: 'links',
      component: () => import('@/views/LinksView.vue'),
    },
    {
      path: '/personvern',
      alias: '/privacy',
      name: 'privacy',
      // Lastes først når noen går dit. Dashbordet er det folk kommer for.
      component: () => import('@/views/PrivacyView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
