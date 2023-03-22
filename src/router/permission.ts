import type { Router } from 'vue-router'
import { useAuthStoreWithout } from '@/store/modules/auth'

export function setupPageGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    // const code = window.location.href
    // 初始化进来的时候authStore.session是null
    const authStore = useAuthStoreWithout()
    console.log('session', authStore.session)
    if (!authStore.session) {
      try {
        const data = await authStore.getSession()
        console.log('data', data)
        if (String(data.auth) === 'false' && authStore.token)
          authStore.removeToken()
        console.log('token1', authStore.token)
        if (String(data.auth) === 'true' && authStore.token === undefined) {
          const token = await authStore.fetchToken('80123045')
          authStore.setToken(token)
          console.log('token2', authStore.token)
        }

        if (to.path === '/500')
          next({ name: 'Root' })

        else
          next()
      }
      catch (error) {
        if (to.path !== '/500')
          next({ name: '500' })
        else
          next()
      }
    }
    else {
      next()
    }
  })
}
