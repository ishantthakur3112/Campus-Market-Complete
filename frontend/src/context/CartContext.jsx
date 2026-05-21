import { createContext, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    let wasExisting = false;

    setCartItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);

      if (existing) {
        wasExisting = true;
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });

    if (wasExisting) {
      toast.success(`Increased quantity for ${product.title}`, {
        id: `cart-add-${product._id}`,
      });
    } else {
      toast.success(`${product.title} added to cart`, {
        id: `cart-add-${product._id}`,
      });
    }
  };

  const removeFromCart = (id) => {
    const itemToRemove = cartItems.find((item) => item._id === id);

    setCartItems((prev) => prev.filter((item) => item._id !== id));

    if (itemToRemove) {
      toast.success(`${itemToRemove.title} removed from cart`, {
        id: `cart-remove-${id}`,
      });
    }
  };

  const increaseQty = (id) => {
    const itemToIncrease = cartItems.find((item) => item._id === id);

    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );

    if (itemToIncrease) {
      toast.success(`Increased quantity for ${itemToIncrease.title}`, {
        id: `cart-increase-${id}`,
      });
    }
  };

  const decreaseQty = (id) => {
    const itemToDecrease = cartItems.find((item) => item._id === id);

    if (!itemToDecrease) return;

    if (itemToDecrease.quantity === 1) {
      setCartItems((prev) => prev.filter((item) => item._id !== id));
      toast.success(`${itemToDecrease.title} removed from cart`, {
        id: `cart-decrease-remove-${id}`,
      });
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity - 1 } : item
      )
    );

    toast.success(`Decreased quantity for ${itemToDecrease.title}`, {
      id: `cart-decrease-${id}`,
    });
  };

  const clearCart = (showToast = true) => {
    if (cartItems.length === 0) {
      if (showToast) {
        toast.error("Cart is already empty", { id: "cart-empty" });
      }
      return;
    }

    setCartItems([]);

    if (showToast) {
      toast.success("Cart cleared successfully", { id: "cart-clear" });
    }
  };

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      ),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}