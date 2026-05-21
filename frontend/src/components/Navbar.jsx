import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { isLoggedIn, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login");
  };

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-white">Campus</span>
          <span className="brand-accent">Market</span>
        </Link>

        <button
          type="button"
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {menuOpen && <div className="menu-backdrop" onClick={closeMenu}></div>}

        <div className={`mobile-menu ${menuOpen ? "active" : ""}`}>
          <nav className="nav-links">
            <Link to="/" onClick={closeMenu}>
              Home
            </Link>

            <HashLink smooth to="/#browse-listings" onClick={closeMenu}>
              Browse
            </HashLink>

            {isLoggedIn && (
              <Link to="/chat" onClick={closeMenu}>
                Chat
              </Link>
            )}

            <Link to="/upload" onClick={closeMenu}>
              Sell Item
            </Link>

            {isLoggedIn && (
              <Link to="/my-uploads" onClick={closeMenu}>
                My Uploads
              </Link>
            )}
          </nav>

          <div className="nav-actions">
            <Link
              to="/cart"
              className="icon-btn cart-btn"
              aria-label="Cart"
              onClick={closeMenu}
            >
              <span className="cart-icon">🛒</span>
              <span className="cart-text">Cart</span>
              {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
            </Link>

            {isLoggedIn ? (
              <div className="user-actions">
                <span className="user-greeting">
                  Hi, {user?.name?.split(" ")[0] || "User"}
                </span>

                <button
                  type="button"
                  className="get-started-btn logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="login-link" onClick={closeMenu}>
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="get-started-btn"
                  onClick={closeMenu}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;