import { useState } from 'react'
import OrdersTab from './OrdersTab'
import TransactionsTab from './TransactionsTab'
import ResultsTab from './ResultsTab'
import { matchingActions } from '../actions/matching'
import { MatchingResult, Transaction } from '../types/domain'

function Content() {
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions' | 'results'>('orders')
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null)
  const [isMatching, setIsMatching] = useState(false)

  const handleRunMatching = async () => {
    setIsMatching(true)
    
    // Use the stubbed transactions from TransactionsTab
    const transactions: Transaction[] = [
      {customer: 'Alexis Abe', orderId: '1B6', date: '2023-07-12', item: 'Tool A', priceCents: 123, txnType: 'payment', txnAmountCents: 123},
      {customer: 'Alex Able', orderId: 'I8G', date: '2023-07-13', item: 'Tool A', priceCents: 123, txnType: 'refund', txnAmountCents: -123},
      {customer: 'Brian Ball', orderId: 'ZOS', date: '2023-08-11', item: 'Toy B', priceCents: 321, txnType: 'payment-1', txnAmountCents: 121},
      {customer: 'Bryan', orderId: '705', date: '2023-08-13', item: 'Toy B', priceCents: 321, txnType: 'payment-2', txnAmountCents: 200},
    ]

    try {
      const result = await matchingActions.runMatching(transactions)
      setMatchingResult(result)
      setActiveTab('results')
    } catch (error) {
      console.error('Error running matching:', error)
      // For now, show a mock result if API fails
      const mockResult: MatchingResult = {
        matched: [],
        unmatchedOrders: [],
        unmatchedTransactions: transactions.map(txn => ({
          ...txn,
          id: Math.random(),
          matchedOrderId: undefined
        }))
      }
      setMatchingResult(mockResult)
      setActiveTab('results')
    } finally {
      setIsMatching(false)
    }
  }

  return (
    <div className="content">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button 
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button 
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
          disabled={!matchingResult}
        >
          Results
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'orders' && <OrdersTab />}
        
        {activeTab === 'transactions' && <TransactionsTab />}
        
        {activeTab === 'results' && (
          <ResultsTab 
            matchingResult={matchingResult} 
            isLoading={isMatching} 
          />
        )}
      </div>
      
      <div className="actions">
        <button 
          className="btn btn-primary" 
          onClick={handleRunMatching}
          disabled={isMatching}
        >
          {isMatching ? 'Running Matching...' : 'Run Matching'}
        </button>
      </div>
    </div>
  )
}

export default Content
