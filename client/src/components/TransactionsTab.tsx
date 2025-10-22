import { useState } from 'react'

interface Transaction {
  customer: string
  orderId: string
  date: string
  item: string
  price: number
  txnType: string
  txnAmount: number
}

function TransactionsTab() {
  const [transactions] = useState<Transaction[]>([
    {customer: 'Alexis Abe', orderId: '1B6', date: '2023-07-12', item: 'Tool A', price: 1.23, txnType: 'payment', txnAmount: 1.23},
    {customer: 'Alex Able', orderId: 'I8G', date: '2023-07-13', item: 'Tool A', price: 1.23, txnType: 'refund', txnAmount: -1.23},
    {customer: 'Brian Ball', orderId: 'ZOS', date: '2023-08-11', item: 'Toy B', price: 3.21, txnType: 'payment-1', txnAmount: 1.21},
    {customer: 'Bryan', orderId: '705', date: '2023-08-13', item: 'Toy B', price: 3.21, txnType: 'payment-2', txnAmount: 2.00},
  ])

  return (
    <div className="tab-panel">
      <h3>Transactions</h3>
      
      <div className="transactions-list">
        {transactions.length === 0 ? (
          <p>No transactions found.</p>
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
                {transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td>{transaction.customer}</td>
                    <td>{transaction.orderId}</td>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.item}</td>
                    <td>${transaction.price.toFixed(2)}</td>
                    <td>{transaction.txnType}</td>
                    <td style={{ color: transaction.txnAmount < 0 ? 'red' : 'green' }}>
                      ${transaction.txnAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionsTab
