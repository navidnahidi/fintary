import { useState } from 'react'
import TransactionsCSVUpload from './TransactionsCSVUpload'

interface Transaction {
  id?: number
  customer: string
  orderId: string
  date: string
  item: string
  priceCents: number
  txnType: string
  txnAmountCents: number
  matchedOrderId?: number
}

interface TransactionsTabProps {
  onTransactionsUploaded?: () => void
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[]) => void
}

function TransactionsTab({ onTransactionsUploaded, transactions, setTransactions }: TransactionsTabProps) {
  const [transactionsLoading] = useState(false)
  const [transactionsError] = useState<string | null>(null)

  const handleTransactionsUploaded = (newTransactions: Transaction[]) => {
    // Store transactions locally
    setTransactions(newTransactions)
    
    // Notify parent component that transactions were uploaded
    if (onTransactionsUploaded) {
      onTransactionsUploaded()
    }
  }

  return (
    <div className="tab-panel">
      <h3>Transactions</h3>
      
      <TransactionsCSVUpload onTransactionsUploaded={handleTransactionsUploaded} />
      
      {transactionsLoading && (
        <div className="loading">Loading transactions...</div>
      )}
      
      {transactionsError && (
        <div className="error">Error: {transactionsError}</div>
      )}
      
      {!transactionsLoading && !transactionsError && (
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <p>No transactions found. Upload a CSV file to add transactions.</p>
          ) : (
            <div className="table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Transaction Type</th>
                    <th>Transaction Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.customer}</td>
                      <td>{transaction.orderId}</td>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                      <td>{transaction.item}</td>
                      <td>${(transaction.priceCents / 100).toFixed(2)}</td>
                      <td>{transaction.txnType}</td>
                      <td style={{ color: transaction.txnAmountCents < 0 ? 'red' : 'green' }}>
                        ${(transaction.txnAmountCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TransactionsTab
