# Campus Marketplace

A full-stack campus marketplace web app where students can buy and sell items within the college community.

## Features
- User authentication
- Add, edit, and delete listings
- Browse products by category
- Search and filter items
- Responsive design for mobile and desktop

## Tech Stack
- React
- Node.js
- Express
- MongoDB
- JavaScript

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/ishantthakur3112/campus-marketplace-live.git
cd campus-marketplace-live
```

### 2. Install dependencies
If frontend and backend are separate:
```bash
cd frontend
npm install
cd ../backend
npm install
```

### 3. Environment variables
Create a `.env` file in the backend folder and add your values:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

### 4. Run the project
If you have separate frontend and backend scripts:
```bash
# backend
cd backend
npm run dev

# frontend
cd ../frontend
npm run dev
```

## Folder Structure
```bash
frontend/
backend/
```

## Future Improvements
- Wishlist
- Chat between buyer and seller
- Image upload support
- Admin dashboard
