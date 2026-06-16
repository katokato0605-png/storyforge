import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

function createAuthStore() {
  let user = $state<User | null>(null)
  let loading = $state(!auth) // Firebase未設定なら即座にloading完了

  let unsubscribe: (() => void) | null = null
  if (auth) {
    unsubscribe = onAuthStateChanged(auth, (u) => {
      user = u
      loading = false
    })
  }

  if (import.meta.hot) {
    import.meta.hot.dispose(() => unsubscribe?.())
  }

  return {
    get user() { return user },
    get loading() { return loading },
    async signIn() {
      if (!auth) return
      await signInWithPopup(auth, googleProvider)
    },
    async signOut() {
      if (!auth) return
      await signOut(auth)
    },
  }
}

export const authStore = createAuthStore()
