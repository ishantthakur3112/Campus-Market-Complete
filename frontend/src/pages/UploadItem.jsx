import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// IMPORT YOUR CUSTOM AXIOS INSTANCE
import api from "../config/api"; 

import "./UploadItem.css";

const initialFormData = {
  title: "",
  category: "",
  price: "",
  condition: "",
  description: "",
  location: "",
  contact: "",
  image: null,
};

function UploadItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login first");
      setTimeout(() => {
        navigate("/login");
      }, 800);
      return;
    }

    try {
      setLoading(true);

      const uploadPromise = async () => {
        const uploadData = new FormData();
        uploadData.append("title", formData.title);
        uploadData.append("category", formData.category);
        uploadData.append("price", formData.price);
        uploadData.append("condition", formData.condition);
        uploadData.append("description", formData.description);
        uploadData.append("location", formData.location);
        uploadData.append("contact", formData.contact);

        if (formData.image) {
          uploadData.append("image", formData.image);
        }

        // CHANGED: Using unified api handler instance.
        // It appends your headers automatically and signals your cold-start backdrop spinner.
        const res = await api.post("/api/listings", uploadData);

        return res.data;
      };

      await toast.promise(uploadPromise(), {
        loading: "Uploading your item...",
        success: "Item uploaded successfully!",
        error: (err) => err.response?.data?.message || "Server error while uploading item",
      });

      setFormData(initialFormData);

      setTimeout(() => {
        navigate("/my-uploads");
      }, 800);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <p className="upload-tag">Sell on campus</p>
          <h1>Upload a new item</h1>
          <p className="upload-subtext">
            Add details about your product so other students can discover it
            easily and contact you for purchase.
          </p>
        </div>

        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Item title</label>
              <input
                type="text"
                name="title"
                placeholder="Enter item title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                <option value="Books">Books</option>
                <option value="Notes">Notes</option>
                <option value="Electronics">Elect Electronics</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Hostel Essentials">Hostel Essentials</option>
              </select>
            </div>

            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                name="price"
                placeholder="Enter price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Condition</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
              >
                <option value="">Select condition</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Used">Used</option>
                <option value="Old">Old</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Write a short description about the item"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Hostel Block A"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Contact number</label>
              <input
                type="text"
                name="contact"
                placeholder="Enter contact number"
                value={formData.contact}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Upload image</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="upload-btn" disabled={loading}>
            {loading ? "Uploading..." : "Upload Item"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default UploadItem;