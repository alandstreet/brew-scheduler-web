<template>
  <q-page class="q-pa-md">
    <!-- Ingredients Section -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4">Ingredients</div>
      <q-btn
        color="primary"
        icon="add"
        label="New Ingredient"
        @click="openIngredientDialog"
      />
    </div>

    <!-- Ingredients Loading State -->
    <div v-if="loadingIngredients" class="flex flex-center q-pa-xl">
      <q-spinner size="xl" color="primary" />
    </div>

    <!-- Ingredients Table -->
    <q-table
      v-else
      :rows="ingredients"
      :columns="ingredientColumns"
      row-key="ingredient_id"
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
            @click="openEditIngredientDialog(props.row)"
          >
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="confirmDeleteIngredient(props.row)"
          >
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Beer Templates Section -->
    <q-separator class="q-my-lg" />
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

    <!-- Ingredient Create/Edit Dialog -->
    <q-dialog v-model="showIngredientDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ isEditingIngredient ? 'Edit' : 'Create' }} Ingredient</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveIngredient" class="q-gutter-md">
            <q-input
              v-model="ingredientForm.ingredient_name"
              label="Ingredient Name *"
              outlined
              :rules="[val => !!val || 'Ingredient name is required']"
            />

            <q-input
              v-model="ingredientForm.supplier"
              label="Supplier"
              outlined
            />

            <q-select
              v-model="ingredientForm.units"
              :options="ingredientUnitOptions"
              label="Default Units *"
              outlined
              :rules="[val => !!val || 'Units are required']"
            />

            <q-input
              v-model.number="ingredientForm.order_lead_days"
              label="Order Lead Days"
              type="number"
              outlined
              :rules="[val => val === null || val === '' || val >= 0 || 'Must be 0 or greater']"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn
                flat
                label="Cancel"
                color="primary"
                @click="closeIngredientDialog"
              />
              <q-btn
                type="submit"
                label="Save"
                color="primary"
                :loading="savingIngredient"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Ingredient Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteIngredientDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Delete</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Are you sure you want to delete the ingredient "{{ ingredientToDelete?.ingredient_name }}"?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="showDeleteIngredientDialog = false" />
          <q-btn
            flat
            label="Delete"
            color="negative"
            :loading="deletingIngredient"
            @click="deleteIngredient"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
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

            <!-- Ingredients Section -->
            <div class="text-subtitle1 q-mt-md">Ingredients</div>

            <!-- Add Ingredient Row -->
            <div class="row q-gutter-sm items-end">
              <q-select
                v-model="selectedIngredient"
                :options="availableIngredients"
                option-label="ingredient_name"
                option-value="ingredient_id"
                label="Ingredient"
                outlined
                dense
                class="col"
                :disable="ingredients.length === 0"
              />
              <q-input
                v-model.number="ingredientQuantity"
                label="Qty"
                type="number"
                outlined
                dense
                style="width: 80px"
                step="0.1"
                :suffix="selectedIngredient?.units"
              />
              <q-btn
                icon="add"
                color="primary"
                dense
                round
                :disable="!selectedIngredient || !ingredientQuantity"
                @click="addIngredientToTemplate"
              />
            </div>

            <!-- Added Ingredients List -->
            <q-list v-if="form.ingredients.length > 0" bordered separator dense class="rounded-borders">
              <q-item v-for="(ing, index) in form.ingredients" :key="index">
                <q-item-section>
                  <q-item-label>{{ getIngredientName(ing.ingredient_id) }}</q-item-label>
                  <q-item-label caption>{{ ing.quantity }} {{ ing.units }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="removeIngredientFromTemplate(index)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-caption text-grey">No ingredients added</div>

            <div class="row justify-end q-gutter-sm q-mt-md">
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { v4 as uuidv4 } from 'uuid'
import { beerTemplatesService } from 'src/services/beerTemplates'
import { ingredientsService } from 'src/services/ingredients'

const $q = useQuasar()

// State - Templates
const templates = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const templateToDelete = ref(null)

// State - Ingredients
const ingredients = ref([])
const loadingIngredients = ref(false)
const savingIngredient = ref(false)
const deletingIngredient = ref(false)
const showIngredientDialog = ref(false)
const showDeleteIngredientDialog = ref(false)
const isEditingIngredient = ref(false)
const ingredientToDelete = ref(null)
const editingIngredientId = ref(null)

// Form data - Templates
const form = ref({
  beer_name: '',
  volume_hl: null,
  min_fermentation_days: null,
  min_maturation_days: null,
  ingredients: []
})

const editingId = ref(null)

// Template ingredient selection
const selectedIngredient = ref(null)
const ingredientQuantity = ref(null)

// Computed - available ingredients (excludes already added ones)
const availableIngredients = computed(() => {
  const addedIds = form.value.ingredients.map(i => i.ingredient_id)
  return ingredients.value.filter(i => !addedIds.includes(i.ingredient_id))
})

// Helper functions for template ingredients
const getIngredientName = (ingredientId) => {
  const ingredient = ingredients.value.find(i => i.ingredient_id === ingredientId)
  return ingredient?.ingredient_name || 'Unknown'
}

const addIngredientToTemplate = () => {
  if (selectedIngredient.value && ingredientQuantity.value) {
    form.value.ingredients.push({
      ingredient_id: selectedIngredient.value.ingredient_id,
      quantity: ingredientQuantity.value,
      units: selectedIngredient.value.units
    })
    // Reset selection
    selectedIngredient.value = null
    ingredientQuantity.value = null
  }
}

const removeIngredientFromTemplate = (index) => {
  form.value.ingredients.splice(index, 1)
}

const resetIngredientSelection = () => {
  selectedIngredient.value = null
  ingredientQuantity.value = null
}

// Form data - Ingredients
const ingredientForm = ref({
  ingredient_name: '',
  supplier: '',
  units: 'kg',
  order_lead_days: null
})
const ingredientUnitOptions = ['kg', 'g', 'L']

// Table columns - Templates
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

// Table columns - Ingredients
const ingredientColumns = [
  {
    name: 'ingredient_name',
    label: 'Ingredient Name',
    field: 'ingredient_name',
    align: 'left',
    sortable: true
  },
  {
    name: 'supplier',
    label: 'Supplier',
    field: 'supplier',
    align: 'left',
    sortable: true
  },
  {
    name: 'units',
    label: 'Units',
    field: 'units',
    align: 'center',
    sortable: true
  },
  {
    name: 'order_lead_days',
    label: 'Lead Days',
    field: 'order_lead_days',
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

// Methods - Templates
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
    min_maturation_days: null,
    ingredients: []
  }
  resetIngredientSelection()
  showDialog.value = true
}

const openEditDialog = (template) => {
  isEditing.value = true
  editingId.value = template.beer_template_id
  form.value = {
    beer_name: template.beer_name,
    volume_hl: template.volume_hl,
    min_fermentation_days: template.min_fermentation_days,
    min_maturation_days: template.min_maturation_days,
    ingredients: template.ingredients || []
  }
  resetIngredientSelection()
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  form.value = {
    beer_name: '',
    volume_hl: null,
    min_fermentation_days: null,
    min_maturation_days: null,
    ingredients: []
  }
  resetIngredientSelection()
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

// Methods - Ingredients
const loadIngredients = async () => {
  loadingIngredients.value = true
  try {
    ingredients.value = await ingredientsService.getAll()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to load ingredients',
      caption: error.response?.data?.message || error.message
    })
  } finally {
    loadingIngredients.value = false
  }
}

