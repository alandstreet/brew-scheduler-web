<template>
  <q-page class="schedule-page">
    <div class="row no-wrap" style="height: 100%">
      <!-- Left Panel (30%) - Beer Template Picker -->
      <div class="col-3 q-pa-md" style="border-right: 1px solid #e0e0e0; overflow-y: auto">
        <div class="text-h5 q-mb-md">Create Beer</div>

        <div v-if="loading" class="flex flex-center q-pa-md">
          <q-spinner color="primary" size="md" />
        </div>

        <div v-else>
          <q-select
            v-model="selectedTemplate"
            :options="beerTemplates"
            option-label="beer_name"
            option-value="beer_template_id"
            label="Select Beer Template"
            outlined
            :disable="beerTemplates.length === 0"
          >
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No templates available
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Template Details Card -->
          <q-card v-if="selectedTemplate" flat bordered class="q-mt-md">
            <q-card-section>
              <div class="text-subtitle2 text-primary">{{ selectedTemplate.beer_name }}</div>
              <q-separator class="q-my-sm" />
              <div class="text-caption">
                <div><strong>Volume:</strong> {{ selectedTemplate.volume_hl }} hl</div>
                <div><strong>Maturation:</strong> {{ selectedTemplate.min_maturation_days }} days</div>
              </div>
              <q-separator class="q-my-sm" />
              <q-input
                ref="batchIdInput"
                v-model="batchId"
                label="Batch ID *"
                outlined
                dense
                class="q-mt-sm"
                :rules="[val => !!val || 'Batch ID is required']"
              />
              <q-input
                ref="minFermentationDaysInput"
                v-model.number="minFermentationDays"
                label="Min Fermentation Days *"
                type="number"
                outlined
                dense
                class="q-mt-sm"
                :rules="[
                  val => val !== null && val !== '' && val !== undefined || 'Min fermentation days is required',
                  val => val >= 0 || 'Must be 0 or greater'
                ]"
              />
              <q-select
                ref="priorityInput"
                v-model="priority"
                :options="[1, 2, 3]"
                label="Priority *"
                outlined
                dense
                class="q-mt-sm"
                :rules="[val => val !== null && val !== undefined || 'Priority is required']"
              />
              <q-input
                ref="targetStartDateInput"
                v-model="targetStartDate"
                label="Target Start Date"
                outlined
                dense
                type="date"
                class="q-mt-sm"
              />
              <q-input
                ref="targetDateInput"
                v-model="targetCompletionDate"
                label="Target Completion Date"
                outlined
                dense
                type="date"
                class="q-mt-sm"
              />
              <q-btn
                color="primary"
                icon="add"
                label="Create Beer"
                class="full-width q-mt-md"
                :disable="!batchId || minFermentationDays === null || priority === null || creating"
                :loading="creating"
                @click="createBeerFromTemplate"
              />
            </q-card-section>
          </q-card>

          <!-- Beers List -->
          <q-separator class="q-my-md" />
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">Batches</div>
            <q-btn
              flat
              dense
              round
              icon="calendar_today"
              size="sm"
              color="primary"
              :loading="scheduling"
              @click="scheduleBeers"
            >
              <q-tooltip>Schedule Beers</q-tooltip>
            </q-btn>
          </div>

          <div v-if="loadingBeers" class="flex flex-center q-pa-md">
            <q-spinner color="primary" size="md" />
          </div>

          <q-list v-else-if="beers.length > 0" bordered separator>
            <q-expansion-item
              v-for="beer in beers"
              :key="beer.beer_id"
              expand-separator
            >
              <template v-slot:header>
                <q-item-section avatar>
                  <div
                    class="color-indicator"
                    :style="{ backgroundColor: getBeerColor(beer.beer_id) }"
                  ></div>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ beer.name }}</q-item-label>
                  <q-item-label caption>{{ beer.batch_id }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="getPriorityColor(beer.priority)">
                    P{{ beer.priority }}
                  </q-badge>
                </q-item-section>
              </template>

              <!-- Expanded content -->
              <q-card flat>
                <q-card-section class="q-pt-none">
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2">Beer Details</div>
                    <q-btn
                      flat
                      dense
                      round
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="confirmDeleteBeer(beer)"
                    >
                      <q-tooltip>Delete Beer</q-tooltip>
                    </q-btn>
                  </div>
                  <div class="beer-details">
                    <div class="detail-row">
                      <span class="detail-label">Batch ID:</span>
                      <span>{{ beer.batch_id }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Volume:</span>
                      <span>{{ beer.volume_hl }} hl</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Priority:</span>
                      <span>{{ beer.priority }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Min Fermentation:</span>
                      <span>{{ beer.min_fermentation_days }} days</span>
                    </div>
                    <div v-if="beer.target_start_date" class="detail-row">
                      <span class="detail-label">Target Start:</span>
                      <span>{{ beer.target_start_date }}</span>
                    </div>
                    <div v-if="beer.target_completion_date" class="detail-row">
                      <span class="detail-label">Target Completion:</span>
                      <span>{{ beer.target_completion_date }}</span>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-list>

          <div v-else class="text-center text-grey-7 q-pa-md">
            No beers scheduled yet
          </div>
        </div>
      </div>

      <!-- Right Panel (70%) - Schedule Table -->
      <div class="col-9 q-pa-md">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h4">Schedule</div>
          <div class="row items-center q-gutter-sm">
            <q-btn
              flat
              dense
              round
              icon="chevron_left"
              @click="prevPeriod"
            />
            <div class="text-h6">{{ scheduleRangeLabel }}</div>
            <q-btn
              flat
              dense
              round
              icon="chevron_right"
              @click="nextPeriod"
            />
            <q-btn
              flat
              label="Today"
              @click="goToToday"
            />
          </div>
        </div>

        <!-- Schedule Table -->
        <div class="schedule-table">
          <!-- Header Row -->
          <div class="schedule-header">Date</div>
          <div class="schedule-header">Brewhouse</div>
          <div class="schedule-header">
            <div>F6</div>
            <div class="volume-label">20hl</div>
          </div>
          <div class="schedule-header">
            <div>F5</div>
            <div class="volume-label">20hl</div>
          </div>
          <div class="schedule-header">
            <div>F4</div>
            <div class="volume-label">20hl</div>
          </div>
          <div class="schedule-header">
            <div>F3</div>
            <div class="volume-label">20hl</div>
          </div>
          <div class="schedule-header">
            <div>F2</div>
            <div class="volume-label">10hl</div>
          </div>
          <div class="schedule-header">
            <div>F1</div>
            <div class="volume-label">10hl</div>
          </div>
          <div class="schedule-header">
            <div>B1</div>
            <div class="volume-label">10hl</div>
          </div>
          <div class="schedule-header">
            <div>B2</div>
            <div class="volume-label">20hl</div>
          </div>
          <!-- Date Rows -->
          <template v-for="day in scheduleDays" :key="day.date">
            <!-- Date Cell -->
            <div
              class="schedule-cell date-cell"
              :class="{
                'today': day.isToday,
                'weekend': day.isWeekend,
                'holiday': day.isHoliday
              }"
            >
              <div class="date-label">{{ day.label }}</div>
            </div>

            <!-- Brewhouse Cell -->
            <div
              class="schedule-cell tank-cell"
              :class="{
                'today': day.isToday,
                'weekend': day.isWeekend,
                'holiday': day.isHoliday,
                'has-task': getScheduledItemsForTank(day.date, 'Brewhouse').length > 0
              }"
              :style="getScheduledItemsForTank(day.date, 'Brewhouse').length > 0 ?
                { backgroundColor: getBeerColor(getScheduledItemsForTank(day.date, 'Brewhouse')[0].beer_id) } : {}"
              @click="getScheduledItemsForTank(day.date, 'Brewhouse').length > 0 ?
                viewScheduleItem(getScheduledItemsForTank(day.date, 'Brewhouse')[0]) : null"
            >
              <!-- Task info overlay -->
              <div
                v-if="getScheduledItemsForTank(day.date, 'Brewhouse').length > 0"
                class="task-info"
              >
                <div class="task-name">{{ getScheduledItemsForTank(day.date, 'Brewhouse')[0].beer_name }}</div>
                <div class="task-type">{{ getScheduledItemsForTank(day.date, 'Brewhouse')[0].task_type }}</div>
              </div>
            </div>

            <!-- Tank Cells -->
            <div
              v-for="tank in tanks"
              :key="`${day.date}-${tank}`"
              class="schedule-cell tank-cell"
              :class="{
                'today': day.isToday,
                'weekend': day.isWeekend,
                'holiday': day.isHoliday,
                'has-task': getScheduledItemsForTank(day.date, tank).length > 0
              }"
              :style="getScheduledItemsForTank(day.date, tank).length > 0 ?
                { backgroundColor: getBeerColor(getScheduledItemsForTank(day.date, tank)[0].beer_id) } : {}"
              @click="getScheduledItemsForTank(day.date, tank).length > 0 ?
                viewScheduleItem(getScheduledItemsForTank(day.date, tank)[0]) : null"
            >
              <!-- Task info overlay -->
              <div
                v-if="getScheduledItemsForTank(day.date, tank).length > 0"
                class="task-info"
              >
                <div class="task-name">{{ getScheduledItemsForTank(day.date, tank)[0].beer_name }}</div>
                <div class="task-type">{{ getScheduledItemsForTank(day.date, tank)[0].task_type }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { v4 as uuidv4 } from 'uuid'
import { beerTemplatesService } from 'src/services/beerTemplates'
import { beersService } from 'src/services/beers'
import { apiClient } from 'src/config/api'

const $q = useQuasar()

// State
const beerTemplates = ref([])
const selectedTemplate = ref(null)
const batchId = ref('')
const minFermentationDays = ref(null)
const priority = ref(null)
const targetStartDate = ref(null)
const targetCompletionDate = ref(null)
const batchIdInput = ref(null)
const minFermentationDaysInput = ref(null)
const priorityInput = ref(null)
const targetStartDateInput = ref(null)
const targetDateInput = ref(null)
const loading = ref(false)
const creating = ref(false)
const loadingBeers = ref(false)
const scheduling = ref(false)
const startDate = ref(new Date())
const beers = ref([]) // All beers from API
const scheduledTasks = ref([]) // Tasks from schedule API

// Tanks
const tanks = ['F6', 'F5', 'F4', 'F3', 'F2', 'F1', 'B1', 'B2']

// Watch for template selection to initialize min fermentation days
watch(selectedTemplate, (newTemplate) => {
  if (newTemplate) {
    minFermentationDays.value = newTemplate.min_fermentation_days
  } else {
    minFermentationDays.value = null
  }
})

// Computed
const scheduleRangeLabel = computed(() => {
  const start = new Date(startDate.value)
  const end = new Date(startDate.value)
  end.setDate(end.getDate() + 29)

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
})

const scheduleDays = computed(() => {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 30; i++) {
    const current = new Date(startDate.value)
    current.setDate(current.getDate() + i)
    current.setHours(0, 0, 0, 0)

    const dateStr = formatDate(current)
    const isToday = current.getTime() === today.getTime()
    const isWeekend = current.getDay() === 0 || current.getDay() === 6 // Sunday or Saturday
    const isHoliday = isAustralianHoliday(current)

    days.push({
      date: dateStr,
      label: current.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      isToday,
      isWeekend,
      isHoliday,
      fullDate: new Date(current)
    })
  }

  return days
})

