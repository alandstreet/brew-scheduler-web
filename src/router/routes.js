const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: 'schedule',
        component: () => import('pages/SchedulePage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'templates',
        component: () => import('pages/TemplatesPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'dashboard',
        component: () => import('pages/DashboardPage.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