const openIngredientDialog = () => {
  isEditingIngredient.value = false
  editingIngredientId.value = null
  ingredientForm.value = {
    ingredient_name: '',
    supplier: '',
    units: 'kg',
    order_lead_days: null
  }
  showIngredientDialog.value = true
}

const openEditIngredientDialog = (ingredient) => {
  isEditingIngredient.value = true
  editingIngredientId.value = ingredient.ingredient_id
  ingredientForm.value = {
    ingredient_name: ingredient.ingredient_name,
    supplier: ingredient.supplier || '',
    units: ingredient.units || 'kg',
    order_lead_days: ingredient.order_lead_days ?? null
  }
  showIngredientDialog.value = true
}

const closeIngredientDialog = () => {
  showIngredientDialog.value = false
  ingredientForm.value = {
    ingredient_name: '',
    supplier: '',
    units: 'kg',
    order_lead_days: null
  }
}

const saveIngredient = async () => {
  savingIngredient.value = true
  try {
    if (isEditingIngredient.value) {
      await ingredientsService.update(editingIngredientId.value, ingredientForm.value)
      $q.notify({
        type: 'positive',
        message: 'Ingredient updated successfully'
      })
    } else {
      await ingredientsService.create(ingredientForm.value)
      $q.notify({
        type: 'positive',
        message: 'Ingredient created successfully'
      })
    }
    closeIngredientDialog()
    await loadIngredients()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Failed to ${isEditingIngredient.value ? 'update' : 'create'} ingredient`,
      caption: error.response?.data?.message || error.message
    })
  } finally {
    savingIngredient.value = false
  }
}

const confirmDeleteIngredient = (ingredient) => {
  ingredientToDelete.value = ingredient
  showDeleteIngredientDialog.value = true
}

const deleteIngredient = async () => {
  deletingIngredient.value = true
  try {
    await ingredientsService.delete(ingredientToDelete.value.ingredient_id)
    $q.notify({
      type: 'positive',
      message: 'Ingredient deleted successfully'
    })
    showDeleteIngredientDialog.value = false
    await loadIngredients()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to delete ingredient',
      caption: error.response?.data?.message || error.message
    })
  } finally {
    deletingIngredient.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadTemplates()
  loadIngredients()
})
</script>
