import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { API_BASE_URL } from "../config/api";
import "./Home.css";

function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listings`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const title = item.title || "";
      const description = item.description || "";
      const category = item.category || "";
      const condition = item.condition || "";
      const price = item.price || 0;

      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || category === selectedCategory;

      const matchesCondition =
        selectedCondition === "All" || condition === selectedCondition;

      const matchesPrice =
        maxPrice === "" || Number(price) <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCondition &&
        matchesPrice
      );
    });
  }, [items, searchTerm, selectedCategory, selectedCondition, maxPrice]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedCondition("All");
    setMaxPrice("");
  };

  if (loading) {
    return (
      <main className="home-page">
        <h2 className="loading-text">Loading items...</h2>
      </main>
    );
  }

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-tag">BUY • SELL • CONNECT</p>
          <h1>Campus Marketplace</h1>
          <p className="hero-subtext">
            A secure student-first space to buy textbooks, notes, electronics,
            lab tools, and daily campus essentials.
          </p>

          <div className="hero-actions">
            <a href="#browse-listings" className="hero-btn primary-btn">
              Browse Items
            </a>
            <Link to="/Upload" className="hero-btn secondary-btn">
              Sell an Item
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-box">
              <strong>{items.length}+</strong>
              <span>Active Listings</span>
            </div>
            <div className="stat-box">
              <strong>Trusted</strong>
              <span>Student-first exchange</span>
            </div>
            <div className="stat-box">
              <strong>Fast</strong>
              <span>Easy filters & discovery</span>
            </div>
          </div>
        </div>
      </section>

      <section className="community-section">
        <div className="section-head">
          <p className="section-label">WHY CAMPUSMARKET</p>
          <h2>Built for the Student Community</h2>
          <p className="section-subtext">
            Designed to make campus life more affordable, connected, and
            sustainable through trusted peer-to-peer exchange.
          </p>
        </div>

        <div className="community-grid">
          <div className="community-card">
            <div className="community-icon">👥</div>
            <h3>Peer-to-Peer Trust</h3>
            <p>
              Buy and sell directly with students inside your own campus
              community.
            </p>
          </div>

          <div className="community-card">
            <div className="community-icon">📚</div>
            <h3>Academic Focus</h3>
            <p>
              Find books, notes, and study essentials that actually matter for
              your semester.
            </p>
          </div>

          <div className="community-card">
            <div className="community-icon">🛡️</div>
            <h3>Secure Trading</h3>
            <p>
              Safer listings, cleaner deals, and smoother student-to-student
              exchange.
            </p>
          </div>
        </div>
      </section>

      <section className="market-section" id="browse-listings">
        <div className="section-head">
          <p className="section-label">MARKETPLACE</p>
          <h2>Browse Listings</h2>
          <p className="section-subtext">
            Use smart filters to discover the right item faster.
          </p>
        </div>

        <div className="results-bar">
          <p>{filteredItems.length} items found</p>

          <div className="quick-tags">
            <span>Books</span>
            <span>Electronics</span>
            <span>Notes</span>
            <span>Lab Equipment</span>
          </div>
        </div>

        <div className="filters-box">
          <input
            type="text"
            placeholder="Search by title or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Categories</option>
            <option value="Books">Books</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Notes">Notes</option>
            <option value="Lab Equipment">Lab Equipment</option>
            <option value="Others">Others</option>
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Conditions</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Used">Used</option>
          </select>

          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="filter-input"
          />

          <button className="clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="no-items-box">
            <h3 className="no-items">No items found</h3>
            <p>Try changing your search, category, condition, or max price.</p>
            <button className="clear-btn empty-btn" onClick={clearFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredItems.map((item) => (
              <ProductCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;