import { apiClient } from 'src/config/api'
import { v4 as uuidv4 } from 'uuid'

const TASKS_ENDPOINT = '/api/tasks'

export const tasksService = {
  /**
   * Get a task by ID
   * @param {string} taskId - Task UUID
   * @returns {Promise<Object>} Task object
   */
  async getById(taskId) {
    const response = await apiClient.get(`${TASKS_ENDPOINT}/${taskId}`)
    return response.data.task
  },

  /**
   * Create a new task (always locked)
   * @param {Object} task - Task data
   * @param {string} task.beer_id - Beer UUID
   * @param {string} task.beer_name - Beer name
   * @param {string} task.task_type - Task type (brewing, fermentation, filtration, maturation)
   * @param {number} task.start_day - Start day offset
   * @param {string} task.start_date - Start date (YYYY-MM-DD)
   * @param {number} task.duration - Duration in days
   * @param {number} task.end_day - End day offset
   * @param {string} task.end_date - End date (YYYY-MM-DD)
   * @param {string} task.resource - Resource name (brewhouse, F1, F2, etc.)
   * @param {number} task.volume_hl - Volume in hectoliters
   * @returns {Promise<Object>} Created task with task_id
   */
  async create(task) {
    const taskId = uuidv4()
    const response = await apiClient.post(TASKS_ENDPOINT, {
      task_id: taskId,
      ...task,
      locked: true
    })
    return response.data
  },

  /**
   * Delete a task
   * @param {string} taskId - Task UUID
   * @returns {Promise<void>} No response body (204 No Content)
   */
  async delete(taskId) {
    await apiClient.delete(`${TASKS_ENDPOINT}/${taskId}`)
  },

  /**
   * Adjust task duration
   * @param {string} taskId - Task UUID
   * @param {number} amountDays - Days to adjust (positive to extend, negative to shorten)
   * @returns {Promise<Array>} All tasks for the beer after adjustment
   */
  async adjustDuration(taskId, amountDays) {
    const response = await apiClient.put(`${TASKS_ENDPOINT}/${taskId}/duration/${amountDays}`)
    return response.data.tasks || []
  },

  /**
   * Update sub-task
   * @param {string} subTaskId - Sub-task UUID
   * @param {Object} updates - Fields to update (all optional)
   * @param {number} [updates.day] - New day value (relative to task start)
   * @param {string} [updates.date] - New date (YYYY-MM-DD)
   * @param {string} [updates.notes] - Notes
   * @returns {Promise<Object>} Updated sub-task
   */
  async updateSubTask(subTaskId, updates) {
    const response = await apiClient.put(`/api/sub-tasks/${subTaskId}`, updates)
    return response.data
  },

  /**
   * Create a sub-task for a task
   * @param {string} taskId - Parent task UUID
   * @param {Object} subTask - Sub-task data
   * @param {string} subTask.sub_task_name - Name of the sub-task
   * @param {number} subTask.day - Day relative to task start
   * @returns {Promise<Object>} Created sub-task
   */
  async createSubTask(taskId, subTask) {
    const response = await apiClient.post(`/api/sub-tasks`, {
      task_id: taskId,
      ...subTask
    })
    return response.data
  }
}
