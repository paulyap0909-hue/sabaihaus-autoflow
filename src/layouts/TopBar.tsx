import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react'

interface TopBarProps {
  onMenuOpen: () => void
  onLogout: () => void
}

export function TopBar({ onMenuOpen, onLogout }: TopBarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeUserMenu = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', closeUserMenu)
    return () => document.removeEventListener('mousedown', closeUserMenu)
  }, [])

  return (
    <header className="topbar">
      <button
        className="mobile-menu-button"
        type="button"
        onClick={onMenuOpen}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <label className="global-search">
        <Search size={16} strokeWidth={1.8} />
        <input
          type="search"
          placeholder="Search customers, bookings or packages..."
          aria-label="Global search"
        />
        <kbd>⌘ K</kbd>
      </label>

      <div className="topbar-actions">
        <span className="today-label">Wednesday, 10 June</span>
        <button className="notification-button" type="button" aria-label="Notifications">
          <Bell size={18} strokeWidth={1.8} />
          <span />
        </button>
        <div className="user-menu-wrap" ref={userMenuRef}>
          <button
            className="user-menu"
            type="button"
            onClick={() => setIsUserMenuOpen((open) => !open)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            <span className="user-avatar">AL</span>
            <span className="user-copy">
              <strong>Amelia Lee</strong>
              <small>Business Owner</small>
            </span>
            <ChevronDown
              className={isUserMenuOpen ? 'user-menu-chevron is-open' : 'user-menu-chevron'}
              size={15}
            />
          </button>

          {isUserMenuOpen && (
            <div className="user-dropdown" role="menu">
              <div className="user-dropdown-profile">
                <strong>Amelia Lee</strong>
                <span>admin@sabaihaus.com</span>
              </div>
              <button type="button" role="menuitem" onClick={onLogout}>
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
