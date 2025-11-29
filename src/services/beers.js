import { apiClient } from 'src/config/api'

const BEERS_ENDPOINT = '/api/beers'

export const beersService = {
  /**
   * Get all beers with their tasks
   * @returns {Promise<Array>} List of beer objects with embedded tasks
   */
  async getAll() {
    const response = await apiClient.get(BEERS_ENDPOINT)
    return response.data.beers || []
  },

  /**
   * Get a single beer by ID
   * @param {string} id - Beer UUID
   * @returns {Promise<Object>} Beer object with embedded tasks
   */
  async getById(id) {
    const response = await apiClient.get(`${BEERS_ENDPOINT}/${id}`)
    return response.data.beer
  },

  /**
   * Create a new beer
   * @param {Object} beer - Beer data (beer_id is generated server-side)
   * @param {string} beer.beer_template_id - Template UUID
   * @param {string} beer.name - Beer name
   * @param {string} beer.batch_id - Batch identifier
   * @param {number} beer.volume_hl - Volume in hectoliters
   * @param {number} beer.priority - Priority (1-5)
   * @param {number} beer.min_fermentation_days - Minimum fermentation days
   * @param {string} beer.target_start_date - Target start date (YYYY-MM-DD) or null
   * @param {string} beer.target_completion_date - Target completion date (YYYY-MM-DD) or null
   * @returns {Promise<void>} No response body (201 Created)
   */
  async create(beer) {
    // Build payload without beer_id (server generates) and tasks (read-only)
    const beerData = {
      beer_template_id: beer.beer_template_id,
      name: beer.name,
      batch_id: beer.batch_id,
      volume_hl: beer.volume_hl,
      priority: beer.priority,
      min_fermentation_days: beer.min_fermentation_days,
      target_start_date: beer.target_start_date,
      target_completion_date: beer.target_completion_date
    }
    await apiClient.post(BEERS_ENDPOINT, beerData)
  },

  /**
   * Update an existing beer
   * @param {string} id - Beer UUID
   * @param {Object} beer - Updated beer data
   * @returns {Promise<void>} No response body (200 OK)
   */
  async update(id, beer) {
    // Build payload without tasks (read-only) - include beer_id for the API
    const beerData = {
      beer_id: beer.beer_id,
      beer_template_id: beer.beer_template_id,
      name: beer.name,
      batch_id: beer.batch_id,
      volume_hl: beer.volume_hl,
      priority: beer.priority,
      min_fermentation_days: beer.min_fermentation_days,
      target_start_date: beer.target_start_date,
      target_completion_date: beer.target_completion_date
    }
    await apiClient.put(`${BEERS_ENDPOINT}/${id}`, beerData)
  },

  /**
   * Delete a beer
   * @param {string} id - Beer UUID
   * @returns {Promise<void>} No response body (204 No Content)
   */
  async delete(id) {
    await apiClient.delete(`${BEERS_ENDPOINT}/${id}`)
  }
}
