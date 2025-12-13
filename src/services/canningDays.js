import { apiClient } from 'src/config/api'

const CANNING_DAYS_ENDPOINT = '/api/canning-days'

export const canningDaysService = {
  /**
   * Get all future canning days
   * @returns {Promise<Array<string>>} List of canning day dates (YYYY-MM-DD format)
   */
  async getAll() {
    const response = await apiClient.get(CANNING_DAYS_ENDPOINT)
    const canningDays = response.data.canning_days || []
    return canningDays.map(item => item.canning_day)
  },

  /**
   * Add a canning day
   * @param {string} canningDay - Date in YYYY-MM-DD format
   * @returns {Promise<void>} No response body (201 Created)
   */
  async create(canningDay) {
    await apiClient.post(CANNING_DAYS_ENDPOINT, {
      canning_day: canningDay
    })
  },

  /**
   * Remove a canning day
   * @param {string} canningDay - Date in YYYY-MM-DD format
   * @returns {Promise<void>} No response body (204 No Content)
   */
  async delete(canningDay) {
    await apiClient.delete(`${CANNING_DAYS_ENDPOINT}/${canningDay}`)
  }
}
