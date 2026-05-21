import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

// IMPORT YOUR CUSTOM AXIOS INSTANCE
import api, { API_BASE_URL } from "../config/api"; 

import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isLoggedIn, user } = useAuth();

  const [item, setItem] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // CHANGED: Using Axios client concurrent execution. 
        // Pre-configured interceptors will trigger your global waking spinner overlay gracefully.
        const [productRes, listingsRes] = await Promise.all([
          api.get(`/api/listings/${id}`),
          api.get("/api/listings"),
        ]);

        setItem(productRes.data);
        setAllItems(Array.isArray(listingsRes.data) ? listingsRes.data : []);
      } catch (error) {
        console.error("Product fetching dashboard error:", error);
        toast.error(error.response?.data?.message || "Could not load product");
      }
    };

    fetchProduct();
  }, [id]);

  const relatedItems = useMemo(() => {
    if (!item) return [];

    return allItems
      .filter(
        (listing) =>
          listing._id !== item._id &&
          (listing.category === item.category ||
            listing.seller?._id === item.seller?._id)
      )
      .slice(0, 4);
  }, [allItems, item]);

  const imageUrl = item?.image
    ? item.image.startsWith("http")
      ? item.image
      : `${API_BASE_URL}${item.image}`
    : "/bgimg.png";

  const formattedPrice =
    item?.price !== undefined &&
    item?.price !== null &&
    item?.price !== "" &&
    !Number.isNaN(Number(item.price))
      ? `₹${Number(item.price).toLocaleString("en-IN")}`
      : "Price not available";

  const postedDate = item?.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const sellerName = item?.seller?.name || "Unknown Seller";
  const sellerEmail = item?.seller?.email || "Email not available";
  const sellerId = item?.seller?._id;
  const sellerInitial = sellerName.charAt(0).toUpperCase();

  const isOwnListing =
    sellerId && user && (sellerId === user?._id || sellerId === user?.id);

  const handleAddToCart = () => {
    if (!item) return;
    addToCart(item);
    toast.success("Item added to cart");
  };

  const handleMessageSeller = async () => {
    if (!isLoggedIn || !token) {
      toast.error("Please login first to message the seller");
      navigate("/login", {
        state: { from: { pathname: `/product/${id}` } },
      });
      return;
    }

    if (!sellerId) {
      toast.error("Seller information not available");
      return;
    }

    if (isOwnListing) {
      toast.error("You cannot message yourself");
      return;
    }

    try {
      setChatLoading(true);

      // CHANGED: Transitioned chat routing initialization payloads to use custom Axios client
      const res = await api.post("/api/chat/conversations", {
        receiverId: sellerId,
        listingId: item._id,
      });

      const data = res.data;

      navigate("/chat", {
        state: {
          conversationId: data._id,
          listingId: item._id,
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not open chat");
    } finally {
      setChatLoading(false);
    }
  };

  if (!item) {
    return (
      <main className="product-details-page">
        <div className="product-details-shell">
          <div className="product-empty-state">
            <h2>Product not found</h2>
            <p>This listing may have been removed or is unavailable.</p>
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="product-details-page">
      <div className="product-details-shell">
        <section className="product-hero-card">
          <div className="product-media-panel">
            <img
              src={imageUrl}
              alt={item.title || "Product image"}
              className="product-details-image"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/bgimg.png";
              }}
            />
          </div>

          <div className="product-summary-panel">
            <p className="product-tag">LISTING DETAILS</p>

            <h1>{item.title || "Untitled Item"}</h1>

            <p className="product-price-main">{formattedPrice}</p>

            <div className="product-badges">
              {item.category && (
                <span className="detail-pill">Category: {item.category}</span>
              )}
              {item.condition && (
                <span className="detail-pill">Condition: {item.condition}</span>
              )}
              <span className="detail-pill">Posted: {postedDate}</span>
            </div>

            <p className="product-description-full">
              {item.description?.trim() ||
                "No description available for this listing."}
            </p>

            <div className="seller-card">
              <div className="seller-card-top">
                <div className="seller-avatar">{sellerInitial}</div>

                <div className="seller-meta">
                  <p className="seller-label">Seller</p>
                  <h3>{sellerName}</h3>
                  <p>{sellerEmail}</p>
                </div>
              </div>

              <div className="seller-trust-row">
                <span className="seller-trust-pill">Campus seller</span>
                <span className="seller-trust-pill">Direct chat available</span>
              </div>
            </div>

            <div className="product-cta-row">
              <button
                type="button"
                className="primary-action-btn"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>

              {!isOwnListing && (
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={handleMessageSeller}
                  disabled={chatLoading}
                >
                  {chatLoading ? "Opening Chat..." : "Message Seller"}
                </button>
              )}
            </div>

            <button
              type="button"
              className="back-btn"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </section>

        <section className="product-extra-section">
          <div className="section-heading">
            <p className="product-tag">WHY THIS LISTING</p>
            <h2>Helpful item information</h2>
          </div>

          <div className="info-grid">
            <div className="info-card">
              <h3>Condition</h3>
              <p>{item.condition || "Not specified by seller"}</p>
            </div>

            <div className="info-card">
              <h3>Category</h3>
              <p>{item.category || "General listing"}</p>
            </div>

            <div className="info-card">
              <h3>Seller contact</h3>
              <p>{sellerEmail}</p>
            </div>
          </div>
        </section>

        {relatedItems.length > 0 && (
          <section className="related-section">
            <div className="section-heading">
              <p className="product-tag">MORE TO EXPLORE</p>
              <h2>Related listings</h2>
            </div>

            <div className="related-grid">
              {relatedItems.map((relatedItem) => {
                const relatedImage = relatedItem?.image
                  ? relatedItem.image.startsWith("http")
                    ? relatedItem.image
                    : `${API_BASE_URL}${relatedItem.image}`
                  : "/bgimg.png";

                const relatedPrice =
                  relatedItem?.price !== undefined &&
                  relatedItem?.price !== null &&
                  relatedItem?.price !== "" &&
                  !Number.isNaN(Number(relatedItem.price))
                    ? `₹${Number(relatedItem.price).toLocaleString("en-IN")}`
                    : "Price not available";

                return (
                  <article
                    key={relatedItem._id}
                    className="related-card"
                    onClick={() => navigate(`/product/${relatedItem._id}`)}
                  >
                    <img
                      src={relatedImage}
                      alt={relatedItem.title || "Related product"}
                      className="related-image"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/bgimg.png";
                      }}
                    />

                    <div className="related-info">
                      <h3>{relatedItem.title || "Untitled Item"}</h3>
                      <p>{relatedPrice}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default ProductDetails;