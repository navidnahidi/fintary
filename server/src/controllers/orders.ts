// Orders controller - handles business logic and data formatting
import { orderModel } from '../models/order';
import { Order, OrderInput } from '../models/types';

export class OrdersController {
  /**
   * Get paginated orders with proper formatting
   */
  async getOrders(page: number = 1, limit: number = 10) {
    const result = await orderModel.getOrders(page, limit);

    // Format orders for API response
    const formattedOrders: Order[] = result.orders.map(row => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.order_date,
      item: row.item,
      priceCents: row.price_cents,
    }));

    return {
      success: true,
      data: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        hasNextPage: page < result.totalPages,
        hasPrevPage: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Bulk insert orders with proper validation and formatting
   */
  async bulkInsertOrders(orders: OrderInput[]) {
    if (!orders || !Array.isArray(orders)) {
      throw new Error('Invalid request: orders array is required');
    }

    const result = await orderModel.bulkInsertOrders(orders);

    return {
      success: true,
      data: {
        insertedCount: result.insertedCount,
        totalProcessed: result.totalProcessed,
        errors: result.errors,
      },
      message: `Successfully inserted ${result.insertedCount} out of ${result.totalProcessed} orders`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update an existing order
   */
  async updateOrder(orderId: number, orderData: Partial<OrderInput>) {
    if (!orderId || !orderData) {
      throw new Error('Invalid request: order ID and data are required');
    }

    const result = await orderModel.updateOrder(orderId, orderData);

    return {
      success: true,
      data: result,
      message: 'Order updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Delete an order
   */
  async deleteOrder(orderId: number) {
    if (!orderId) {
      throw new Error('Invalid request: order ID is required');
    }

    const result = await orderModel.deleteOrder(orderId);

    return {
      success: true,
      data: result,
      message: 'Order deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

export const ordersController = new OrdersController();
