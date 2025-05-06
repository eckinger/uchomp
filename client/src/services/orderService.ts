import apiClient from './apiClient';

export default class OrderService {
  constructor() { }

  async createOrder(ownerId: string, restaurant: string, expiration: string, loc: string) {
    try {
      const response = await apiClient.post('/create-order', {
        owner_id: ownerId,
        restaurant,
        expiration,
        loc
      });
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async deleteOrder(orderId: number) {
    try {
      const response = await apiClient.delete(`/delete-order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  async getOrders() {
    try {
      // This will need to be implemented on the backend
      const response = await apiClient.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }
}
