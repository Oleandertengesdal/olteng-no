import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainSite from '../views/mainsite.vue'

/**
 * `meta.title` and `meta.description` feed the document head via the
 * afterEach hook below — keep them in sync when adding routes.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: MainSite,
    meta: {
      title: 'Oleander Tengesdal — Dataingeniørstudent, NTNU',
      description:
        'Fullstack-utvikling med Java, Spring Boot, Vue og TypeScript. Prosjekter, kode og hvordan de er bygget.',
    },
  },
  {
    path: '/projects',
    name: 'projects',
    alias: '/prosjekter',
    component: () => import('../views/Projects.vue'),
    meta: {
      title: 'Prosjekter — Oleander Tengesdal',
      description:
        'Utvalgte prosjekter: fullstack-applikasjoner, verktøy og eksperimenter i Java, Spring Boot, Vue og TypeScript.',
    },
  },
  {
    path: '/about',
    name: 'about',
    alias: '/om',
    component: () => import('../views/About.vue'),
    meta: {
      title: 'Om meg — Oleander Tengesdal',
      description: 'Dataingeniørstudent ved NTNU i Trondheim, og hvordan jeg jobber.',
    },
  },
  {
    path: '/cv',
    name: 'resume',
    component: () => import('../views/Resume.vue'),
    meta: {
      title: 'CV — Oleander Tengesdal',
      description: 'Utdanning, erfaring, prosjekter og ferdigheter.',
    },
  },
  {
    path: '/contact',
    name: 'contact',
    alias: '/kontakt',
    component: () => import('../views/Contact.vue'),
    meta: {
      title: 'Kontakt — Oleander Tengesdal',
      description: 'Kontaktinformasjon — e-post, GitHub og LinkedIn.',
    },
  },
  {
    path: '/projects/json2csv',
    name: 'project-json2csv',
    component: () => import('../views/projects/ProjectJson2CSV.vue'),
    meta: { title: 'JSON til CSV — Oleander Tengesdal' },
  },
  {
    path: '/projects/strompris',
    name: 'project-strompris',
    component: () => import('../views/projects/ProjectStrompris.vue'),
    meta: {
      title: 'Strømpris i Norge — Oleander Tengesdal',
      description:
        'Spotpris time for time i alle fem norske prisområder, med graf og sammenligning mot landssnittet.',
    },
  },
  {
    path: '/projects/kontrast',
    name: 'project-kontrast',
    alias: '/projects/contrast',
    component: () => import('../views/projects/ProjectContrast.vue'),
    meta: {
      title: 'Kontrastsjekker — Oleander Tengesdal',
      description:
        'Sjekk kontrastforholdet mellom to farger mot WCAG-kravene, og se hvordan denne sidens egne farger står seg.',
    },
  },
  {
    path: '/projects/:id',
    name: 'project-details',
    component: () => import('../views/projects/ProjectShowcase.vue'),
    meta: { title: 'Prosjekt — Oleander Tengesdal' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFound.vue'),
    meta: { title: 'Siden finnes ikke — Oleander Tengesdal' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) document.title = title

  const description = to.meta.description as string | undefined
  if (description) {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.name = 'description'
      document.head.appendChild(tag)
    }
    tag.content = description
  }
})

export default router