// Methods
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isAustralianHoliday = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // Fixed date holidays
  if (month === 1 && day === 1) return true // New Year's Day
  if (month === 1 && day === 26) return true // Australia Day
  if (month === 4 && day === 25) return true // Anzac Day
  if (month === 12 && day === 25) return true // Christmas Day
  if (month === 12 && day === 26) return true // Boxing Day

  // Queensland specific - Labour Day (1st Monday in May)
  if (month === 5) {
    const firstMonday = new Date(year, 4, 1)
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1)
    }
    if (day === firstMonday.getDate()) return true
  }

  // Queen's Birthday (2nd Monday in June for QLD)
  if (month === 6) {
    const firstMonday = new Date(year, 5, 1)
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1)
    }
    const secondMonday = new Date(firstMonday)
    secondMonday.setDate(secondMonday.getDate() + 7)
    if (day === secondMonday.getDate()) return true
  }

  // Royal Queensland Show (Ekka) - August (2nd or 3rd Wednesday, varies)
  // Simplified: 3rd Wednesday in August
  if (month === 8) {
    const firstWednesday = new Date(year, 7, 1)
    while (firstWednesday.getDay() !== 3) {
      firstWednesday.setDate(firstWednesday.getDate() + 1)
    }
    const thirdWednesday = new Date(firstWednesday)
    thirdWednesday.setDate(thirdWednesday.getDate() + 14)
    if (day === thirdWednesday.getDate()) return true
  }

  return false
}

