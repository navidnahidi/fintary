import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import OrderMatcher from './components/OrderMatcher'
import { Order, Transaction, MatchingResult } from './types'

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matcher'>('dashboard')
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRunMatching = async () => {
    setIsLoading(true)
    try {
      // This would call your backend API
      const response = await fetch('/api/match')
      const result = await response.json()
      setMatchingResult(result)
    } catch (error) {
      console.error('Error running matching:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <Header />
      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-tab ${activeTab === 'matcher' ? 'active' : ''}`}
          onClick={() => setActiveTab('matcher')}
        >
          Order Matcher
        </button>
      </nav>
      
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            matchingResult={matchingResult}
            isLoading={isLoading}
            onRunMatching={handleRunMatching}
          />
        )}
        {activeTab === 'matcher' && (
          <OrderMatcher 
            matchingResult={matchingResult}
            isLoading={isLoading}
            onRunMatching={handleRunMatching}
          />
        )}
      </main>
    </div>
  )
}

export default App
