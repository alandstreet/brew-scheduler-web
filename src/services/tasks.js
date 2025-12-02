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
  }
}
