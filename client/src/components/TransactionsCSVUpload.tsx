import { useState } from 'react'
import { Transaction } from '../types/domain'

interface TransactionsCSVUploadProps {
  onTransactionsUploaded: (transactions: Transaction[]) => void
}

function TransactionsCSVUpload({ onTransactionsUploaded }: TransactionsCSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus('Processing CSV file...')

    try {
      const text = await file.text()
      const transactions = parseCSV(text)
      
      if (transactions.length === 0) {
        setUploadStatus('No valid transactions found in CSV file')
        return
      }

      // Store transactions locally instead of uploading to server
      setUploadStatus(`✅ Successfully loaded ${transactions.length} transactions`)
      onTransactionsUploaded(transactions)
    } catch (error) {
      console.log('Error processing CSV:', error)
      setUploadStatus(`❌ Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const parseCSV = (csvText: string): Transaction[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const transactions: Transaction[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length !== headers.length) continue

      const transaction: Partial<Transaction> = {}
      headers.forEach((header, index) => {
        const value = values[index]
        
        switch (header) {
          case 'customer':
            transaction.customer = value
            break
          case 'orderid':
          case 'order_id':
            transaction.orderId = value
            break
          case 'date':
            transaction.date = value
            break
          case 'item':
            transaction.item = value
            break
          case 'price':
          case 'pricecents':
          case 'price_cents': {
            const price = parseFloat(value)
            transaction.priceCents = isNaN(price) ? 0 : Math.round(price * 100)
            break
          }
          case 'txntype':
          case 'txn_type':
          case 'transaction_type':
            transaction.txnType = value
            break
          case 'txnamount':
          case 'txn_amount':
          case 'transaction_amount': {
            const amount = parseFloat(value)
            transaction.txnAmountCents = isNaN(amount) ? 0 : Math.round(amount * 100)
            break
          }
        }
      })

      // Validate required fields
      if (transaction.customer && transaction.orderId && transaction.item && 
          transaction.priceCents !== undefined && transaction.txnType && 
          transaction.txnAmountCents !== undefined) {
        transactions.push(transaction as Transaction)
      }
    }

    return transactions
  }

  return (
    <div className="csv-upload">
      <h4>Upload Transactions via CSV</h4>
      
      <div className="upload-area">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="file-input"
          id="transactions-csv-file-input"
        />
        <label htmlFor="transactions-csv-file-input" className="upload-label">
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
        <p>Required columns: customer, orderId, date, item, price, txnType, txnAmount</p>
        <p>Example:</p>
        <pre>
{`customer,orderId,date,item,price,txnType,txnAmount
John Doe,ORD001,2023-01-01,Widget A,12.50,payment,12.50
Jane Smith,ORD002,2023-01-02,Widget B,25.00,refund,-25.00`}
        </pre>
      </div>
    </div>
  )
}

export default TransactionsCSVUpload
