import React from 'react';
import { NavLink } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function Header({ navLinks = [], rightContent = null }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <header className={`header ${isDarkMode ? 'dark' : ''}`}>
      <div className="logo">
        <div className="logo-icon">M</div>
        <div className="logo-text">MSME ONE</div>
      </div>
      <nav className="nav">
        <div className="nav-links">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <div className="header-icons">
          <button
            className="icon-btn theme-toggle"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {rightContent}
        </div>
      </nav>
    </header>
  );
}

export default Header;
