<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md" style="max-width: 600px">
      <h4 class="q-mt-none">Protected Dashboard</h4>
      <q-card>
        <q-card-section>
          <div class="text-h6">Welcome!</div>
          <div class="text-subtitle2">You are authenticated</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-if="isLoading">
            <q-spinner size="md" />
            <span class="q-ml-sm">Loading user info...</span>
          </div>
          <div v-else>
            <p><strong>Username:</strong> {{ username || 'N/A' }}</p>
            <p><strong>Email:</strong> {{ userEmail || 'N/A' }}</p>
          </div>
        </q-card-section>

        <q-card-section>
          <q-btn
            color="primary"
            label="Get Access Token"
            @click="showAccessToken"
            class="q-mr-sm"
          />
          <q-btn
            color="secondary"
            label="Get ID Token"
            @click="showIdToken"
          />
        </q-card-section>

        <q-card-section v-if="tokenDisplay">
          <div class="text-caption text-grey-7">Token (truncated):</div>
          <code class="text-caption">{{ tokenDisplay }}</code>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from 'src/composables/useAuth'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const { isLoading, userEmail, username, checkAuthState, getAccessToken, getIdToken } = useAuth()
const tokenDisplay = ref('')

onMounted(async () => {
  await checkAuthState()
})

const showAccessToken = async () => {
  try {
    const token = await getAccessToken()
    if (token) {
      tokenDisplay.value = token.substring(0, 50) + '...'
      $q.notify({
        type: 'positive',
        message: 'Access token retrieved successfully'
      })
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to get access token'
    })
  }
}

const showIdToken = async () => {
  try {
    const token = await getIdToken()
    if (token) {
      tokenDisplay.value = token.substring(0, 50) + '...'
      $q.notify({
        type: 'positive',
        message: 'ID token retrieved successfully'
      })
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to get ID token'
    })
  }
}
</script>
