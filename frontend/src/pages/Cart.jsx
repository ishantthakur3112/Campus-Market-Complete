import "./Cart.css";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";

function Cart() {
  const {
    cartItems,
    increaseQty,
    decreaseQty,
    removeFromCart,
    totalAmount,
    totalItems,
    clearCart,
  } = useCart();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty", { id: "checkout-empty" });
      return;
    }

    toast.success("Order placed successfully!", { id: "checkout-success" });
    clearCart();
  };

  return (
    <main className="cart-page">
      <div className="cart-shell">
        <p className="cart-tag">Your Basket</p>
        <h1>Shopping Cart</h1>
        <p className="cart-subtext">
          Review selected items before proceeding to checkout.
        </p>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <h2>Your cart is empty</h2>
            <p>Add some products to continue shopping on CampusMarket.</p>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-list">
              {cartItems.map((item) => (
                <div className="cart-item" key={item._id}>
                  <img
                    src={
                      item.imageUrl ||
                      item.image ||
                      item.image?.secure_url ||
                      item.images?.[0] ||
                      "/placeholder.png"
                    }
                    alt={item.title}
                    className="cart-item-image"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />

                  <div className="cart-item-info">
                    <h3>{item.title}</h3>
                    <p>
                      Seller:{" "}
                      {item.seller?.name || item.seller || "Campus Seller"}
                    </p>
                    <p className="cart-price">₹{item.price}</p>
                  </div>

                  <div className="cart-actions">
                    <div className="qty-box">
                      <button onClick={() => decreaseQty(item._id)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => increaseQty(item._id)}>+</button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Order Summary</h3>
              <p>Total Items: {totalItems}</p>
              <p>Total Amount: ₹{totalAmount}</p>

              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>

              <button className="continue-btn" onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;