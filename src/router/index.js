import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { fetchAuthSession } from 'aws-amplify/auth'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Navigation guard for authentication
  Router.beforeEach(async (to, from, next) => {
    // Check if route requires authentication
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (!requiresAuth) {
      next()
      return
    }

    try {
      const session = await fetchAuthSession()
      if (session.tokens) {
        next()
      } else {
        // Not authenticated, redirect to home or show login
        next({ path: '/', query: { redirect: to.fullPath } })
      }
    } catch (error) {
      console.error('Auth check error:', error)
      next({ path: '/', query: { redirect: to.fullPath } })
    }
  })

  return Router
})
