import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

function createAuthStore() {
  let user = $state<User | null>(null)
  let loading = $state(true)

  const unsubscribe = onAuthStateChanged(auth, (u) => {
    user = u
    loading = false
  })

  if (import.meta.hot) {
    import.meta.hot.dispose(() => unsubscribe())
  }

  return {
    get user() { return user },
    get loading() { return loading },
    async signIn() {
      await signInWithPopup(auth, googleProvider)
    },
    async signOut() {
      await signOut(auth)
    },
  }
}

export const authStore = createAuthStore()