const loadBeerTemplates = async () => {
  loading.value = true
  try {
    beerTemplates.value = await beerTemplatesService.getAll()
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

const loadBeers = async () => {
  loadingBeers.value = true
  try {
    beers.value = await beersService.getAll()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to load beers',
      caption: error.response?.data?.message || error.message
    })
  } finally {
    loadingBeers.value = false
  }
}

const createBeerFromTemplate = async () => {
  if (!selectedTemplate.value || !batchId.value || minFermentationDays.value === null || priority.value === null) return

  creating.value = true
  try {
    // Create beer data from template
    const beerData = {
      beer_id: uuidv4(),
      beer_template_id: selectedTemplate.value.beer_template_id,
      name: selectedTemplate.value.beer_name,
      batch_id: batchId.value,
      volume_hl: selectedTemplate.value.volume_hl,
      priority: priority.value,
      min_fermentation_days: minFermentationDays.value,
      target_start_date: targetStartDate.value || null,
      target_completion_date: targetCompletionDate.value || null
    }

    await beersService.create(beerData)

    $q.notify({
      type: 'positive',
      message: 'Beer created successfully',
      caption: `${beerData.name} (${beerData.batch_id})`,
      icon: 'local_drink'
    })

    // Clear fields and hide form
    selectedTemplate.value = null
    batchId.value = ''
    minFermentationDays.value = null
    priority.value = null
    targetStartDate.value = null
    targetCompletionDate.value = null
    batchIdInput.value?.resetValidation()
    minFermentationDaysInput.value?.resetValidation()
    priorityInput.value?.resetValidation()
    targetStartDateInput.value?.resetValidation()
    targetDateInput.value?.resetValidation()

    // Reload beers to update the list and calendar
    await loadBeers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to create beer',
      caption: error.response?.data?.message || error.message
    })
  } finally {
    creating.value = false
  }
}

