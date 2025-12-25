import { apiClient } from 'src/config/api'

const NON_WORKING_DAYS_ENDPOINT = '/api/non_working_days'

export const nonWorkingDaysService = {
  /**
   * Get all non-working days
   * @returns {Promise<Array<string>>} List of non-working day dates (YYYY-MM-DD format)
   */
  async getAll() {
    const response = await apiClient.get(NON_WORKING_DAYS_ENDPOINT)
    const nonWorkingDays = response.data.non_working_days || []
    return nonWorkingDays.map(item => item.non_working_day)
  },

  /**
   * Add a non-working day
   * @param {string} nonWorkingDay - Date in YYYY-MM-DD format
   * @returns {Promise<void>} No response body (201 Created)
   */
  async create(nonWorkingDay) {
    await apiClient.post(NON_WORKING_DAYS_ENDPOINT, {
      non_working_day: nonWorkingDay
    })
  },

  /**
   * Remove a non-working day
   * @param {string} nonWorkingDay - Date in YYYY-MM-DD format
   * @returns {Promise<void>} No response body (204 No Content)
   */
  async delete(nonWorkingDay) {
    await apiClient.delete(`${NON_WORKING_DAYS_ENDPOINT}/${nonWorkingDay}`)
  }
}
