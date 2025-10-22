import React from 'react'
import { MatchingResult } from '../types'

interface DashboardProps {
  matchingResult: MatchingResult | null;
  isLoading: boolean;
  onRunMatching: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  matchingResult, 
  isLoading, 
  onRunMatching 
}) => {
  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button 
          className="run-matching-btn"
          onClick={onRunMatching}
          disabled={isLoading}
        >
          {isLoading ? '🔄 Running...' : '🚀 Run Order Matching'}
        </button>
      </div>

      {matchingResult && (
        <div className="matching-results">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>✅ Matched Orders</h3>
              <div className="stat-number">{matchingResult.matched.length}</div>
            </div>
            <div className="stat-card">
              <h3>❌ Unmatched Orders</h3>
              <div className="stat-number">{matchingResult.unmatchedOrders.length}</div>
            </div>
            <div className="stat-card">
              <h3>❌ Unmatched Transactions</h3>
              <div className="stat-number">{matchingResult.unmatchedTransactions.length}</div>
            </div>
            <div className="stat-card">
              <h3>📊 Match Rate</h3>
              <div className="stat-number">
                {matchingResult.matched.length > 0 
                  ? `${((matchingResult.matched.length / (matchingResult.matched.length + matchingResult.unmatchedOrders.length)) * 100).toFixed(1)}%`
                  : '0%'
                }
              </div>
            </div>
          </div>

          {matchingResult.matched.length > 0 && (
            <div className="matched-orders">
              <h3>✅ Successfully Matched Orders</h3>
              <div className="orders-list">
                {matchingResult.matched.map((match, index) => (
                  <div key={index} className="order-card">
                    <div className="order-header">
                      <h4>{match.order.customer}</h4>
                      <span className="order-id">{match.order.orderId}</span>
                      <span className="match-score">Score: {match.matchScore.toFixed(3)}</span>
                    </div>
                    <div className="order-details">
                      <p><strong>Item:</strong> {match.order.item}</p>
                      <p><strong>Price:</strong> {formatPrice(match.order.priceCents)}</p>
                      <p><strong>Date:</strong> {formatDate(match.order.date)}</p>
                    </div>
                    <div className="transactions">
                      <h5>Related Transactions:</h5>
                      {match.txns.map((txn, txnIndex) => (
                        <div key={txnIndex} className="transaction-item">
                          <span className="txn-customer">{txn.customer}</span>
                          <span className="txn-type">{txn.txnType}</span>
                          <span className="txn-amount">{formatPrice(txn.txnAmountCents)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!matchingResult && !isLoading && (
        <div className="welcome-message">
          <h3>Welcome to Fintary!</h3>
          <p>Click "Run Order Matching" to start matching orders with transactions using advanced fuzzy matching algorithms.</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
