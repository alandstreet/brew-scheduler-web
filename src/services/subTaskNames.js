import { apiClient } from 'src/config/api'

const SUB_TASK_NAMES_ENDPOINT = '/api/sub_task_names'

export const subTaskNamesService = {
  /**
   * Get all sub-task names
   * @returns {Promise<Array>} List of sub-task names
   */
  async getAll() {
    const response = await apiClient.get(SUB_TASK_NAMES_ENDPOINT)
    return response.data.sub_task_names || []
  },

  /**
   * Get a specific sub-task name
   * @param {string} name - Sub-task name
   * @returns {Promise<Object>} Sub-task name object
   */
  async getByName(name) {
    const response = await apiClient.get(`${SUB_TASK_NAMES_ENDPOINT}/${encodeURIComponent(name)}`)
    return response.data
  },

  /**
   * Create a sub-task name
   * @param {string} subTaskName - Sub-task name to create
   * @returns {Promise<Object>} Created sub-task name
   */
  async create(subTaskName) {
    const response = await apiClient.post(SUB_TASK_NAMES_ENDPOINT, {
      sub_task_name: subTaskName
    })
    return response.data
  },

  /**
   * Delete a sub-task name
   * @param {string} name - Sub-task name to delete
   * @returns {Promise<void>}
   */
  async delete(name) {
    await apiClient.delete(`${SUB_TASK_NAMES_ENDPOINT}/${encodeURIComponent(name)}`)
  }
}
