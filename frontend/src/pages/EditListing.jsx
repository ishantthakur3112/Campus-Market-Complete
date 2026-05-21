import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config/api";
import "./EditListing.css";

function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
  });

  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const redirectWithDelay = (path, delay = 800) => {
    setTimeout(() => navigate(path), delay);
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listings`);
        
        // Safely check if response is JSON before parsing
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server returned a non-JSON response");
        }

        const data = await res.json();
        const item = data.find((product) => product._id === id);

        if (!item) {
          toast.error("Listing not found");
          redirectWithDelay("/my-uploads");
          return;
        }

        setFormData({
          title: item.title || "",
          description: item.description || "",
          price: item.price || "",
          category: item.category || "",
          condition: item.condition || "",
        });

        setCurrentImage(item.image || "");
      } catch (error) {
        console.error("Fetch listing error:", error);
        toast.error("Failed to load listing");
        redirectWithDelay("/my-uploads");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login first");
      redirectWithDelay("/login");
      return;
    }

    try {
      setUpdating(true);

      const updatePromise = async () => {
        const submitData = new FormData();

        submitData.append("title", formData.title);
        submitData.append("description", formData.description);
        submitData.append("price", formData.price);
        submitData.append("category", formData.category);
        submitData.append("condition", formData.condition);

        if (image) {
          submitData.append("image", image);
        }

        const res = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: submitData,
        });

        // Safely check if response is JSON before parsing to prevent crash
        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            throw new Error(`Server error: ${res.status}`);
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to update listing");
        }

        return data;
      };

      await toast.promise(updatePromise(), {
        loading: "Updating listing...",
        success: "Listing updated successfully!",
        error: (err) => err.message || "Server error while updating listing",
      });

      redirectWithDelay("/my-uploads");
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setUpdating(false);
    }
  };

  const previewImage = image
    ? URL.createObjectURL(image)
    : currentImage
    ? currentImage.startsWith("http")
      ? currentImage
      : `${API_BASE_URL}${currentImage}`
    : "";

  if (loading) {
    return <h2 className="edit-loading">Loading listing...</h2>;
  }

  return (
    <main className="edit-page">
      <div className="edit-container">
        <div className="edit-header">
          <p className="edit-tag">Update listing</p>
          <h1>Edit your listing</h1>
          <p className="edit-subtext">
            Update the details of your product and save changes so buyers can
            see the latest information.
          </p>
        </div>

        <div className="edit-card">
          <form className="edit-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Item Title</label>
              <input
                id="title"
                type="text"
                name="title"
                placeholder="Enter item title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Write a short description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price</label>
                <input
                  id="price"
                  type="number"
                  name="price"
                  placeholder="Price in ₹"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Books">Books</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Notes">Notes</option>
                  <option value="Lab Equipment">Lab Equipment</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
              >
                <option value="">Select condition</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Used">Used</option>
              </select>
            </div>

            <div className="image-preview-wrap">
              <p className="image-preview-label">Product image</p>

              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Listing preview"
                  className="image-preview"
                />
              ) : (
                <div className="image-preview empty-preview">
                  No image selected
                </div>
              )}

              <div className="form-group">
                <label htmlFor="image">Upload new image</label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              <p className="file-note">
                Choose a new image only if you want to replace the current one.
              </p>
            </div>

            <div className="edit-actions">
              <button
                type="button"
                className="cancel-edit-btn"
                onClick={() => navigate("/my-uploads")}
                disabled={updating}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-edit-btn"
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Listing"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default EditListing;