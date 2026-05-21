import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config/api";
import "./MyUploads.css";

function MyUploads() {
  const navigate = useNavigate();
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const redirectWithDelay = (path, delay = 800) => {
    setTimeout(() => navigate(path), delay);
  };

  useEffect(() => {
    const fetchMyUploads = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Please login first");
          setLoading(false);
          redirectWithDelay("/login");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/listings/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch your uploads");
        }

        setMyItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Fetch my uploads error:", error);
        toast.error(error.message || "Server error while fetching your uploads");
      } finally {
        setLoading(false);
      }
    };

    fetchMyUploads();
  }, [navigate]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login first");
        redirectWithDelay("/login");
        return;
      }

      const deletePromise = async () => {
        const res = await fetch(
          `${API_BASE_URL}/api/listings/${deleteTarget._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to delete listing");
        }

        return data;
      };

      await toast.promise(deletePromise(), {
        loading: "Deleting listing...",
        success: "Listing deleted successfully!",
        error: (err) => err.message || "Server error while deleting listing",
      });

      setMyItems((prev) =>
        prev.filter((item) => item._id !== deleteTarget._id)
      );
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (loading) {
    return <h2 className="uploads-loading">Loading your uploaded items...</h2>;
  }

  return (
    <>
      <main className="uploads-page">
        <div className="uploads-container">
          <div className="uploads-header">
            <p className="uploads-tag">Seller dashboard</p>
            <h1>My Uploads</h1>
            <p className="uploads-subtext">
              Track and manage all products you have posted for sale.
            </p>
          </div>

          {myItems.length === 0 ? (
            <div className="uploads-empty">
              <h2>No uploads yet</h2>
              <p>You have not uploaded any product yet.</p>
            </div>
          ) : (
            <div className="uploads-list">
              {myItems.map((item) => {
                const imageUrl = item.image
                  ? item.image.startsWith("http")
                    ? item.image
                    : `${API_BASE_URL}${item.image}`
                  : "";

                return (
                  <div className="upload-card" key={item._id}>
                    <div className="upload-info">
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="upload-image"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}

                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <p>Category: {item.category}</p>
                      <p>Condition: {item.condition}</p>
                      <span className="upload-price">₹{item.price}</span>
                    </div>

                    <div className="upload-meta">
                      <div className="status-badge">Active</div>
                      <p>
                        Posted:{" "}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    <div className="upload-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => navigate(`/edit-listing/${item._id}`)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => setDeleteTarget(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {deleteTarget && (
        <div
          className="delete-modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete listing?</h3>
            <p>
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>?
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={handleDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MyUploads;