import { apiClient } from 'src/config/api'

const INGREDIENTS_ENDPOINT = '/api/ingredients'

export const ingredientsService = {
  /**
   * Get all ingredients
   * @returns {Promise<Array>} List of ingredients
   */
  async getAll() {
    const response = await apiClient.get(INGREDIENTS_ENDPOINT)
    return response.data.ingredients || []
  },

  /**
   * Get a specific ingredient
   * @param {string} id - Ingredient UUID
   * @returns {Promise<Object>} Ingredient
   */
  async getById(id) {
    const response = await apiClient.get(`${INGREDIENTS_ENDPOINT}/${id}`)
    return response.data
  },

  /**
   * Create an ingredient
   * @param {Object} ingredient - Ingredient data { ingredient_name, supplier }
   * @returns {Promise<Object>} Created ingredient
   */
  async create(ingredient) {
    const response = await apiClient.post(INGREDIENTS_ENDPOINT, ingredient)
    return response.data
  },

  /**
   * Update an ingredient
   * @param {string} id - Ingredient UUID
   * @param {Object} ingredient - Updated ingredient data
   * @returns {Promise<Object>} Updated ingredient
   */
  async update(id, ingredient) {
    const response = await apiClient.put(`${INGREDIENTS_ENDPOINT}/${id}`, ingredient)
    return response.data
  },

  /**
   * Delete an ingredient
   * @param {string} id - Ingredient UUID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await apiClient.delete(`${INGREDIENTS_ENDPOINT}/${id}`)
  }
}
