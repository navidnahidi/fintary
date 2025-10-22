import React from 'react'
import { HeaderProps } from '../types/components'

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`header ${className}`}>
      <div className="header-content">
        <h1 className="logo">
          <span className="logo-icon">💰</span>
          Fintary
        </h1>
        <p className="tagline">Order-Transaction Matcher</p>
      </div>
    </header>
  )
}

export default Header
