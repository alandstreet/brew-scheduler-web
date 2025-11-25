import { ref, computed } from 'vue'
import { fetchAuthSession, signInWithRedirect, signOut, getCurrentUser } from 'aws-amplify/auth'

const currentUser = ref(null)
const isAuthenticated = ref(false)
const isLoading = ref(true)

export function useAuth() {
  const checkAuthState = async () => {
    try {
      isLoading.value = true
      const session = await fetchAuthSession()

      if (session.tokens) {
        const user = await getCurrentUser()
        currentUser.value = user
        isAuthenticated.value = true
      } else {
        currentUser.value = null
        isAuthenticated.value = false
      }
    } catch (error) {
      console.error('Error checking auth state:', error)
      currentUser.value = null
      isAuthenticated.value = false
    } finally {
      isLoading.value = false
    }
  }

  const login = async () => {
    try {
      await signInWithRedirect()
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut()
      currentUser.value = null
      isAuthenticated.value = false
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const getAccessToken = async () => {
    try {
      const session = await fetchAuthSession()
      return session.tokens?.accessToken?.toString()
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }

  const getIdToken = async () => {
    try {
      const session = await fetchAuthSession()
      return session.tokens?.idToken?.toString()
    } catch (error) {
      console.error('Error getting ID token:', error)
      return null
    }
  }

  const userEmail = computed(() => {
    return currentUser.value?.signInDetails?.loginId || null
  })

  const username = computed(() => {
    return currentUser.value?.username || null
  })

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    userEmail,
    username,
    checkAuthState,
    login,
    logout,
    getAccessToken,
    getIdToken
  }
}
