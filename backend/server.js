require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// Cloudinary Drivers
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here";
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://USERNAME:PASSWORD@clustername.mongodb.net/campusmarket?retryWrites=true&w=majority";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// 1. Configure allowed origins array
const allowedOrigins = [
  "http://localhost:5173",
  "https://campus-market-complete.vercel.app"
];

// 2. Express CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// 3. Cloudinary API Configuration Safeties
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// 4. Setup Robust Cloudinary Storage Engine for Multer (Fallback Functional Form)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "campus_market_listings",
      format: "jpeg", // Forces unified compression format
      public_id: "listing-" + Date.now(),
    };
  },
});

const upload = multer({ storage: storage });

// 5. Socket.io CORS Configuration (Production Synced)
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by Socket.io CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Database Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const listingSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    category: String,
    condition: String,
    image: String, // Stores secure absolute web links from Cloudinary
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Listing = mongoose.model("Listing", listingSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);
const Message = mongoose.model("Message", messageSchema);

// --- Middlewares ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// --- Socket.io Authentication Middleware ---
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = { id: decoded.id };
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// --- Socket.io Event Handling ---
io.on("connection", (socket) => {
  const userId = socket.user.id;
  socket.join(userId.toString());

  console.log(`User connected: ${userId}`);

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId.toString());
    console.log(`User ${userId} joined conversation ${conversationId}`);
  });

  socket.on("leave-conversation", (conversationId) => {
    socket.leave(conversationId.toString());
    console.log(`User ${userId} left conversation ${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
  });
});

// --- Helper Function for Cloudinary Asset Removal ---
const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    const urlParts = imageUrl.split('/');
    const folderIndex = urlParts.indexOf('campus_market_listings');
    if (folderIndex !== -1) {
      const publicIdWithExtension = urlParts.slice(folderIndex).join('/');
      const publicId = publicIdWithExtension.split('.')[0]; 
      await cloudinary.uploader.destroy(publicId);
      console.log(`Cloudinary asset destroyed successfully: ${publicId}`);
    }
  } catch (err) {
    console.error("Cloudinary asset destruction failure wrapper warning:", err.message);
  }
};

// --- API Endpoints ---

app.get("/", (req, res) => {
  res.send("CampusMarket backend running production instance with Cloudinary active");
});

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Listing Routes (With Explicit Un-Stringified Error Traps)
app.post(
  "/api/listings",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, price, category, condition } = req.body;

      const newListing = new Listing({
        title,
        description,
        price,
        category,
        condition,
        image: req.file ? req.file.path : "", 
        seller: req.user.id,
      });

      await newListing.save();

      res.status(201).json({
        message: "Listing created successfully on Cloudinary",
        listing: newListing,
      });
    } catch (error) {
      // Unrolls the error payload attributes clearly into Render logs
      console.error("--- DETAILED UPLOAD CRASH LOG ---");
      console.error("Error Message Text:", error.message || error);
      if (error.stack) console.error("Stack Trace:", error.stack);
      console.error("---------------------------------");
      
      res
        .status(500)
        .json({ message: "Failed to create listing", error: error.message || "Unknown Upload Error" });
    }
  }
);

app.get("/api/listings", async (req, res) => {
  try {
    const listings = await Listing.find()
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(listings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch listings", error: error.message });
  }
});

app.get("/api/listings/my", authMiddleware, async (req, res) => {
  try {
    const myListings = await Listing.find({ seller: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json(myListings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your listings",
      error: error.message,
    });
  }
});

app.get("/api/listings/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await Listing.findById(req.params.id).populate(
      "seller",
      "name email"
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.status(200).json(listing);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch listing", error: error.message });
  }
});

app.delete("/api/listings/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await deleteFromCloudinary(listing.image);

    await Listing.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Listing and media file deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete listing", error: error.message });
  }
});

app.put(
  "/api/listings/:id",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid listing id" });
      }

      const listing = await Listing.findById(req.params.id);

      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.seller.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not allowed" });
      }

      const { title, description, price, category, condition } = req.body;
      let updateFields = { title, description, price, category, condition };

      if (req.file) {
        updateFields.image = req.file.path; 
        await deleteFromCloudinary(listing.image);
      }

      const updatedListing = await Listing.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      );

      res
        .status(200)
        .json({
          message: "Listing updated successfully",
          listing: updatedListing,
        });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to update listing", error: error.message });
    }
  }
);

// Chat Conversation Routes
app.post("/api/chat/conversations", authMiddleware, async (req, res) => {
  try {
    const { receiverId, listingId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    const query = {
      participants: { $all: [req.user.id, receiverId] },
    };

    if (listingId) {
      query.listing = listingId;
    }

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, receiverId],
        listing: listingId || null,
      });
    }

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name email")
      .populate("listing", "title price image");

    res.status(200).json(populatedConversation);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create or fetch conversation",
      error: error.message,
    });
  }
});

app.get("/api/chat/conversations", authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "name email")
      .populate("listing", "title price image")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
});

app.get(
  "/api/chat/conversations/:conversationId/messages",
  authMiddleware,
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation id" });
      }

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const isParticipant = conversation.participants.some(
        (id) => id.toString() === req.user.id
      );

      if (!isParticipant) {
        return res.status(403).json({ message: "Not allowed" });
      }

      const messages = await Message.find({ conversation: conversationId })
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: 1 });

      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch messages",
        error: error.message,
      });
    }
  }
);

// Real-Time Messaging Endpoint
app.post("/api/chat/messages", authMiddleware, async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text || !text.trim()) {
      return res
        .status(400)
        .json({ message: "conversationId and text are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const receiverId = conversation.participants.find(
      (id) => id.toString() !== req.user.id
    );

    const trimmedText = text.trim();

    const newMessage = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      receiver: receiverId,
      text: trimmedText,
    });

    conversation.lastMessage = trimmedText;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name email")
      .populate("receiver", "name email");

    const socketMessage = {
      _id: populatedMessage._id.toString(),
      conversationId: populatedMessage.conversation.toString(),
      sender: populatedMessage.sender,
      receiver: populatedMessage.receiver,
      text: populatedMessage.text,
      createdAt: populatedMessage.createdAt,
      updatedAt: populatedMessage.updatedAt,
    };

    io.to(conversationId.toString()).emit("new-message", socketMessage);

    const conversationUpdatePayload = {
      conversationId: conversationId.toString(),
      lastMessage: trimmedText,
      createdAt: populatedMessage.createdAt,
    };

    io.to(req.user.id.toString()).emit(
      "conversation-updated",
      conversationUpdatePayload
    );
    io.to(receiverId.toString()).emit(
      "conversation-updated",
      conversationUpdatePayload
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server executing securely on port ${PORT}`);
});