<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4">Beer Templates</div>
      <q-btn
        color="primary"
        icon="add"
        label="New Template"
        @click="openCreateDialog"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner size="xl" color="primary" />
    </div>

    <!-- Templates Table -->
    <q-table
      v-else
      :rows="templates"
      :columns="columns"
      row-key="beer_template_id"
      :pagination="{ rowsPerPage: 10 }"
      flat
      bordered
    >
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="edit"
            color="primary"
            @click="openEditDialog(props.row)"
          >
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="confirmDelete(props.row)"
          >
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ isEditing ? 'Edit' : 'Create' }} Beer Template</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveTemplate" class="q-gutter-md">
            <q-input
              v-model="form.beer_name"
              label="Beer Name *"
              outlined
              :rules="[val => !!val || 'Beer name is required']"
            />

            <q-input
              v-model.number="form.volume_hl"
              label="Volume (hectoliters) *"
              type="number"
              outlined
              :rules="[
                val => val !== null && val !== '' || 'Volume is required',
                val => val > 0 || 'Volume must be greater than 0'
              ]"
            />

            <q-input
              v-model.number="form.min_fermentation_days"
              label="Min Fermentation Days *"
              type="number"
              outlined
              :rules="[
                val => val !== null && val !== '' || 'Fermentation days is required',
                val => val >= 0 || 'Must be 0 or greater'
              ]"
            />

            <q-input
              v-model.number="form.min_maturation_days"
              label="Min Maturation Days *"
              type="number"
              outlined
              :rules="[
                val => val !== null && val !== '' || 'Maturation days is required',
                val => val >= 0 || 'Must be 0 or greater'
              ]"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn
                flat
                label="Cancel"
                color="primary"
                @click="closeDialog"
              />
              <q-btn
                type="submit"
                label="Save"
                color="primary"
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Delete</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Are you sure you want to delete the template "{{ templateToDelete?.beer_name }}"?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="showDeleteDialog = false" />
          <q-btn
            flat
            label="Delete"
            color="negative"
            :loading="deleting"
            @click="deleteTemplate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { v4 as uuidv4 } from 'uuid'
import { beerTemplatesService } from 'src/services/beerTemplates'

const $q = useQuasar()

// State
const templates = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const templateToDelete = ref(null)

// Form data
const form = ref({
  beer_name: '',
  volume_hl: null,
  min_fermentation_days: null,
  min_maturation_days: null
})

const editingId = ref(null)

// Table columns
const columns = [
  {
    name: 'beer_name',
    label: 'Beer Name',
    field: 'beer_name',
    align: 'left',
    sortable: true
  },
  {
    name: 'volume_hl',
    label: 'Volume (hl)',
    field: 'volume_hl',
    align: 'center',
    sortable: true
  },
  {
    name: 'min_fermentation_days',
    label: 'Fermentation (days)',
    field: 'min_fermentation_days',
    align: 'center',
    sortable: true
  },
  {
    name: 'min_maturation_days',
    label: 'Maturation (days)',
    field: 'min_maturation_days',
    align: 'center',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center'
  }
]

// Methods
const loadTemplates = async () => {
  loading.value = true
  try {
    templates.value = await beerTemplatesService.getAll()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to load beer templates',
      caption: error.response?.data?.message || error.message
    })
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  isEditing.value = false
  editingId.value = null
  form.value = {
    beer_name: '',
    volume_hl: null,
    min_fermentation_days: null,
    min_maturation_days: null
  }
  showDialog.value = true
}

const openEditDialog = (template) => {
  isEditing.value = true
  editingId.value = template.beer_template_id
  form.value = {
    beer_name: template.beer_name,
    volume_hl: template.volume_hl,
    min_fermentation_days: template.min_fermentation_days,
    min_maturation_days: template.min_maturation_days
  }
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  form.value = {
    beer_name: '',
    volume_hl: null,
    min_fermentation_days: null,
    min_maturation_days: null
  }
}

const saveTemplate = async () => {
  saving.value = true
  try {
    if (isEditing.value) {
      await beerTemplatesService.update(editingId.value, form.value)
      $q.notify({
        type: 'positive',
        message: 'Template updated successfully'
      })
    } else {
      // Generate UUID for new template
      const templateData = {
        ...form.value,
        beer_template_id: uuidv4()
      }
      await beerTemplatesService.create(templateData)
      $q.notify({
        type: 'positive',
        message: 'Template created successfully'
      })
    }
    closeDialog()
    await loadTemplates()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Failed to ${isEditing.value ? 'update' : 'create'} template`,
      caption: error.response?.data?.message || error.message
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (template) => {
  templateToDelete.value = template
  showDeleteDialog.value = true
}

const deleteTemplate = async () => {
  deleting.value = true
  try {
    await beerTemplatesService.delete(templateToDelete.value.beer_template_id)
    $q.notify({
      type: 'positive',
      message: 'Template deleted successfully'
    })
    showDeleteDialog.value = false
    await loadTemplates()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to delete template',
      caption: error.response?.data?.message || error.message
    })
  } finally {
    deleting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>
