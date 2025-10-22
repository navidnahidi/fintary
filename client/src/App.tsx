import './App.css'
import Content from './components/Content'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Welcome to Fintary</h1>
        <p>A simple React application</p>
      </header>
      
        <Content />
    </div>
  )
}

export default App