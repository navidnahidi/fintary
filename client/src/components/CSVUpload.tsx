import { useState } from 'react'
import { Order } from '../types/domain'

interface CSVUploadProps {
  onOrdersUploaded: () => void
}

const API_BASE_URL = "http://localhost:3000";

function CSVUpload({ onOrdersUploaded }: CSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus('Processing CSV file...')

    try {
      const text = await file.text()
      const orders = parseCSV(text)
      
      if (orders.length === 0) {
        setUploadStatus('No valid orders found in CSV file')
        return
      }

      // Upload to server
      // TODO: Use the correct API endpoint
      const response = await fetch(`${API_BASE_URL}/v1/orders/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders })
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setUploadStatus(`✅ Successfully uploaded ${result.data.insertedCount} orders`)
        onOrdersUploaded()
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.log('Error uploading CSV:', error)
      setUploadStatus(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const parseCSV = (csvText: string): Order[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const orders: Order[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length !== headers.length) continue

      const order: Partial<Order> = {}
      headers.forEach((header, index) => {
        const value = values[index]
        
        switch (header) {
          case 'customer':
            order.customer = value
            break
          case 'orderid':
          case 'order_id':
            order.orderId = value
            break
          case 'date':
            order.date = value
            break
          case 'item':
            order.item = value
            break
          case 'price':
          case 'pricecents':
          case 'price_cents': {
            const price = parseFloat(value)
            order.priceCents = isNaN(price) ? 0 : Math.round(price * 100)
            break
          }
        }
      })

      // Validate required fields
      if (order.customer && order.orderId && order.item && order.priceCents !== undefined) {
        orders.push(order as Order)
      }
    }

    return orders
  }

  return (
    <div className="csv-upload">
      <h4>Upload Orders via CSV</h4>
      
      <div className="upload-area">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="file-input"
          id="csv-file-input"
        />
        <label htmlFor="csv-file-input" className="upload-label">
          {isUploading ? 'Uploading...' : 'Choose CSV File'}
        </label>
      </div>

      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.includes('✅') ? 'success' : 'error'}`}>
          {uploadStatus}
        </div>
      )}

      <div className="csv-help">
        <h5>CSV Format:</h5>
        <p>Required columns: customer, orderId, date, item, price</p>
        <p>Example:</p>
        <pre>
{`customer,orderId,date,item,price
John Doe,ORD001,2023-01-01,Widget A,12.50
Jane Smith,ORD002,2023-01-02,Widget B,25.00`}
        </pre>
      </div>
    </div>
  )
}

export default CSVUpload
