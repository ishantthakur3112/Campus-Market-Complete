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
    clearCart(false);
  };

  return (
    <main className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <p className="cart-tag">Your basket</p>
          <h1>Shopping Cart</h1>
          <p className="cart-subtext">
            Review selected items before proceeding to checkout.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <h2>Your cart is empty</h2>
            <p>Add some products to continue shopping on CampusMarket.</p>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {cartItems.map((item) => (
                <div className="cart-card" key={item._id}>
                  <div className="cart-info">
                    <h3>{item.title}</h3>
                    <p>
                      Seller:{" "}
                      {item.seller?.name || item.seller || "Campus Seller"}
                    </p>
                    <span>₹{item.price}</span>
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

            <aside className="cart-summary">
              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Total Items</span>
                <span>{totalItems}</span>
              </div>

              <div className="summary-row">
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>

              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>

              <button className="clear-cart-btn" onClick={() => clearCart()}>
                Clear Cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;