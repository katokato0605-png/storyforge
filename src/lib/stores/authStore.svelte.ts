import { firebaseAuth, googleProvider } from '../firebase'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

let user = $state<User | null>(null)
let loading = $state(true)

onAuthStateChanged(firebaseAuth, (u) => {
  user = u
  loading = false
})

export const authStore = {
  get user()    { return user },
  get loading() { return loading },

  async signIn() {
    await signInWithPopup(firebaseAuth, googleProvider)
  },

  async signOut() {
    await signOut(firebaseAuth)
  },
}
