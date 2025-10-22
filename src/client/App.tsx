import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      alert(`Health check: ${data.message}`);
    } catch (err) {
      alert('Health check failed');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Error: {error}</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#333' }}>🚀 Fintary</h1>
        <p style={{ color: '#666' }}>A Node.js + Koa + React + TypeScript Application</p>
        <button 
          onClick={checkHealth}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Check Server Health
        </button>
      </header>

      <main>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Users</h2>
        <div style={{ display: 'grid', gap: '15px' }}>
          {users.map((user) => (
            <div 
              key={user.id}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{user.name}</h3>
              <p style={{ margin: '0', color: '#666' }}>{user.email}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ marginTop: '40px', textAlign: 'center', color: '#999' }}>
        <p>Built with ❤️ using Node.js, Koa, React, and TypeScript</p>
      </footer>
    </div>
  );
};

export default App;
