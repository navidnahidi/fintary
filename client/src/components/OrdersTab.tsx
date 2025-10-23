import { useState, useEffect } from 'react'
import { Order } from '../types/domain'
import { orderActions, OrdersResponse } from '../actions/orders'
import CSVUpload from './CSVUpload'

interface EditOrderFormProps {
  order: Order
  onSave: (order: Order) => void
  onCancel: () => void
}

function EditOrderForm({ order, onSave, onCancel }: EditOrderFormProps) {
  const [formData, setFormData] = useState({
    customer: order.customer,
    orderId: order.orderId,
    date: order.date,
    item: order.item,
    priceCents: order.priceCents
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...order,
      ...formData
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priceCents' ? Math.round(parseFloat(value) * 100) : value
    }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="customer">Customer:</label>
        <input
          type="text"
          id="customer"
          name="customer"
          value={formData.customer}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="orderId">Order ID:</label>
        <input
          type="text"
          id="orderId"
          name="orderId"
          value={formData.orderId}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="item">Item:</label>
        <input
          type="text"
          id="item"
          name="item"
          value={formData.item}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="price">Price:</label>
        <input
          type="number"
          id="price"
          name="priceCents"
          value={(formData.priceCents / 100).toFixed(2)}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
        />
      </div>
      
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

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
        console.log('Error fetching orders:', error)
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [ordersPagination.page, ordersPagination.limit])

  const handlePageChange = (newPage: number) => {
    setOrdersPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleOrdersUploaded = () => {
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
        console.log('Error fetching orders:', error)
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
  }

  const handleSaveOrder = async (updatedOrder: Order) => {
    if (!updatedOrder.id) return

    try {
      await orderActions.updateOrder(updatedOrder.id, updatedOrder)
      setEditingOrder(null)
      
      // Refresh the orders list
      const response: OrdersResponse = await orderActions.fetchOrders(ordersPagination.page, ordersPagination.limit)
      setOrders(response.data)
    } catch (error) {
      console.error('Error updating order:', error)
      setOrdersError(error instanceof Error ? error.message : 'Failed to update order')
    }
  }

  const handleDeleteOrder = async (orderId: number) => {
    try {
      await orderActions.deleteOrder(orderId)
      setDeleteConfirmId(null)
      
      // Refresh the orders list
      const response: OrdersResponse = await orderActions.fetchOrders(ordersPagination.page, ordersPagination.limit)
      setOrders(response.data)
    } catch (error) {
      console.error('Error deleting order:', error)
      setOrdersError(error instanceof Error ? error.message : 'Failed to delete order')
    }
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
                      <th>Actions</th>
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
                        <td>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEditOrder(order)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteConfirmId(order.id || 0)}
                            style={{ marginLeft: '8px' }}
                          >
                            Delete
                          </button>
                        </td>
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

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Edit Order</h4>
            <EditOrderForm 
              order={editingOrder}
              onSave={handleSaveOrder}
              onCancel={() => setEditingOrder(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this order? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-danger"
                onClick={() => handleDeleteOrder(deleteConfirmId)}
              >
                Delete
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersTab
