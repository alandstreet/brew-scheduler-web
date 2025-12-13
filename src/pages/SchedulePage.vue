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
            :disable="!beerTemplates || beerTemplates.length === 0"
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
              <q-input
                ref="minMaturationDaysInput"
                v-model.number="minMaturationDays"
                label="Min Maturation Days *"
                type="number"
                outlined
                dense
                class="q-mt-sm"
                :rules="[
                  val => val !== null && val !== '' && val !== undefined || 'Min maturation days is required',
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
                :disable="!batchId || minFermentationDays === null || minMaturationDays === null || priority === null || creating"
                :loading="creating"
                @click="createBeerFromTemplate"
              />
            </q-card-section>
          </q-card>

          <!-- Canning Days Section -->
          <q-separator class="q-my-md" />
          <div class="text-h6 q-mb-md">Canning Days</div>
          <div class="row q-gutter-sm q-mb-md">
            <q-input
              v-model="newCanningDay"
              type="date"
              label="Add Canning Day"
              outlined
              dense
              class="col"
            />
            <q-btn
              color="primary"
              icon="add"
              :disable="!newCanningDay || addingCanningDay"
              :loading="addingCanningDay"
              @click="addCanningDay"
            >
              <q-tooltip>Add Canning Day</q-tooltip>
            </q-btn>
          </div>
          <div v-if="canningDays.length > 0" class="canning-days-list q-mb-md">
            <q-chip
              v-for="day in canningDays"
              :key="day"
              removable
              color="red"
              text-color="white"
              @remove="removeCanningDay(day)"
            >
              {{ formatCanningDay(day) }}
            </q-chip>
          </div>
          <div v-else class="text-grey-6 text-center q-pa-sm">
            No canning days scheduled
          </div>

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
              :disable="!hasBeersToSchedule"
              @click="scheduleBeers"
            >
              <q-tooltip>{{ hasBeersToSchedule ? 'Schedule Beers' : 'No beers to schedule' }}</q-tooltip>
            </q-btn>
          </div>

          <div v-if="loadingBeers" class="flex flex-center q-pa-md">
            <q-spinner color="primary" size="md" />
          </div>

          <q-list v-else-if="beers.length > 0">
            <q-expansion-item
              v-for="beer in beers"
              :key="beer.beer_id"
              expand-separator
              class="color-indicator"
              :class="{ 'beer-locked': areAllTasksLocked(beer.beer_id) }"
              :style="getBeerCardStyle(beer.beer_id)"
            >
              <template v-slot:header>
                <q-item-section>
                  <q-item-label>{{ beer.name }}</q-item-label>
                  <q-item-label caption>{{ beer.batch_id }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-xs">
                    <q-icon
                      v-if="areAllTasksLocked(beer.beer_id)"
                      name="lock"
                      size="xs"
                      color="grey-7"
                    />
                    <q-badge :color="getPriorityColor(beer.priority)">
                      P{{ beer.priority }}
                    </q-badge>
                  </div>
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
                      <q-input
                        :model-value="beer.volume_hl"
                        type="number"
                        suffix="hl"
                        dense
                        outlined
                        style="max-width: 100px;"
                        :rules="[val => val > 0 || 'Must be greater than 0']"
                        @update:model-value="(val) => updateBeerVolume(beer, val)"
                      />
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Priority:</span>
                      <q-select
                        :model-value="beer.priority"
                        :options="[1, 2, 3]"
                        dense
                        outlined
                        style="max-width: 80px;"
                        @update:model-value="(val) => updateBeerPriority(beer, val)"
                      />
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Min Fermentation:</span>
                      <q-input
                        :model-value="beer.min_fermentation_days"
                        type="number"
                        suffix="days"
                        dense
                        outlined
                        style="max-width: 120px;"
                        :rules="[val => val >= 0 || 'Must be 0 or greater']"
                        @change="(val) => updateBeerMinFermentation(beer, val.target.value)"
                      />
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Target Start:</span>
                      <q-input
                        :model-value="beer.target_start_date || ''"
                        type="date"
                        dense
                        outlined
                        style="max-width: 150px;"
                        @update:model-value="(val) => updateBeerTargetStartDate(beer, val)"
                      />
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Target Completion:</span>
                      <q-input
                        :model-value="beer.target_completion_date || ''"
                        type="date"
                        dense
                        outlined
                        style="max-width: 150px;"
                        @update:model-value="(val) => updateBeerTargetCompletionDate(beer, val)"
                      />
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Requires Canning:</span>
                      <q-checkbox
                        :model-value="beer.requires_canning || false"
                        dense
                        @update:model-value="(val) => updateBeerRequiresCanning(beer, val)"
                      />
                    </div>
                  </div>

                  <!-- Scheduled Tasks -->
                  <div v-if="getTasksForBeer(beer.beer_id).length > 0" class="q-mt-md">
                    <div class="row items-center justify-between q-mb-sm">
                      <div class="text-subtitle2">Scheduled Tasks</div>
                      <q-toggle
                        :model-value="areAllTasksLocked(beer.beer_id)"
                        label="Pin All"
                        dense
                        size="sm"
                        @update:model-value="(val) => onPinAllTasks(beer, val)"
                      />
                    </div>
                    <div
                      v-for="task in getTasksForBeer(beer.beer_id)"
                      :key="`${beer.beer_id}-${task.task_type}`"
                      class="task-row"
                    >
                      <span class="task-type-label">{{ task.task_type }}</span>
                      <q-icon
                        v-if="task.locked"
                        name="push_pin"
                        size="xs"
                        color="primary"
                      />
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
        <div class="schedule-table-container">
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
              :class="getCellClasses(day, 'Brewhouse')"
              :style="getTaskCellStyle(day, 'Brewhouse')"
              @click="getScheduledItemsForTank(day.date, 'Brewhouse').length > 0 ?
                handleTaskClick($event, getScheduledItemsForTank(day.date, 'Brewhouse')[0]) : null"
            >
              <!-- Task info overlay - only show on middle day -->
              <div
                v-if="getScheduledItemsForTank(day.date, 'Brewhouse').length > 0 && shouldShowLabel(day.date, getScheduledItemsForTank(day.date, 'Brewhouse')[0])"
                class="task-info"
              >
                <div class="task-name">{{ getScheduledItemsForTank(day.date, 'Brewhouse')[0].beer_name }} <span v-if="getScheduledItemsForTank(day.date, 'Brewhouse')[0].batch_id" class="batch-id"> {{ getScheduledItemsForTank(day.date, 'Brewhouse')[0].batch_id }}</span></div>
                <div class="task-type">{{ getScheduledItemsForTank(day.date, 'Brewhouse')[0].task_type }}</div>
              </div>
            </div>

            <!-- Tank Cells -->
            <div
              v-for="tank in tanks"
              :key="`${day.date}-${tank}`"
              class="schedule-cell tank-cell"
              :class="getCellClasses(day, tank)"
              :style="getTaskCellStyle(day, tank)"
              @click="getScheduledItemsForTank(day.date, tank).length > 0 ?
                handleTaskClick($event, getScheduledItemsForTank(day.date, tank)[0]) : null"
            >
              <!-- Task info overlay - only show on middle day -->
              <div
                v-if="getScheduledItemsForTank(day.date, tank).length > 0 && shouldShowLabel(day.date, getScheduledItemsForTank(day.date, tank)[0])"
                class="task-info"
              >
                <div class="task-name">{{ getScheduledItemsForTank(day.date, tank)[0].beer_name }} <span v-if="getScheduledItemsForTank(day.date, tank)[0].batch_id" class="batch-id"> {{ getScheduledItemsForTank(day.date, tank)[0].batch_id }}</span></div>
                <div class="task-type">{{ getScheduledItemsForTank(day.date, tank)[0].task_type }}</div>
              </div>
            </div>
          </template>
        </div>
        <!-- Canning day row overlays -->
        <div
          v-for="(day, index) in scheduleDays"
          v-show="isCanningDay(day.date)"
          :key="'canning-' + day.date"
          class="canning-day-overlay"
          :style="{ top: `calc(${index} * 36.38px + 57px)` }"
        ></div>
        </div>
      </div>
    </div>

    <!-- Scheduling Error Dialog -->
    <q-dialog v-model="showScheduleErrorDialog" persistent>
      <q-card style="min-width: 500px; max-width: 700px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-negative">
            <q-icon name="error" class="q-mr-sm" />
            Scheduling Failed
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="scheduleErrorData">
          <div class="text-subtitle1 q-mb-md">{{ scheduleErrorData.message }}</div>

          <!-- Top-level warnings -->
          <div v-if="scheduleErrorData.diagnostic?.warnings?.length > 0" class="q-mb-md">
            <div class="text-weight-medium q-mb-sm">
              <q-icon name="warning" color="warning" class="q-mr-xs" />
              Warnings
            </div>
            <q-list dense bordered separator class="rounded-borders">
              <q-item v-for="(warning, idx) in scheduleErrorData.diagnostic.warnings" :key="idx">
                <q-item-section>
                  <q-item-label class="text-body2">{{ warning }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Canning info -->
          <div v-if="scheduleErrorData.diagnostic?.canning" class="q-mb-md">
            <div class="text-weight-medium q-mb-sm">
              <q-icon name="inventory_2" color="primary" class="q-mr-xs" />
              Canning Constraints
            </div>
            <div class="text-body2 q-ml-md">
              <div><strong>Available canning days:</strong> {{ formatCanningDaysList(scheduleErrorData.diagnostic.canning.available_days) }}</div>
              <div><strong>Beers requiring canning:</strong> {{ scheduleErrorData.diagnostic.canning.beers_requiring_canning }}</div>
            </div>
          </div>

          <!-- Beer diagnostics -->
          <div v-if="scheduleErrorData.diagnostic?.beer_diagnostics?.length > 0">
            <div class="text-weight-medium q-mb-sm">
              <q-icon name="sports_bar" color="amber" class="q-mr-xs" />
              Beer Details
            </div>
            <q-expansion-item
              v-for="beer in scheduleErrorData.diagnostic.beer_diagnostics"
              :key="beer.id"
              dense
              expand-separator
              :header-class="beer.warnings?.length > 0 ? 'text-negative' : ''"
            >
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon
                    :name="beer.warnings?.length > 0 ? 'error' : 'check_circle'"
                    :color="beer.warnings?.length > 0 ? 'negative' : 'positive'"
                    size="sm"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ beer.name }}</q-item-label>
                  <q-item-label caption>{{ beer.volume_hl }} hl</q-item-label>
                </q-item-section>
                <q-item-section side v-if="beer.warnings?.length > 0">
                  <q-badge color="negative">{{ beer.warnings.length }} warning(s)</q-badge>
                </q-item-section>
              </template>

              <q-card flat>
                <q-card-section class="q-pt-none">
                  <!-- Beer warnings -->
                  <div v-if="beer.warnings?.length > 0" class="q-mb-sm">
                    <div v-for="(warning, idx) in beer.warnings" :key="idx" class="text-negative text-body2 q-mb-xs">
                      <q-icon name="warning" size="xs" class="q-mr-xs" />
                      {{ warning }}
                    </div>
                  </div>

                  <!-- Beer details -->
                  <div class="beer-diagnostic-details">
                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <span class="text-grey-7">Brew days:</span> {{ beer.brew_days }}
                      </div>
                      <div class="col-6">
                        <span class="text-grey-7">Min fermentation:</span> {{ beer.min_fermentation_days }} days
                      </div>
                      <div class="col-6">
                        <span class="text-grey-7">Min maturation:</span> {{ beer.min_maturation_days }} days
                      </div>
                      <div class="col-6">
                        <span class="text-grey-7">Min to completion:</span> {{ beer.min_days_to_completion }} days
                      </div>
                      <div class="col-6">
                        <span class="text-grey-7">Requires canning:</span> {{ beer.requires_canning ? 'Yes' : 'No' }}
                      </div>
                      <div class="col-6" v-if="beer.target_completion_day !== null">
                        <span class="text-grey-7">Target completion:</span> Day {{ beer.target_completion_day }}
                      </div>
                      <div class="col-6" v-if="beer.earliest_feasible_canning_day !== null">
                        <span class="text-grey-7">Earliest canning:</span> Day {{ beer.earliest_feasible_canning_day }}
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>

          <!-- Solver status -->
          <div class="q-mt-md text-caption text-grey-7">
            Solver status: {{ scheduleErrorData.diagnostic?.solver_status }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { beerTemplatesService } from 'src/services/beerTemplates'
import { beersService } from 'src/services/beers'
import { canningDaysService } from 'src/services/canningDays'
import { tasksService } from 'src/services/tasks'
import { apiClient } from 'src/config/api'

const $q = useQuasar()

// State
const beerTemplates = ref([])
const selectedTemplate = ref(null)
const batchId = ref('')
const minFermentationDays = ref(null)
const minMaturationDays = ref(null)
const priority = ref(2)
const targetStartDate = ref(null)
const targetCompletionDate = ref(null)
const batchIdInput = ref(null)
const minFermentationDaysInput = ref(null)
const minMaturationDaysInput = ref(null)
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
const canningDays = ref([]) // Canning days from API
const newCanningDay = ref(null) // Input for adding new canning day
const addingCanningDay = ref(false) // Loading state for adding canning day
const showScheduleErrorDialog = ref(false) // Show scheduling error dialog
const scheduleErrorData = ref(null) // Scheduling error diagnostic data

// Tanks
const tanks = ['F6', 'F5', 'F4', 'F3', 'F2', 'F1', 'B1', 'B2']

// Watch for template selection to initialize min fermentation and maturation days
watch(selectedTemplate, (newTemplate) => {
  if (newTemplate) {
    minFermentationDays.value = newTemplate.min_fermentation_days
    minMaturationDays.value = newTemplate.min_maturation_days
  } else {
    minFermentationDays.value = null
    minMaturationDays.value = null
  }
})

// Computed
const hasBeersToSchedule = computed(() => {
  if (beers.value.length === 0) return false
  // Check if there's at least one beer without all tasks locked
  return beers.value.some(beer => {
    const tasks = beer.tasks || []
    if (tasks.length === 0) return true // No tasks means it needs scheduling
    return !tasks.every(task => task.locked) // Has at least one unlocked task
  })
})

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
    const loadedBeers = await beersService.getAll()
    beers.value = loadedBeers

    // Extract tasks from all beers into scheduledTasks
    const allTasks = []
    for (const beer of loadedBeers) {
      if (beer.tasks && Array.isArray(beer.tasks)) {
        allTasks.push(...beer.tasks)
      }
    }
    scheduledTasks.value = allTasks
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
  if (!selectedTemplate.value || !batchId.value || minFermentationDays.value === null || minMaturationDays.value === null || priority.value === null) return

  creating.value = true
  try {
    // Create beer data from template (beer_id generated server-side)
    const beerData = {
      beer_template_id: selectedTemplate.value.beer_template_id,
      name: selectedTemplate.value.beer_name,
      batch_id: batchId.value,
      volume_hl: selectedTemplate.value.volume_hl,
      priority: priority.value,
      min_fermentation_days: minFermentationDays.value,
      min_maturation_days: minMaturationDays.value,
      target_start_date: targetStartDate.value || null,
      target_completion_date: targetCompletionDate.value || null
    }

    await beersService.create(beerData)

    $q.notify({
      type: 'positive',
      message: 'Beer created successfully',
      caption: `${beerData.name} ${beerData.batch_id}`,
      icon: 'local_drink'
    })

    // Clear fields and hide form
    selectedTemplate.value = null
    batchId.value = ''
    minFermentationDays.value = null
    minMaturationDays.value = null
    priority.value = 2
    targetStartDate.value = null
    targetCompletionDate.value = null
    batchIdInput.value?.resetValidation()
    minFermentationDaysInput.value?.resetValidation()
    minMaturationDaysInput.value?.resetValidation()
    priorityInput.value?.resetValidation()
    targetStartDateInput.value?.resetValidation()
    targetDateInput.value?.resetValidation()

    // Reload beers to update the list and calendar, then schedule
    await loadBeers()
    await scheduleBeers()
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

// High-contrast color palette for distinguishing beer batches (RGB values)
const beerColorPaletteRGB = [
  [229, 57, 53],    // Red
  [30, 136, 229],   // Blue
  [67, 160, 71],    // Green
  [251, 140, 0],    // Orange
  [142, 36, 170],   // Purple
  [0, 172, 193],    // Cyan
  [255, 179, 0],    // Amber
  [109, 76, 65],    // Brown
  [216, 27, 96],    // Pink
  [57, 73, 171],    // Indigo
  [0, 137, 123],    // Teal
  [124, 179, 66],   // Light Green
  [244, 81, 30],    // Deep Orange
  [94, 53, 177],    // Deep Purple
  [3, 155, 229],    // Light Blue
  [192, 202, 51]    // Lime
]

// Map to store consistent beer-to-color index assignments
const beerColorMap = new Map()

const getBeerColor = (beerId, locked = false) => {
  if (!beerColorMap.has(beerId)) {
    // Assign next available color index from palette
    const colorIndex = beerColorMap.size % beerColorPaletteRGB.length
    beerColorMap.set(beerId, colorIndex)
  }
  const colorIndex = beerColorMap.get(beerId)
  const [r, g, b] = beerColorPaletteRGB[colorIndex]
  const opacity = locked ? 0.4 : 0.2
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Get solid border color for a beer (100% opacity)
const getBeerBorderColor = (beerId) => {
  if (!beerColorMap.has(beerId)) {
    const colorIndex = beerColorMap.size % beerColorPaletteRGB.length
    beerColorMap.set(beerId, colorIndex)
  }
  const colorIndex = beerColorMap.get(beerId)
  const [r, g, b] = beerColorPaletteRGB[colorIndex]
  return `rgb(${r}, ${g}, ${b})`
}

// Get style object for beer card (left panel)
const getBeerCardStyle = (beerId) => {
  const isLocked = areAllTasksLocked(beerId)
  const style = {
    backgroundColor: getBeerColor(beerId, isLocked)
  }
  if (isLocked) {
    style.border = `2px solid ${getBeerBorderColor(beerId)}`
  }
  return style
}

// Get style object for a task cell in the schedule grid
const getTaskCellStyle = (day, resource) => {
  const items = getScheduledItemsForTank(day.date, resource)
  if (items.length === 0) return {}

  const task = items[0]
  const style = {
    backgroundColor: getBeerColor(task.beer_id, task.locked)
  }

  if (task.locked) {
    const position = getTaskPosition(day.date, task)
    const borderColor = getBeerBorderColor(task.beer_id)

    // Apply borders based on position in the task block
    if (position.isSingle) {
      style.border = `2px solid ${borderColor}`
    } else {
      style.borderLeft = `2px solid ${borderColor}`
      style.borderRight = `2px solid ${borderColor}`
      if (position.isFirst) {
        style.borderTop = `2px solid ${borderColor}`
      }
      if (position.isLast) {
        style.borderBottom = `2px solid ${borderColor}`
      }
    }
  }

  return style
}

// Generate Brisbane/Queensland public holidays for a given year range
const getBrisbanePublicHolidays = (startYear, endYear) => {
  const holidays = []

  for (let year = startYear; year <= endYear; year++) {
    // Fixed date holidays
    holidays.push(`${year}-01-01`) // New Year's Day
    holidays.push(`${year}-01-26`) // Australia Day
    holidays.push(`${year}-04-25`) // Anzac Day
    holidays.push(`${year}-12-25`) // Christmas Day
    holidays.push(`${year}-12-26`) // Boxing Day

    // Easter (calculate using anonymous Gregorian algorithm)
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1

    const easterSunday = new Date(year, month - 1, day)
    const goodFriday = new Date(easterSunday)
    goodFriday.setDate(easterSunday.getDate() - 2)
    const easterSaturday = new Date(easterSunday)
    easterSaturday.setDate(easterSunday.getDate() - 1)
    const easterMonday = new Date(easterSunday)
    easterMonday.setDate(easterSunday.getDate() + 1)

    holidays.push(formatDate(goodFriday))
    holidays.push(formatDate(easterSaturday))
    holidays.push(formatDate(easterMonday))

    // Queensland Labour Day (1st Monday in May)
    const mayFirst = new Date(year, 4, 1)
    const labourDay = new Date(mayFirst)
    while (labourDay.getDay() !== 1) {
      labourDay.setDate(labourDay.getDate() + 1)
    }
    holidays.push(formatDate(labourDay))

    // Queen's/King's Birthday (2nd Monday in October for QLD from 2012)
    const octFirst = new Date(year, 9, 1)
    const firstMondayOct = new Date(octFirst)
    while (firstMondayOct.getDay() !== 1) {
      firstMondayOct.setDate(firstMondayOct.getDate() + 1)
    }
    const royalBirthday = new Date(firstMondayOct)
    royalBirthday.setDate(firstMondayOct.getDate() + 7)
    holidays.push(formatDate(royalBirthday))

    // Royal Queensland Show (Ekka) - Brisbane only
    // People's Day: Wednesday in the week containing 10th-16th August
    const aug10 = new Date(year, 7, 10)
    const ekkaWednesday = new Date(aug10)
    // Find the Wednesday in the week containing Aug 10-16
    const dayOfWeek = aug10.getDay()
    const daysToWednesday = (3 - dayOfWeek + 7) % 7
    ekkaWednesday.setDate(aug10.getDate() + daysToWednesday)
    // Ensure it's in the 10-16 range
    if (ekkaWednesday.getDate() >= 10 && ekkaWednesday.getDate() <= 16) {
      holidays.push(formatDate(ekkaWednesday))
    }
  }

  return holidays
}

const scheduleBeers = async () => {
  // Skip if no beers to schedule
  if (!hasBeersToSchedule.value) return

  scheduling.value = true
  try {
    // Today is day 0 for the scheduler
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Helper to calculate day offset from tomorrow
    const getDayOffset = (dateStr) => {
      const date = new Date(dateStr)
      date.setHours(0, 0, 0, 0)
      const diffTime = date.getTime() - today.getTime()
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }

    // Helper to calculate target day from date
    const getTargetDay = (targetDate) => {
      if (!targetDate) return null
      return getDayOffset(targetDate)
    }

    // Separate beers: those with locked tasks vs those without
    const beersWithLockedTasks = []
    const beersToSchedule = []
    const resourceBlocks = []

    for (const beer of beers.value) {
      const lockedTasks = (beer.tasks || []).filter(task => task.locked)

      if (lockedTasks.length > 0) {
        // This beer has locked tasks - withhold it and convert tasks to resource_blocks
        beersWithLockedTasks.push(beer)
        for (const task of lockedTasks) {
          resourceBlocks.push({
            resource: task.resource,
            start_day: task.start_day,
            end_day: task.end_day
          })
        }
      } else {
        // This beer has no locked tasks - include it for scheduling
        beersToSchedule.push({
          id: beer.beer_id,
          name: beer.name,
          volume_hl: beer.volume_hl,
          priority: beer.priority,
          min_fermentation_days: beer.min_fermentation_days,
          min_maturation_days: beer.min_maturation_days || 0,
          requires_canning: beer.requires_canning || false,
          target_start_day: getTargetDay(beer.target_start_date),
          target_completion_day: getTargetDay(beer.target_completion_date),
          tasks: []
        })
      }
    }

    // Get Brisbane public holidays for the next 2 years
    const currentYear = new Date().getFullYear()
    const nonWorkingDays = getBrisbanePublicHolidays(currentYear, currentYear + 1)

    // Build request payload
    const payload = {
      beers: beersToSchedule,
      canning_days: canningDays.value,
      non_working_days: nonWorkingDays
    }

    // Only include resource_blocks if there are any
    if (resourceBlocks.length > 0) {
      payload.resource_blocks = resourceBlocks
    }

    const response = await apiClient.post('/api/schedule', payload)

    // Helper to convert day offset to date string
    const dayToDate = (dayOffset) => {
      const date = new Date(today)
      date.setDate(date.getDate() + dayOffset)
      return formatDate(date)
    }

    // Extract tasks from the schedule response
    const scheduledBeers = response.data.beers || []
    const allTasks = []

    // Add tasks from newly scheduled beers
    for (const beer of scheduledBeers) {
      if (beer.tasks && Array.isArray(beer.tasks)) {
        for (const task of beer.tasks) {
          allTasks.push({
            ...task,
            beer_id: beer.id,
            beer_name: beer.name,
            batch_id: beer.batch_id,
            start_date: dayToDate(task.start_day),
            // end_day is exclusive in the scheduler (end - start = duration)
            // so subtract 1 to get the inclusive end date for display
            end_date: dayToDate(task.end_day - 1)
          })
        }
      }
    }

    // Preserve locked tasks from beers that were withheld
    for (const beer of beersWithLockedTasks) {
      const lockedTasks = (beer.tasks || []).filter(task => task.locked)
      for (const task of lockedTasks) {
        allTasks.push({
          ...task,
          beer_id: beer.beer_id,
          beer_name: beer.name,
          batch_id: beer.batch_id
        })
      }
    }

    scheduledTasks.value = allTasks

    $q.notify({
      type: 'positive',
      message: 'Beers scheduled successfully',
      icon: 'calendar_today'
    })
  } catch (error) {
    console.error('Schedule error:', error)

    // Check if this is a scheduling error with diagnostic data
    const errorData = error.response?.data
    if (errorData?.error === 'SCHEDULING_ERROR' && errorData?.diagnostic) {
      scheduleErrorData.value = errorData
      showScheduleErrorDialog.value = true
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to schedule beers',
        caption: errorData?.message || error.message
      })
    }
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

// Get task position info for a given date (first, middle, last, or single day)
const getTaskPosition = (date, task) => {
  const taskStart = new Date(task.start_date)
  const taskEnd = new Date(task.end_date)
  const currentDate = new Date(date)

  taskStart.setHours(0, 0, 0, 0)
  taskEnd.setHours(0, 0, 0, 0)
  currentDate.setHours(0, 0, 0, 0)

  const isFirst = currentDate.getTime() === taskStart.getTime()
  const isLast = currentDate.getTime() === taskEnd.getTime()

  // Calculate middle day for label placement
  const totalDays = Math.round((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) + 1
  const middleDayOffset = Math.floor(totalDays / 2)
  const middleDate = new Date(taskStart)
  middleDate.setDate(middleDate.getDate() + middleDayOffset)
  const isMiddle = currentDate.getTime() === middleDate.getTime()

  return { isFirst, isLast, isMiddle, isSingle: isFirst && isLast }
}

// Check if label should be shown for this date/task combination
const shouldShowLabel = (date, task) => {
  const position = getTaskPosition(date, task)
  return position.isMiddle || position.isSingle
}

// Get tasks for a specific beer
const getTasksForBeer = (beerId) => {
  return scheduledTasks.value.filter(task => task.beer_id === beerId)
}

// Check if all tasks for a beer are locked
const areAllTasksLocked = (beerId) => {
  const tasks = getTasksForBeer(beerId)
  if (tasks.length === 0) return false
  return tasks.every(task => task.locked)
}

// Handle pin/unpin all tasks for a beer
const onPinAllTasks = async (beer, pinned) => {
  const tasks = getTasksForBeer(beer.beer_id)
  if (tasks.length === 0) return

  try {
    if (pinned) {
      // Pin all unlocked tasks
      for (const task of tasks) {
        if (!task.locked) {
          const createdTask = await tasksService.create({
            beer_id: beer.beer_id,
            beer_name: beer.name,
            task_type: task.task_type,
            start_day: task.start_day,
            start_date: task.start_date,
            duration: task.duration,
            end_day: task.end_day,
            end_date: task.end_date,
            resource: task.resource,
            volume_hl: beer.volume_hl
          })

          // Update the task in scheduledTasks with the new task_id and locked status
          const taskIndex = scheduledTasks.value.findIndex(
            t => t.beer_id === beer.beer_id && t.task_type === task.task_type
          )
          if (taskIndex !== -1) {
            scheduledTasks.value[taskIndex] = {
              ...scheduledTasks.value[taskIndex],
              task_id: createdTask.task_id,
              locked: true
            }
          }
        }
      }

      $q.notify({
        type: 'positive',
        message: 'All tasks pinned',
        caption: beer.name,
        icon: 'push_pin'
      })
    } else {
      // Unpin all locked tasks
      for (const task of tasks) {
        if (task.locked && task.task_id) {
          await tasksService.delete(task.task_id)

          // Update the task in scheduledTasks
          const taskIndex = scheduledTasks.value.findIndex(
            t => t.beer_id === beer.beer_id && t.task_type === task.task_type
          )
          if (taskIndex !== -1) {
            scheduledTasks.value[taskIndex] = {
              ...scheduledTasks.value[taskIndex],
              task_id: null,
              locked: false
            }
          }
        }
      }

      $q.notify({
        type: 'positive',
        message: 'All tasks unpinned',
        caption: beer.name,
        icon: 'push_pin'
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: pinned ? 'Failed to pin tasks' : 'Failed to unpin tasks',
      caption: error.response?.data?.message || error.message
    })
  }
}

// Get CSS classes for a cell based on day and task position
const getCellClasses = (day, resource) => {
  const tasks = getScheduledItemsForTank(day.date, resource)
  const hasTask = tasks.length > 0

  const classes = {
    'today': day.isToday,
    'weekend': day.isWeekend,
    'holiday': day.isHoliday,
    'has-task': hasTask
  }

  if (hasTask) {
    const position = getTaskPosition(day.date, tasks[0])
    classes['task-first'] = position.isFirst && !position.isSingle
    classes['task-last'] = position.isLast && !position.isSingle
    classes['task-middle'] = !position.isFirst && !position.isLast
    classes['task-single'] = position.isSingle
  }

  return classes
}

const viewScheduleItem = (item) => {
  $q.notify({
    type: 'info',
    message: `Viewing ${item.name}`,
    caption: 'Feature coming soon...'
  })
}

const handleTaskClick = async (event, task) => {
  if (!task) return

  // Check if task is locked and modifier key is pressed
  if (task.locked && task.task_id && (event.metaKey || event.ctrlKey)) {
    // Determine direction: left click increases, right click would decrease
    // Since we only have click, use shift to decrease
    const amountDays = event.shiftKey ? -1 : 1

    try {
      await tasksService.adjustDuration(task.task_id, amountDays)

      $q.notify({
        type: 'positive',
        message: `Task duration ${amountDays > 0 ? 'increased' : 'decreased'} by 1 day`,
        icon: 'schedule'
      })

      // Reload beers to get updated tasks and re-run scheduler
      await loadBeers()
      await scheduleBeers()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Failed to adjust task duration',
        caption: error.response?.data?.message || error.message
      })
    }
  } else {
    // Normal click - view schedule item
    viewScheduleItem(task)
  }
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

    // Reload beers to update the list, then schedule
    await loadBeers()
    await scheduleBeers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to delete beer',
      caption: error.response?.data?.message || error.message
    })
  }
}

