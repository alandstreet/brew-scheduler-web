import axios from 'axios'

// Create axios instance with default config
export const apiClient = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9999',
  baseURL: import.meta.env.VITE_API_URL || 'https://brew.alandstreetlab.uk',
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Import auth functions dynamically to avoid circular dependencies
    const { fetchAuthSession } = await import('aws-amplify/auth')
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error getting auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message)
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)
