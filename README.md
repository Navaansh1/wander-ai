# 🌍 WanderAI — Smart Full-Stack AI Travel Companion

<p align="center">
  <img src="public/logo.jpg" alt="WanderAI Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />
</p>

<p align="center">
  <strong>An intelligent, context-aware full-stack travel companion curating dynamic multi-day itineraries, interactive street-level route maps with Google Maps directions, real-time local budget tracking, and atmospheric destination visuals.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/MongoDB-Local_%26_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
</p>

---

## 📌 Project Overview
**WanderAI** is an advanced full-stack travel engineering platform developed as a **B.Tech Capstone Project** at **J.C. Bose University of Science and Technology, YMCA, Faridabad** under the supervision of **Dr. Harish**.

Unlike static travel blogs or generic chat-based LLM outputs, WanderAI solves real travel friction:
1. **Visual Atmosphere Matching**: Automatically crossfades high-definition natural photography matching your destination (35+ curated presets with dynamic global fallback).
2. **Turn-by-Turn Navigation**: Direct Google Maps routing links integrated into every morning, afternoon, and evening activity slot.
3. **Realistic Local Cost Calculation**: Accurate multi-currency daily estimates with a 15% real-world travel buffer and interactive in-place budget editing.
4. **Flexible Multi-Day Planning (1–30 Days)**: Timeless relative day progression (`Day 1`, `Day 2`...) with zero calendar restrictions.
5. **Private Data Persistence**: Full authentication system (JWT + bcryptjs) with itineraries stored securely in MongoDB.

---

## ✨ Key Features

### 🎨 1. Dynamic Atmosphere & Photography
- **Zero-Tint Natural Visuals**: High-resolution photography of global destinations (Paris, Kyoto, Bali, Swiss Alps, etc.) that adapt dynamically as you search.
- **Color-Harmonized Themes**: Headings and interface accents harmonize with the destination's natural lighting (warm sunset gold for Paris/Rome, sakura blossom for Tokyo, glacial cyan for the Alps).
- **5 Distinct Daily Travel Chapters**:
  - `Day 1` — Sunset Amber & Gold
  - `Day 2` — Coastal Azure & Cyan
  - `Day 3` — Island Emerald & Jade
  - `Day 4` — Sakura Rose & Coral
  - `Day 5` — Deep Twilight Violet

### 🗺️ 2. Interactive Route Map with Turn-by-Turn Directions
- **Esri World Street Map Tiles**: 100% English street names and landmark labels with zero commercial watermarks.
- **Live Destination Geocoding**: Pins dynamically geocoded to actual destination coordinates.
- **One-Click Navigation**: Every marker popup and timeline slot features direct `🗺️ Google Maps Directions →` links ready for mobile and desktop routing.

### 💰 3. Live Budget & Expense Tracker
- **No False Over-Budget Alerts**: Starts clean at 0 spent and tracks real traveler entries.
- **Intelligent Cost Parsing**: Automatically extracts realistic cost bounds from destination pricing models.
- **Inline Budget Adjuster**: Edit your target trip budget directly using the pencil icon `✏️`.
- **Currency Normalization**: Displays local currency side-by-side with your home currency (INR, USD, EUR, GBP, JPY, CAD, AUD).

### 🔍 4. Enhanced Search Bar
- **Instant Autocomplete**: Live suggestions for trending destinations with country flags, category chips, and badges.
- **One-Click Clear**: Instant `✕` reset button.
- **🎲 Surprise Me Generator**: Discovers unexpected travel destinations with a single tap.

### 🔐 5. Full-Stack User Authentication & Saved Trips
- **JWT Authentication**: User registration and login protected with salted `bcryptjs` hashing.
- **Travel Passport Drawer**: View, reload, and manage your saved itineraries directly from MongoDB.
- **Printable Travel Guide**: One-click printable PDF booklet with clean ink-friendly print stylesheets.

---

## 🏗️ System Architecture

```
wander-ai/
├── public/                     # Static travel assets & brand logos
│   ├── bg.jpg                  # Default high-res landscape
│   └── logo.jpg                # WanderAI identity logo
├── src/                        # Frontend (React 18 + Vite + Tailwind CSS)
│   ├── components/             # Reusable modular UI components
│   │   ├── AuthModal.jsx       # Login & Register modal (JWT)
│   │   ├── BudgetTracker.jsx   # Dynamic expense manager & currency converter
│   │   └── TripMap.jsx         # Interactive Leaflet map with English Esri tiles
│   ├── services/               # Frontend service layer
│   │   ├── auth.js             # Authentication & session token management
│   │   ├── destinations.js     # Curated HD photography & dynamic color harmonizer
│   │   └── gemini.js           # API client for backend communication
│   ├── App.jsx                 # Core application controller & centered layout
│   └── index.css               # Tailwind styling & print stylesheet
├── server/                     # Backend (Node.js + Express + MongoDB)
│   ├── models/
│   │   └── User.js             # Mongoose traveler schema (bcrypt hashed passwords)
│   ├── middleware/
│   │   └── auth.js             # JWT bearer verification middleware
│   ├── index.js                # Express API server, Gemini AI logic & rate limiter
│   └── .env.example            # Environment variable template
├── .env.example                # Frontend environment template
├── .gitignore                  # Git privacy rules (protects API keys)
└── package.json                # Project dependencies
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local Community Server or MongoDB Atlas)
- Google Gemini API Key (from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/Navaansh1/wander-ai.git
cd wander-ai
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment Variables
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/wanderai
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_key_2026
```

### 4. Run the Application
In your first terminal, start the **Express Backend**:
```bash
cd server
npm start
```

In your second terminal, start the **Vite Frontend**:
```bash
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/plan` | Generate AI itinerary & local financial estimates | Optional |
| `POST` | `/api/auth/register` | Register new traveler profile | No |
| `POST` | `/api/auth/login` | Authenticate existing traveler (returns JWT) | No |
| `GET` | `/api/auth/me` | Verify active session & retrieve profile | Yes (Bearer) |
| `GET` | `/api/trips` | Fetch saved trips from MongoDB | Optional |
| `POST` | `/api/trips` | Persist itinerary to MongoDB | Optional |
| `DELETE` | `/api/trips/:id` | Delete saved itinerary by ID | No |

---

## 🎓 Academic Attribution
- **Institution**: J.C. Bose University of Science and Technology, YMCA, Faridabad
- **Degree**: Bachelor of Technology (B.Tech)
- **Project Title**: WanderAI — Smart Full-Stack AI Travel Companion
- **Supervisor**: Dr. Harish
- **Developer**: Navaansh

---

<p align="center">
  Crafted with passion for curious travelers worldwide ✈️
</p>
