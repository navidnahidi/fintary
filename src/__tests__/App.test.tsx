import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../client/App';

// Mock fetch for testing
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders without crashing', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);
    
    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.getByText('🚀 Fintary')).toBeInTheDocument();
    });
  });

  it('displays the main heading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('A Node.js + Koa + React + TypeScript Application')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders users when data is loaded', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    render(<App />);
    
    // Wait for the users to be displayed
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<App />);
    
    expect(await screen.findByText(/Error: Failed to fetch/)).toBeInTheDocument();
  });
});