const getBeerColor = (beerId) => {
  // Generate a consistent color based on beer_id using hash
  let hash = 0
  for (let i = 0; i < beerId.length; i++) {
    hash = beerId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 65%)`
}

const scheduleBeers = async () => {
  scheduling.value = true
  try {
    const response = await apiClient.post('/api/schedule', {
      beers: beers.value
    })

    console.log('Schedule response:', response.data)

    // Store the scheduled tasks
    scheduledTasks.value = response.data.schedule.tasks

    $q.notify({
      type: 'positive',
      message: 'Beers scheduled successfully',
      icon: 'calendar_today'
    })
  } catch (error) {
    console.error('Schedule error:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to schedule beers',
      caption: error.response?.data?.message || error.message
    })
  } finally {
    scheduling.value = false
  }
}

const getScheduledItemsForTank = (date, resource) => {
  // Find tasks that span this date and use this resource
  // Resource can be 'Brewhouse' or tank names like 'F6', 'F5', etc.
  const resourceMatch = resource.toLowerCase()

  return scheduledTasks.value.filter(task => {
    // Match resource (case-insensitive)
    if (task.resource.toLowerCase() !== resourceMatch) return false

    // Check if date falls within task's date range (inclusive)
    const taskStart = new Date(task.start_date)
    const taskEnd = new Date(task.end_date)
    const currentDate = new Date(date)

    // Set all to midnight for accurate comparison
    taskStart.setHours(0, 0, 0, 0)
    taskEnd.setHours(0, 0, 0, 0)
    currentDate.setHours(0, 0, 0, 0)

    return currentDate >= taskStart && currentDate <= taskEnd
  })
}

const viewScheduleItem = (item) => {
  $q.notify({
    type: 'info',
    message: `Viewing ${item.name}`,
    caption: 'Feature coming soon...'
  })
}

const confirmDeleteBeer = (beer) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete ${beer.name} (${beer.batch_id})?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await deleteBeer(beer.beer_id)
  })
}

const deleteBeer = async (beerId) => {
  try {
    await beersService.delete(beerId)

    $q.notify({
      type: 'positive',
      message: 'Beer deleted successfully',
      icon: 'delete'
    })

    // Reload beers to update the list
    await loadBeers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to delete beer',
      caption: error.response?.data?.message || error.message
    })
  }
}

const prevPeriod = () => {
  const newDate = new Date(startDate.value)
  newDate.setDate(newDate.getDate() - 30)
  startDate.value = newDate
}

const nextPeriod = () => {
  const newDate = new Date(startDate.value)
  newDate.setDate(newDate.getDate() + 30)
  startDate.value = newDate
}

const goToToday = () => {
  startDate.value = new Date()
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case 5: return 'red'
    case 4: return 'orange'
    case 3: return 'amber'
    case 2: return 'blue'
    case 1: return 'grey'
    default: return 'grey'
  }
}

// Lifecycle
onMounted(async () => {
  // Load templates and beers in parallel
  await Promise.all([
    loadBeerTemplates(),
    loadBeers()
  ])
})
</script>

<style scoped>
.schedule-page {
  height: 100%;
}

.schedule-table {
  display: grid;
  grid-template-columns: 150px 100px repeat(8, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
  border: 1px solid #e0e0e0;
  overflow-x: auto;
}

.schedule-header {
  background-color: #f5f5f5;
  padding: 8px 6px;
  text-align: center;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.volume-label {
  font-size: 10px;
  font-weight: 400;
  color: #777;
  margin-top: 2px;
}

.schedule-cell {
  background-color: white;
  min-height: 35px;
  padding: 4px 6px;
  transition: background-color 0.2s;
}

.schedule-cell.today {
  background-color: #e3f2fd;
}

.schedule-cell.weekend {
  background-color: #f5f5f5;
}

.schedule-cell.holiday {
  background-color: #e0e0e0;
}

.date-cell {
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: #fafafa;
}

.date-cell.today {
  background-color: #e3f2fd;
}

.date-label {
  font-size: 13px;
}

.tank-cell {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.tank-cell:not(.has-task):hover {
  background-color: #f8f9fa;
}

.tank-cell.has-task {
  cursor: pointer;
}

.tank-cell.has-task:hover {
  opacity: 0.9;
}

.task-info {
  color: white;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  width: 100%;
  padding: 2px;
}

.task-name {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-type {
  font-size: 9px;
  line-height: 1.2;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.color-indicator {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.beer-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.detail-label {
  font-weight: 600;
  color: #555;
}
</style>
