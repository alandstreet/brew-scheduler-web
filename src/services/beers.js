import { apiClient } from 'src/config/api'

const BEERS_ENDPOINT = '/api/beers'

export const beersService = {
  /**
   * Get all beers with their schedules
   * @returns {Promise<Array>} List of beer objects (extracted from beer+schedule pairs)
   */
  async getAll() {
    const response = await apiClient.get(BEERS_ENDPOINT)
    const data = response.data.beers || response.data
    // API returns array of {beer, schedule} objects - extract just the beer objects
    if (Array.isArray(data) && data.length > 0 && data[0].beer) {
      return data.map(item => item.beer)
    }
    return data
  },

  /**
   * Get all beers with their schedule data
   * @returns {Promise<Array>} List of {beer, schedule} objects
   */
  async getAllWithSchedules() {
    const response = await apiClient.get(BEERS_ENDPOINT)
    return response.data.beers || response.data
  },

  /**
   * Get a single beer by ID
   * @param {string} id - Beer UUID
   * @returns {Promise<Object>} Beer
   */
  async getById(id) {
    const response = await apiClient.get(`${BEERS_ENDPOINT}/${id}`)
    return response.data
  },

  /**
   * Create a new beer
   * @param {Object} beer - Beer data
   * @param {string} beer.beer_template_id - Template UUID
   * @param {string} beer.name - Beer name
   * @param {string} beer.batch_id - Batch identifier
   * @param {number} beer.volume_hl - Volume in hectoliters
   * @param {number} beer.priority - Priority (1-5)
   * @param {number} beer.min_fermentation_days - Minimum fermentation days
   * @param {string} beer.target_completion_date - Target date (YYYY-MM-DD) or null
   * @returns {Promise<Object>} Created beer
   */
  async create(beer) {
    const response = await apiClient.post(BEERS_ENDPOINT, beer)
    return response.data
  },

  /**
   * Update an existing beer
   * @param {string} id - Beer UUID
   * @param {Object} beer - Updated beer data
   * @returns {Promise<Object>} Updated beer
   */
  async update(id, beer) {
    const response = await apiClient.put(`${BEERS_ENDPOINT}/${id}`, beer)
    return response.data
  },

  /**
   * Delete a beer
   * @param {string} id - Beer UUID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await apiClient.delete(`${BEERS_ENDPOINT}/${id}`)
  }
}
