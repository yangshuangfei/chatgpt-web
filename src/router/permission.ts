import type { Router } from 'vue-router'
import { useAuthStoreWithout } from '@/store/modules/auth'

export function setupPageGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const code = getUrlParam('code', window.location.href)
    // 初始化进来的时候authStore.session是null
    const authStore = useAuthStoreWithout()
    if (!authStore.session) {
      try {
        const data = await authStore.getSession()
        if (String(data.auth) === 'false' && authStore.token)
          authStore.removeToken()
        if (String(data.auth) === 'true' && authStore.token === undefined) {
          await authStore.fetchToken(code)
            .then((data) => {
              authStore.setToken(data)
            })
        }

        if (to.path === '/500')
          next({ name: 'Root' })

        else
          next()
      }
      catch (error: any) {
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

function getUrlParam(name: string, url: string): any {
  const u = url || window.location.href
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`)
  const r = u.substr(u.indexOf('?') + 1).match(reg)
  return r != null ? decodeURI(r[2]) : ''
}
