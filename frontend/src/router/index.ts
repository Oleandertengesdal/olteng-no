import { createRouter, createWebHistory } from 'vue-router'
import MainSite from '../views/mainsite.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MainSite
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/Projects.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/mainsite.vue') // Placeholder
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/mainsite.vue') // Placeholder
    },
    {
      path: '/projects/json2csv',
      name: 'project-json2csv',
      component: () => import('../views/projects/ProjectJson2CSV.vue')
    },
    {
      path: '/projects/:id',
      name: 'project-details',
      component: () => import('../views/projects/ProjectShowcase.vue')
    }
  ],
})

export default router
