import { Order } from "../types/domain";

const API_BASE_URL = "http://localhost:3000";

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp: string;
}

export const orderActions = {
  async fetchOrders(
    page: number = 1,
    limit: number = 10,
  ): Promise<OrdersResponse> {
    try {
      const url = `${API_BASE_URL}/v1/orders?page=${page}&limit=${limit}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch orders");
      }

      return result;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  async fetchOrderById(id: number): Promise<Order> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/orders/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch order");
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  },

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update order");
      }

      return result.data;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },

  async deleteOrder(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/orders/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },
};
