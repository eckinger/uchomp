import apiClient from "./apiClient";

export default class OrderService {
  async createOrder(
    ownerId: string,
    restaurant: string,
    expiration: string,
    loc: string
  ) {
    try {
      const response = await apiClient.post("/orders/create", {
        owner_id: ownerId,
        restaurant,
        expiration,
        loc,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async deleteOrder(orderId: number) {
    try {
      const response = await apiClient.delete(
        `/orders/delete-order/${orderId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }

  async getOrders(location?: string) {
    try {
      const response = await apiClient.get("/orders");
      // Filter by location on the client side since backend doesn't support it
      const orders = response.data || [];
      if (location && Array.isArray(orders)) {
        return orders.filter(order => order.location === location || order.loc === location);
      }
      return orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }

  async joinOrder(userId: string, orderId: string) {
    try {
      const response = await apiClient.post(`/orders/join/${orderId}`, {
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error joining order:", error);
      throw error;
    }
  }

  async leaveOrder(userId: string, orderId: string) {
    try {
      const response = await apiClient.post(`/orders/leave/${orderId}`, {
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error leaving order:", error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, isOpen: boolean) {
    try {
      const response = await apiClient.post(`/orders/update-status/${orderId}`, {
        is_open: isOpen,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  async getOrderDetails(orderId: string) {
    try {
      const response = await apiClient.get(`/orders/details/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting order details:", error);
      throw error;
    }
  }
}
