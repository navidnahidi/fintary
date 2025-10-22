import { MatchingResult } from '../types/domain'

interface ResultsTabProps {
  matchingResult: MatchingResult | null
  isLoading: boolean
}

function ResultsTab({ matchingResult, isLoading }: ResultsTabProps) {
  if (isLoading) {
    return (
      <div className="tab-panel">
        <h3>Matching Results</h3>
        <div className="loading">Running matching algorithm...</div>
      </div>
    )
  }

  if (!matchingResult) {
    return (
      <div className="tab-panel">
        <h3>Matching Results</h3>
        <p>No matching results available. Click "Run Matching" to see results.</p>
      </div>
    )
  }

  return (
    <div className="tab-panel">
      <h3>Matching Results</h3>
      
      {/* Summary */}
      <div className="results-summary">
        <div className="summary-card">
          <h4>Matched Orders</h4>
          <div className="summary-number">{matchingResult.matched.length}</div>
        </div>
        <div className="summary-card">
          <h4>Unmatched Orders</h4>
          <div className="summary-number">{matchingResult.unmatchedOrders.length}</div>
        </div>
        <div className="summary-card">
          <h4>Unmatched Transactions</h4>
          <div className="summary-number">{matchingResult.unmatchedTransactions.length}</div>
        </div>
      </div>

      {/* Matched Orders with Transactions */}
      {matchingResult.matched.length > 0 && (
        <div className="results-section">
          <h4>Matched Orders with Transactions</h4>
          {matchingResult.matched.map((match, index) => (
            <div key={index} className="matched-order-group">
              <div className="order-header">
                <h5>Order: {match.order.orderId} - {match.order.customer}</h5>
                <div className="order-details">
                  <span>Item: {match.order.item}</span>
                  <span>Price: ${(match.order.priceCents / 100).toFixed(2)}</span>
                  <span>Match Score: {(match.matchScore * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="transactions-list">
                <h6>Associated Transactions ({match.txns.length}):</h6>
                <div className="table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Item</th>
                        <th>Type</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {match.txns.map((txn, txnIndex) => (
                        <tr key={txnIndex}>
                          <td>{txn.orderId}</td>
                          <td>{txn.customer}</td>
                          <td>{txn.item}</td>
                          <td>{txn.txnType}</td>
                          <td style={{ color: txn.txnAmountCents < 0 ? 'red' : 'green' }}>
                            ${(txn.txnAmountCents / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unmatched Orders */}
      {matchingResult.unmatchedOrders.length > 0 && (
        <div className="results-section">
          <h4>Unmatched Orders</h4>
          <div className="table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {matchingResult.unmatchedOrders.map((order, index) => (
                  <tr key={index}>
                    <td>{order.orderId}</td>
                    <td>{order.customer}</td>
                    <td>{order.item}</td>
                    <td>${(order.priceCents / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unmatched Transactions */}
      {matchingResult.unmatchedTransactions.length > 0 && (
        <div className="results-section">
          <h4>Unmatched Transactions</h4>
          <div className="table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {matchingResult.unmatchedTransactions.map((txn, index) => (
                  <tr key={index}>
                    <td>{txn.orderId}</td>
                    <td>{txn.customer}</td>
                    <td>{txn.item}</td>
                    <td>{txn.txnType}</td>
                    <td style={{ color: txn.txnAmountCents < 0 ? 'red' : 'green' }}>
                      ${(txn.txnAmountCents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

export default ResultsTab