const updateBeerVolume = async (beer, newVolume) => {
  try {
    const volume = Number(newVolume)

    if (isNaN(volume) || volume <= 0) {
      $q.notify({
        type: 'negative',
        message: 'Invalid volume',
        caption: 'Must be greater than 0'
      })
      return
    }

    const updatedBeer = {
      ...beer,
      volume_hl: volume
    }

    await beersService.update(beer.beer_id, updatedBeer)

    $q.notify({
      type: 'positive',
      message: 'Volume updated successfully',
      icon: 'check'
    })

    await loadBeers()
    await scheduleBeers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update volume',
      caption: error.response?.data?.message || error.message
    })
  }
}

const updateBeerPriority = async (beer, newPriority) => {
  try {
    const updatedBeer = {
      ...beer,
      priority: newPriority
    }

    await beersService.update(beer.beer_id, updatedBeer)

    $q.notify({
      type: 'positive',
      message: 'Priority updated successfully',
      icon: 'check'
    })

    // Reload beers to update the list, then schedule
    await loadBeers()
    await scheduleBeers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update priority',
      caption: error.response?.data?.message || error.message
    })
  }
}

const updateBeerMinFermentation = async (beer, newMinFermentationDays) => {
  try {
    const minFermentationDays = Number(newMinFermentationDays)

    if (isNaN(minFermentationDays) || minFermentationDays < 0) {
      $q.notify({
        type: 'negative',
        message: 'Invalid fermentation days',
        caption: 'Must be 0 or greater'
      })
      return
    }

    const updatedBeer = {
      ...beer,
      min_fermentation_days: minFermentationDays
    }

    await beersService.update(beer.beer_id, updatedBeer)

    $q.notify({
      type: 'positive',
      message: 'Min fermentation days updated successfully',
      icon: 'check'
    })

    // Reload beers to update the list, then schedule
    await loadBeers()
    await scheduleBeers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update min fermentation days',
      caption: error.response?.data?.message || error.message
    })
  }
}

