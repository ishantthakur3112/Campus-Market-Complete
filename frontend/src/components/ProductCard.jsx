import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../config/api";
import "./ProductCard.css";

function ProductCard({ item }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const title = item?.title?.trim() || "Untitled Item";
  const description = item?.description?.trim() || "No description available.";
  const category = item?.category?.trim();
  const condition = item?.condition?.trim();
  const sellerName = item?.seller?.name?.trim();
  const sellerId = item?.seller?._id;

  const numericPrice = Number(item?.price);
  const price =
    item?.price !== undefined &&
    item?.price !== null &&
    item?.price !== "" &&
    !Number.isNaN(numericPrice)
      ? `₹${numericPrice.toLocaleString("en-IN")}`
      : "Price not available";

  const imageUrl = item?.image
    ? item.image.startsWith("http")
      ? item.image
      : `${API_BASE_URL}${item.image}`
    : "/bgimg.png";

  const handleCardClick = () => {
    if (item?._id) {
      navigate(`/product/${item._id}`);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({
      ...item,
      imageUrl,
      image: imageUrl,
    });
  };

  const handleMessageSeller = async (e) => {
    e.stopPropagation();

    if (!token) {
      toast.error("Please login first to message the seller");
      navigate("/login");
      return;
    }

    if (!sellerId) {
      toast.error("Seller information not available");
      return;
    }

    if (sellerId === currentUser.id) {
      toast.error("You cannot message yourself");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: sellerId,
          listingId: item?._id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to start conversation");
      }

      navigate("/chat", {
        state: {
          conversationId: data._id,
        },
      });
    } catch (error) {
      toast.error(error.message || "Could not open chat");
    }
  };

  return (
    <article className="product-card">
      <div
        className="product-image-wrap"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        aria-label={`View details for ${title}`}
      >
        <img
          src={imageUrl}
          alt={title}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/bgimg.png";
          }}
        />
      </div>

      <div className="product-info">
        <h3
          className="product-title clickable"
          title={title}
          onClick={handleCardClick}
        >
          {title}
        </h3>

        <p className="product-desc">{description}</p>
        <p className="product-price">{price}</p>

        {(category || condition || sellerName) && (
          <div className="product-meta" aria-label="Product details">
            {category && <span className="meta-pill">Category: {category}</span>}
            {condition && <span className="meta-pill">Condition: {condition}</span>}
            {sellerName && <span className="meta-pill">Seller: {sellerName}</span>}
          </div>
        )}

        <div className="product-actions">
          <button
            type="button"
            className="message-btn"
            onClick={handleMessageSeller}
          >
            Message Seller
          </button>

          <button
            type="button"
            className="add-cart-btn"
            onClick={handleAddToCart}
            aria-label={`Add ${title} to cart`}
          >
            Add to Cart
          </button>

          <button
            type="button"
            className="details-link-btn"
            onClick={handleCardClick}
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;