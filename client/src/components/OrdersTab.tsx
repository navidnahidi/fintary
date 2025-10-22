import { useState, useEffect } from 'react'
import { Order } from '../types/domain'
import { orderActions, OrdersResponse } from '../actions/orders'
import CSVUpload from './CSVUpload'

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [ordersPagination, setOrdersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Fetch orders when component mounts or page changes
  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true)
      setOrdersError(null)
      
      try {
        const response: OrdersResponse = await orderActions.fetchOrders(ordersPagination.page, ordersPagination.limit)
        
        if (!response || !response.data) {
          throw new Error('Invalid response structure')
        }
        
        setOrders(response.data)
        
        if (response.pagination) {
          setOrdersPagination({
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.totalCount,
            totalPages: response.pagination.totalPages
          })
        } else {
          // Fallback if pagination is missing
          setOrdersPagination(prev => ({
            ...prev,
            total: response.data.length,
            totalPages: 1
          }))
        }
      } catch (error) {
        setOrdersError(error instanceof Error ? error.message : 'Failed to fetch orders')
('Error fetching orders:', error)
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [ordersPagination.page, ordersPagination.limit])

  const handlePageChange = (newPage: number) => {
    setOrdersPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleOrdersUploaded = (newOrders: Order[]) => {
    // Refresh the orders list after CSV upload
    const fetchOrders = async () => {
      setOrdersLoading(true)
      setOrdersError(null)
      
      try {
        const response: OrdersResponse = await orderActions.fetchOrders(ordersPagination.page, ordersPagination.limit)
        setOrders(response.data)
        
        if (response.pagination) {
          setOrdersPagination({
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.totalCount,
            totalPages: response.pagination.totalPages
          })
        }
      } catch (error) {
        setOrdersError(error instanceof Error ? error.message : 'Failed to fetch orders')
('Error fetching orders:', error)
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }


  return (
    <div className="tab-panel">
      <h3>Orders</h3>
      
      <CSVUpload onOrdersUploaded={handleOrdersUploaded} />
      
      {ordersLoading && (
        <div className="loading">Loading orders...</div>
      )}
      
      {ordersError && (
        <div className="error">Error: {ordersError}</div>
      )}
      
      {!ordersLoading && !ordersError && (
        <>
          <div className="orders-list">
            {orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              <div className="table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Item</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.customer}</td>
                        <td>{order.orderId}</td>
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>{order.item}</td>
                        <td>${(order.priceCents / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {ordersPagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(ordersPagination.page - 1)}
                disabled={ordersPagination.page === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {ordersPagination.page} of {ordersPagination.totalPages} 
                ({ordersPagination.total} total orders)
              </span>
              
              <button 
                onClick={() => handlePageChange(ordersPagination.page + 1)}
                disabled={ordersPagination.page === ordersPagination.totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default OrdersTab
