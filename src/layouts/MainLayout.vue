<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          Brew Scheduler
        </q-toolbar-title>

        <q-space />

        <div v-if="isAuthenticated" class="row items-center q-gutter-sm">
          <q-btn
            flat
            dense
            label="Schedule"
            icon="event"
            to="/schedule"
          />
          <q-btn
            flat
            dense
            label="Templates"
            icon="description"
            to="/templates"
          />
          <q-btn
            flat
            dense
            label="Dashboard"
            icon="dashboard"
            to="/dashboard"
          />
        </div>

        <q-space />

        <div v-if="isLoading" class="q-mr-md">
          <q-spinner size="sm" />
        </div>
        <div v-else-if="isAuthenticated" class="row items-center">
          <span class="q-mr-md">{{ userEmail || username }}</span>
          <q-btn
            flat
            dense
            label="Logout"
            icon="logout"
            @click="handleLogout"
          />
        </div>
        <div v-else>
          <q-btn
            flat
            dense
            label="Login"
            icon="login"
            @click="handleLogin"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from 'src/composables/useAuth'

const { isAuthenticated, isLoading, userEmail, username, checkAuthState, login, logout } = useAuth()

onMounted(async () => {
  await checkAuthState()
})

const handleLogin = async () => {
  try {
    await login()
  } catch (error) {
    console.error('Login error:', error)
  }
}

const handleLogout = async () => {
  try {
    await logout()
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>
