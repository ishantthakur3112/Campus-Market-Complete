import "./Cart.css";
import toast from "react-hot-toast";
import { useState } from "react";
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

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty", { id: "checkout-empty" });
      return;
    }

    setShowCheckout(true);
  };

  const handlePlaceOrder = () => {
    const messages = {
      qr: "Please scan the QR code and complete payment.",
      cod: "Cash on Delivery selected.",
      meetup:
        "In-person delivery selected. Buyer and seller will meet and exchange money directly.",
    };

    toast.success(messages[paymentMethod], { id: "order-success" });
    clearCart();
    setShowCheckout(false);
    setPaymentMethod("cod");
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

              <button className="continue-btn" onClick={() => clearCart()}>
                Clear Cart
              </button>
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="checkout-panel">
            <div className="checkout-header">
              <h2>Select Payment Method</h2>
              <button
                className="close-checkout-btn"
                onClick={() => setShowCheckout(false)}
              >
                ×
              </button>
            </div>

            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="qr"
                  checked={paymentMethod === "qr"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>QR Payment</span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Cash on Delivery</span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="meetup"
                  checked={paymentMethod === "meetup"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>In-person Delivery</span>
              </label>
            </div>

            {paymentMethod === "qr" && (
              <div className="qr-box">
                <p>Scan this QR code to pay:</p>
                <img src="/qr-code.png" alt="QR Code" className="qr-image" />
              </div>
            )}

            {paymentMethod === "cod" && (
              <p className="checkout-note">
                You will pay in cash when the product is delivered.
              </p>
            )}

            {paymentMethod === "meetup" && (
              <p className="checkout-note">
                Buyer and seller will meet in person, inspect the product, and
                exchange money directly.
              </p>
            )}

            <button className="place-order-btn" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;