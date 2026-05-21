import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import React, { useEffect } from "react";

// Import your custom loading configuration modules
import { LoadingProvider, useLoading } from "./context/LoadingContext";
import api, { attachLoadingInterceptor } from "./config/api";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UploadItem from "./pages/UploadItem";
import MyUploads from "./pages/MyUploads";
import Cart from "./pages/Cart";
import ProtectedRoute from "./components/ProtectedRoute";
import EditListing from "./pages/EditListing";
import ChatPage from "./pages/ChatPage";
import ProductDetails from "./pages/ProductDetails";
import ScrollToTop from "./components/ScrollToTop";

// Inner shell execution layer to map the runtime context accurately
function AppContent() {
  const { setIsLoading } = useLoading();

  useEffect(() => {
    // Links your Axios network instances with the global loading UI context
    attachLoadingInterceptor(setIsLoading);
  }, [setIsLoading]);

  return (
    <BrowserRouter>
      <ScrollToTop />

      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadItem />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-uploads"
          element={
            <ProtectedRoute>
              <MyUploads />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-listing/:id"
          element={
            <ProtectedRoute>
              <EditListing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Footer />

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(16, 28, 43, 0.96)",
            color: "#f8fbff",
            border: "1px solid rgba(124, 236, 255, 0.16)",
            borderRadius: "14px",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)",
            backdropFilter: "blur(10px)",
            padding: "14px 16px",
            fontWeight: "600",
          },
          success: {
            iconTheme: {
              primary: "#19d7ff",
              secondary: "#04101b",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff7c8f",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

// Master context definition layout wrapping the application
function App() {
  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
}

export default App;