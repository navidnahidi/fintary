import { useState, useEffect } from 'react'
import OrdersTab from './OrdersTab'
import TransactionsTab from './TransactionsTab'
import ResultsTab from './ResultsTab'
import { matchingActions } from '../actions/matching'
import { MatchingResult, Transaction } from '../types/domain'

function Content() {
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions' | 'results'>('orders')
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [hasTransactions, setHasTransactions] = useState(false)
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([])

  // Function to refresh transaction status (called from TransactionsTab)
  const refreshTransactionStatus = () => {
    setHasTransactions(localTransactions.length > 0)
  }

  // Update hasTransactions when localTransactions changes
  useEffect(() => {
    setHasTransactions(localTransactions.length > 0)
  }, [localTransactions])

  const handleRunMatching = async () => {
    setIsMatching(true)
    
    try {
      // Use locally stored transactions instead of fetching from server
      const transactions = localTransactions

      const matchingResult = await matchingActions.runMatching(transactions)
      setMatchingResult(matchingResult)
      setActiveTab('results')
    } catch (error) {
('Error running matching:', error)
      // Show error result
      const errorResult: MatchingResult = {
        matched: [],
        unmatchedOrders: [],
        unmatchedTransactions: []
      }
      setMatchingResult(errorResult)
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
        
        {activeTab === 'transactions' && (
          <TransactionsTab 
            onTransactionsUploaded={refreshTransactionStatus}
            transactions={localTransactions}
            setTransactions={setLocalTransactions}
          />
        )}
        
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
          disabled={isMatching || !hasTransactions}
        >
          {isMatching ? 'Running Matching...' : 
           !hasTransactions ? 'Upload Transactions First' : 
           'Run Matching'}
        </button>
        {!hasTransactions && (
          <p className="matching-help">
            Upload transactions via CSV to enable matching
          </p>
        )}
      </div>
    </div>
  )
}

export default Content
