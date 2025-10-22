import React from 'react'
import { OrderMatcherProps } from '../types/components'

const OrderMatcher: React.FC<OrderMatcherProps> = ({ 
  matchingResult, 
  isLoading, 
  onRunMatching 
}) => {
  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="order-matcher">
      <div className="matcher-header">
        <h2>Order Transaction Matcher</h2>
        <p className="matcher-description">
          Advanced fuzzy matching algorithm using PostgreSQL extensions for robust order-transaction matching.
        </p>
      </div>

      <div className="matcher-controls">
        <button 
          className="run-matching-btn primary"
          onClick={onRunMatching}
          disabled={isLoading}
        >
          {isLoading ? '🔄 Processing...' : '🚀 Run Matching Algorithm'}
        </button>
      </div>

      {matchingResult && (
        <div className="detailed-results">
          <div className="results-section">
            <h3>📊 Detailed Results</h3>
            
            {matchingResult.unmatchedOrders.length > 0 && (
              <div className="unmatched-section">
                <h4>❌ Unmatched Orders ({matchingResult.unmatchedOrders.length})</h4>
                <div className="items-list">
                  {matchingResult.unmatchedOrders.map((order, index) => (
                    <div key={index} className="item-card unmatched">
                      <div className="item-header">
                        <span className="customer">{order.customer}</span>
                        <span className="order-id">{order.orderId}</span>
                      </div>
                      <div className="item-details">
                        <span>{order.item}</span>
                        <span className="price">{formatPrice(order.priceCents)}</span>
                        <span className="date">{new Date(order.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchingResult.unmatchedTransactions.length > 0 && (
              <div className="unmatched-section">
                <h4>❌ Unmatched Transactions ({matchingResult.unmatchedTransactions.length})</h4>
                <div className="items-list">
                  {matchingResult.unmatchedTransactions.map((txn, index) => (
                    <div key={index} className="item-card unmatched">
                      <div className="item-header">
                        <span className="customer">{txn.customer}</span>
                        <span className="order-id">{txn.orderId}</span>
                        <span className="txn-type">{txn.txnType}</span>
                      </div>
                      <div className="item-details">
                        <span>{txn.item}</span>
                        <span className="price">{formatPrice(txn.txnAmountCents)}</span>
                        <span className="date">{new Date(txn.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!matchingResult && !isLoading && (
        <div className="algorithm-info">
          <h3>🔍 Matching Algorithm Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>🎯 Fuzzy String Matching</h4>
              <p>Uses PostgreSQL trigram similarity and Levenshtein distance for robust name matching</p>
            </div>
            <div className="feature-card">
              <h4>📅 Date Proximity</h4>
              <p>Considers transaction dates within 60 days of order dates for better accuracy</p>
            </div>
            <div className="feature-card">
              <h4>💰 Price Matching</h4>
              <p>Exact price matching with fallback scoring for similar amounts</p>
            </div>
            <div className="feature-card">
              <h4>🏷️ Item Matching</h4>
              <p>Case-insensitive exact item matching for product identification</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderMatcher
