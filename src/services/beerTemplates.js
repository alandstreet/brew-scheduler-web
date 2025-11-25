import { apiClient } from 'src/config/api'

const BEER_TEMPLATES_ENDPOINT = '/api/beer-templates'

export const beerTemplatesService = {
  /**
   * Get all beer templates
   * @returns {Promise<Array>} List of beer templates
   */
  async getAll() {
    const response = await apiClient.get(BEER_TEMPLATES_ENDPOINT)
    return response.data.beer_templates
  },

  /**
   * Get a single beer template by ID
   * @param {string} id - Beer template UUID
   * @returns {Promise<Object>} Beer template
   */
  async getById(id) {
    const response = await apiClient.get(`${BEER_TEMPLATES_ENDPOINT}/${id}`)
    return response.data
  },

  /**
   * Create a new beer template
   * @param {Object} template - Beer template data
   * @param {string} template.beer_name
   * @param {number} template.volume_hl
   * @param {number} template.min_fermentation_days
   * @param {number} template.min_maturation_days
   * @returns {Promise<Object>} Created beer template
   */
  async create(template) {
    const response = await apiClient.post(BEER_TEMPLATES_ENDPOINT, template)
    return response.data
  },

  /**
   * Update an existing beer template
   * @param {string} id - Beer template UUID
   * @param {Object} template - Updated beer template data
   * @returns {Promise<Object>} Updated beer template
   */
  async update(id, template) {
    const response = await apiClient.put(`${BEER_TEMPLATES_ENDPOINT}/${id}`, template)
    return response.data
  },

  /**
   * Delete a beer template
   * @param {string} id - Beer template UUID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await apiClient.delete(`${BEER_TEMPLATES_ENDPOINT}/${id}`)
  }
}