const updateBeerTargetStartDate = async (beer, newDate) => {
  try {
    const updatedBeer = {
      ...beer,
      target_start_date: newDate || null
    }

    await beersService.update(beer.beer_id, updatedBeer)

    $q.notify({
      type: 'positive',
      message: 'Target start date updated successfully',
      icon: 'check'
    })

    await loadBeers()
    await scheduleBeers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update target start date',
      caption: error.response?.data?.message || error.message
    })
  }
}

const updateBeerTargetCompletionDate = async (beer, newDate) => {
  try {
    const updatedBeer = {
      ...beer,
      target_completion_date: newDate || null
    }

    await beersService.update(beer.beer_id, updatedBeer)

    $q.notify({
      type: 'positive',
      message: 'Target completion date updated successfully',
      icon: 'check'
    })

    await loadBeers()
    await scheduleBeers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update target completion date',
      caption: error.response?.data?.message || error.message
    })
  }
}

const updateBeerRequiresCanning = async (beer, requiresCanning) => {
  try {
    const updatedBeer = {
      ...beer,
      requires_canning: requiresCanning
    }

    await beersService.update(beer.beer_id, updatedBeer)

    $q.notify({
      type: 'positive',
      message: 'Requires canning updated successfully',
      icon: 'check'
    })

    await loadBeers()
    await scheduleBeers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update requires canning',
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

const loadCanningDays = async () => {
  try {
    canningDays.value = await canningDaysService.getAll()
  } catch (error) {
    console.error('Failed to load canning days:', error)
  }
}

const isCanningDay = (dateStr) => {
  return canningDays.value.includes(dateStr)
}

const addCanningDay = async () => {
  if (!newCanningDay.value) return

  addingCanningDay.value = true
  try {
    await canningDaysService.create(newCanningDay.value)
    await loadCanningDays()
    newCanningDay.value = null

    $q.notify({
      type: 'positive',
      message: 'Canning day added',
      icon: 'event'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to add canning day',
      caption: error.response?.data?.message || error.message
    })
  } finally {
    addingCanningDay.value = false
  }
}

const removeCanningDay = async (day) => {
  try {
    await canningDaysService.delete(day)
    await loadCanningDays()

    $q.notify({
      type: 'positive',
      message: 'Canning day removed',
      icon: 'event_busy'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to remove canning day',
      caption: error.response?.data?.message || error.message
    })
  }
}

const formatCanningDay = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Format canning days list for error dialog (days are relative day numbers)
const formatCanningDaysList = (days) => {
  if (!days || days.length === 0) return 'None'
  return days.map(d => `Day ${d}`).join(', ')
}

// Lifecycle
onMounted(async () => {
  // Load templates, beers, and canning days in parallel
  await Promise.all([
    loadBeerTemplates(),
    loadBeers(),
    loadCanningDays()
  ])
  // Run scheduler after initial load
  await scheduleBeers()
})
</script>

<style scoped>
.schedule-page {
  height: 100%;
}

.schedule-table-container {
  position: relative;
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

/* Task block styling - remove gaps between contiguous task cells */
.tank-cell.task-first {
  margin-bottom: -1px;
  padding-bottom: 5px;
}

.tank-cell.task-middle {
  margin-top: -1px;
  margin-bottom: -1px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.tank-cell.task-last {
  margin-top: -1px;
  padding-top: 5px;
}

.tank-cell.task-single {
  /* Single day task - no margin adjustments needed */
}

.task-info {
  color: #333;
  text-align: center;
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
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.color-indicator {
  border-radius: 4px;
  border: 2px solid white;
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

.task-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 4px;
}

.task-type-label {
  font-size: 13px;
  text-transform: capitalize;
}

.canning-day-overlay {
  position: absolute;
  left: 0;
  right: 0;
  height: 39.5px;
  border: 2px solid #E53935;
  border-radius: 3px;
  pointer-events: none;
  z-index: 2;
}

.beer-diagnostic-details {
  font-size: 12px;
  background-color: #fafafa;
  padding: 8px;
  border-radius: 4px;
}
</style>
