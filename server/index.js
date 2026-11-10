import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import { requireAuth, optionalAuth } from './middleware/auth.js';

// Load variables from server/.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// 1. Rate Limiting (Phase 2 Requirement)
// ----------------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again in a few minutes.' }
});
app.use('/api/plan', apiLimiter);

// ----------------------------------------------------
// 2. Mongoose Database Schema & Model
// ----------------------------------------------------
const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  destination: { type: String, required: true },
  tripTitle: { type: String, required: true },
  overview: String,
  daysCount: Number,
  budgetTier: String,
  localCurrency: String,
  homeCurrency: String,
  estimatedDailyCost: String,
  estimatedDailyCostHome: String,
  packingTips: [String],
  mustTryFoods: [String],
  aiEngineUsed: String,
  days: [{
    day: Number,
    theme: String,
    dayCost: String,
    dayCostHome: String,
    morning: { activity: String, description: String, time: String, approxCost: String },
    afternoon: { activity: String, description: String, time: String, approxCost: String },
    evening: { activity: String, description: String, time: String, approxCost: String }
  }],
  savedAt: { type: Date, default: Date.now }
});

const Trip = mongoose.model('Trip', TripSchema);

// ----------------------------------------------------
// 3. Connect to Local MongoDB
// ----------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wanderai';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('🍃 SUCCESS: Connected to Local MongoDB (wanderai)!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'Connected to Local MongoDB 🍃' : 'Connecting...',
    message: 'WanderAI Multi-AI Backend is running! 🚀'
  });
});

// Helper: Fetch with timeout
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 25000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ----------------------------------------------------
// Intelligent Resilient Fallback Generator
// Ensures WanderAI NEVER fails even if third-party APIs have zero quota or timeout!
// ----------------------------------------------------
function generateFallbackItinerary({ destination, days, budget, travelWith, interests, homeCurrency = 'INR (₹)' }) {
  let localCurrency = 'USD ($)';
  let approxExchangeRate = '1 USD ≈ 86 INR';
  let dailyLocal = budget === 'Luxury' ? 350 : (budget === 'Budget' ? 60 : 150);
  let rateMultiplier = 86;

  const destLower = destination.toLowerCase();
  if (destLower.includes('japan') || destLower.includes('tokyo') || destLower.includes('kyoto') || destLower.includes('osaka')) {
    localCurrency = 'JPY (¥)';
    approxExchangeRate = '1 JPY ≈ 0.55 INR';
    rateMultiplier = 0.55;
    dailyLocal = budget === 'Luxury' ? 35000 : (budget === 'Budget' ? 7000 : 16000);
  } else if (destLower.includes('europe') || destLower.includes('paris') || destLower.includes('france') || destLower.includes('italy') || destLower.includes('rome') || destLower.includes('germany') || destLower.includes('spain')) {
    localCurrency = 'EUR (€)';
    approxExchangeRate = '1 EUR ≈ 90 INR';
    rateMultiplier = 90;
    dailyLocal = budget === 'Luxury' ? 300 : (budget === 'Budget' ? 65 : 140);
  } else if (destLower.includes('uk') || destLower.includes('london') || destLower.includes('england') || destLower.includes('scotland')) {
    localCurrency = 'GBP (£)';
    approxExchangeRate = '1 GBP ≈ 108 INR';
    rateMultiplier = 108;
    dailyLocal = budget === 'Luxury' ? 280 : (budget === 'Budget' ? 55 : 130);
  } else if (destLower.includes('india') || destLower.includes('delhi') || destLower.includes('mumbai') || destLower.includes('goa') || destLower.includes('manali') || destLower.includes('kerala')) {
    localCurrency = 'INR (₹)';
    approxExchangeRate = '1 INR = 1 INR';
    rateMultiplier = 1;
    dailyLocal = budget === 'Luxury' ? 12000 : (budget === 'Budget' ? 2000 : 5000);
  } else if (destLower.includes('dubai') || destLower.includes('uae')) {
    localCurrency = 'AED (AED)';
    approxExchangeRate = '1 AED ≈ 23.5 INR';
    rateMultiplier = 23.5;
    dailyLocal = budget === 'Luxury' ? 1200 : (budget === 'Budget' ? 250 : 550);
  } else if (destLower.includes('thailand') || destLower.includes('bangkok') || destLower.includes('phuket')) {
    localCurrency = 'THB (฿)';
    approxExchangeRate = '1 THB ≈ 2.5 INR';
    rateMultiplier = 2.5;
    dailyLocal = budget === 'Luxury' ? 8000 : (budget === 'Budget' ? 1500 : 3500);
  }

  const dailyHome = Math.round(dailyLocal * (homeCurrency.includes('INR') ? rateMultiplier : 1));

  const dayThemes = [
    { theme: 'Historic Landmarks & City Orientation', morning: 'Old Town Walking Tour & Iconic Squares', afternoon: 'Central Museum & Artisan Markets', evening: 'Scenic Sunset Promenade & Welcome Dinner' },
    { theme: 'Cultural Immersion & Local Flavors', morning: 'Heritage Temples / Castles & Coffee Tasting', afternoon: 'Local Food Alley Tour & Photography Spots', evening: 'Rooftop Lounge & Traditional Performance' },
    { theme: 'Nature, Vistas & Hidden Gems', morning: 'Botanical Gardens & Panorama Viewpoint', afternoon: 'Scenic Lake / Waterfront Cruise', evening: 'Night Bazaar Exploration & Street Food Quest' },
    { theme: 'Adventure & Countryside Excursion', morning: 'Day Trip to Mountain Overlook or Coastal Trail', afternoon: 'Traditional Craft Workshop & Village Stroll', evening: 'Cozy Fireside / Seaside Dining' },
    { theme: 'Art, Architecture & Modern Vibes', morning: 'Contemporary Art Gallery & Design District', afternoon: 'Boutique Shopping & Café Hopping', evening: 'Skyline Observatory & Cocktail Lounge' },
    { theme: 'Off-the-Beaten-Path & Leisure', morning: 'Neighborhood Flea Market & Bakery Breakfast', afternoon: 'Serene Park Relaxation & Bicycle Ride', evening: 'Farewell Gala Dinner at Renowned Bistro' },
    { theme: 'Souvenirs & Lasting Memories', morning: 'Last-minute Souvenir Shopping & Local Delicacies', afternoon: 'Iconic Bridge or Monument Revisited for Photos', evening: 'Departure Prep & Departure Toast' }
  ];

  const daysList = [];
  const numDays = Math.min(Math.max(parseInt(days) || 3, 1), 30);

  for (let i = 1; i <= numDays; i++) {
    const t = dayThemes[(i - 1) % dayThemes.length];
    const morningCostLocal = Math.round(dailyLocal * 0.25);
    const afternoonCostLocal = Math.round(dailyLocal * 0.45);
    const eveningCostLocal = Math.round(dailyLocal * 0.30);

    daysList.push({
      day: i,
      theme: `Day ${i}: ${t.theme}`,
      dayCost: `${localCurrency.split(' ')[0]}${dailyLocal}`,
      dayCostHome: `₹${dailyHome}`,
      morning: {
        activity: `${t.morning} in ${destination}`,
        description: `Explore the vibrant morning atmosphere with local guidance tailored for a ${travelWith} journey.`,
        time: '9:00 AM - 12:00 PM',
        approxCost: morningCostLocal === 0 ? 'Free' : `${localCurrency.split(' ')[0]}${morningCostLocal} (~₹${Math.round(morningCostLocal * rateMultiplier)})`
      },
      afternoon: {
        activity: `${t.afternoon}`,
        description: `Immerse in ${interests?.join(' & ') || 'culture and cuisine'} with authentic stops and top photo spots.`,
        time: '1:00 PM - 5:00 PM',
        approxCost: `${localCurrency.split(' ')[0]}${afternoonCostLocal} (~₹${Math.round(afternoonCostLocal * rateMultiplier)})`
      },
      evening: {
        activity: `${t.evening}`,
        description: `Unwind with regional delicacies and evening views perfectly suited for your ${budget.toLowerCase()} budget.`,
        time: '6:30 PM - 9:30 PM',
        approxCost: `${localCurrency.split(' ')[0]}${eveningCostLocal} (~₹${Math.round(eveningCostLocal * rateMultiplier)})`
      }
    });
  }

  return {
    destination,
    localCurrency,
    homeCurrency,
    approxExchangeRate,
    tripTitle: `${budget} ${travelWith} Odyssey in ${destination}`,
    overview: `Experience the finest highlights of ${destination} curated for a ${budget.toLowerCase()} ${travelWith.toLowerCase()} getaway with a focus on ${interests?.join(', ') || 'sights, cuisine, and culture'}.`,
    estimatedDailyCost: `${localCurrency.split(' ')[0]}${dailyLocal} / day`,
    estimatedDailyCostHome: `₹${dailyHome} / day`,
    packingTips: [
      'Universal power adapter & portable power bank',
      'Comfortable walking shoes for cobblestones & nature trails',
      'Weather-appropriate layered clothing & compact umbrella',
      'RFID-blocking daypack and digital passport copies'
    ],
    mustTryFoods: [
      `Signature ${destination} traditional specialty`,
      'Local street market delicacy & savory pastries',
      'Fresh regional roasted coffee or signature artisanal tea',
      'Handcrafted local dessert & seasonal confectionery'
    ],
    days: daysList
  };
}

// ----------------------------------------------------
// 4. Multi-AI Plan Route: POST /api/plan
// ----------------------------------------------------
app.post('/api/plan', async (req, res) => {
  try {
    const { destination, days, budget = 'Moderate', travelWith = 'Solo', interests, homeCurrency = 'INR (₹)' } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required.' });
    }

    const xkiroKey = process.env.XKIRO_API_KEY?.trim();
    const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    const prompt = `
Generate a ${days}-day travel itinerary for "${destination}" in pure JSON format.

Parameters:
- Destination: ${destination}
- Duration: ${days} days
- Budget Tier: ${budget}
- Traveling With: ${travelWith}
- Interests: ${interests?.join(', ') || 'Culture, Food, Sights'}
- Home Currency: ${homeCurrency}

Requirements:
1. Provide all costs in both the destination's LOCAL currency and the traveler's HOME currency (${homeCurrency}).
2. Provide morning, afternoon, and evening plans for each of the ${days} days.
3. Do NOT write calendar dates, days of the week, or months (e.g. no 'March 15', no 'Monday', no specific dates). Use ONLY relative day numbers: Day 1, Day 2, Day 3... so the itinerary is completely timeless.
4. Respond ONLY with a valid JSON object matching this schema:

{
  "destination": "${destination}",
  "localCurrency": "Symbol and code, e.g. ¥ JPY or € EUR",
  "homeCurrency": "${homeCurrency}",
  "approxExchangeRate": "e.g. 1 JPY ≈ 0.55 INR",
  "tripTitle": "Catchy title",
  "overview": "2-3 sentences overview",
  "estimatedDailyCost": "Daily cost in local currency, e.g. ¥12,000",
  "estimatedDailyCostHome": "Daily cost in home currency, e.g. ₹6,600",
  "packingTips": ["item 1", "item 2", "item 3", "item 4"],
  "mustTryFoods": ["food 1", "food 2", "food 3", "food 4"],
  "days": [
    {
      "day": 1,
      "theme": "Day theme",
      "dayCost": "Local total, e.g. ¥15,000",
      "dayCostHome": "Home total, e.g. ₹8,250",
      "morning": {
        "activity": "Activity name",
        "description": "Short description",
        "time": "9:00 AM - 12:00 PM",
        "approxCost": "Local & home cost or 'Free'"
      },
      "afternoon": {
        "activity": "Activity name",
        "description": "Short description",
        "time": "1:00 PM - 5:00 PM",
        "approxCost": "Local & home cost"
      },
      "evening": {
        "activity": "Activity name",
        "description": "Activity name",
        "time": "6:30 PM - 9:30 PM",
        "approxCost": "Local & home cost"
      }
    }
  ]
}
`;

    let itinerary = null;
    let engineUsed = '';

    // ==========================================
    // 1. Try xKiro AI Gateway
    // ==========================================
    if (xkiroKey) {
      try {
        console.log(`[Backend] ⚡ Calling xKiro Gateway for ${destination}...`);

        const xkiroRes = await fetchWithTimeout('https://api.xkiro.com/v1/chat/completions', {
          method: 'POST',
          timeout: 20000,
          headers: {
            'Authorization': `Bearer ${xkiroKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are an expert travel assistant. You must respond ONLY with valid JSON matching the requested schema. No conversational text, no markdown backticks.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
          })
        });

        if (xkiroRes.ok) {
          const xkiroData = await xkiroRes.json();
          const raw = xkiroData.choices?.[0]?.message?.content?.trim();
          const firstBrace = raw?.indexOf('{');
          const lastBrace = raw?.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            itinerary = JSON.parse(raw.substring(firstBrace, lastBrace + 1));
            engineUsed = 'xKiro Gateway (DeepSeek)';
            console.log(`[Backend] ✅ xKiro successfully generated itinerary!`);
          }
        } else {
          console.warn(`[Backend] ⚠️ xKiro returned status ${xkiroRes.status}`);
        }
      } catch (xkErr) {
        console.warn(`[Backend] ⚠️ xKiro attempt failed: ${xkErr.message}`);
      }
    }

    // ==========================================
    // 2. Try DeepSeek Direct
    // ==========================================
    if (!itinerary && deepseekKey) {
      try {
        console.log(`[Backend] 🐋 Calling DeepSeek Direct for ${destination}...`);

        const deepseekRes = await fetchWithTimeout('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          timeout: 20000,
          headers: {
            'Authorization': `Bearer ${deepseekKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are an expert travel assistant. You must respond ONLY with valid JSON matching the requested schema. No conversational text, no markdown backticks.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
          })
        });

        if (deepseekRes.ok) {
          const deepseekData = await deepseekRes.json();
          const raw = deepseekData.choices?.[0]?.message?.content?.trim();
          const firstBrace = raw?.indexOf('{');
          const lastBrace = raw?.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            itinerary = JSON.parse(raw.substring(firstBrace, lastBrace + 1));
            engineUsed = 'DeepSeek (V3)';
            console.log(`[Backend] ✅ DeepSeek successfully generated itinerary!`);
          }
        } else {
          console.warn(`[Backend] ⚠️ DeepSeek error (${deepseekRes.status})`);
        }
      } catch (dsErr) {
        console.warn(`[Backend] ⚠️ DeepSeek attempt failed: ${dsErr.message}`);
      }
    }

    // ==========================================
    // 3. Try Groq LLaMA 3.1
    // ==========================================
    if (!itinerary && groqKey) {
      try {
        console.log(`[Backend] 🚀 Calling Groq LLaMA 3.1 for ${destination}...`);

        const groqRes = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          timeout: 15000,
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are a travel assistant that outputs exclusively valid JSON matching the schema. No markdown.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 3000
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const raw = groqData.choices?.[0]?.message?.content?.trim();
          const firstBrace = raw?.indexOf('{');
          const lastBrace = raw?.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            itinerary = JSON.parse(raw.substring(firstBrace, lastBrace + 1));
            engineUsed = 'Groq (LLaMA 3.1)';
            console.log(`[Backend] ✅ Groq successfully returned itinerary!`);
          }
        } else {
          console.warn(`[Backend] ⚠️ Groq error (${groqRes.status})`);
        }
      } catch (groqErr) {
        console.warn(`[Backend] ⚠️ Groq call failed: ${groqErr.message}`);
      }
    }

    // ==========================================
    // 4. Try Google Gemini Fallback
    // ==========================================
    if (!itinerary && geminiKey && !geminiKey.includes('your_actual_key')) {
      try {
        console.log(`[Backend] 🤖 Calling Google Gemini fallback for ${destination}...`);
        
        let endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
        const headers = { 'Content-Type': 'application/json' };

        if (geminiKey.startsWith('AIza')) {
          endpoint += `?key=${geminiKey}`;
        } else {
          headers['Authorization'] = `Bearer ${geminiKey}`;
        }

        const geminiRes = await fetchWithTimeout(endpoint, {
          method: 'POST',
          timeout: 15000,
          headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawJson = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          const firstBrace = rawJson?.indexOf('{');
          const lastBrace = rawJson?.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            itinerary = JSON.parse(rawJson.substring(firstBrace, lastBrace + 1));
            engineUsed = 'Google Gemini (Flash)';
            console.log(`[Backend] ✅ Gemini successfully returned itinerary!`);
          }
        }
      } catch (geminiErr) {
        console.error(`[Backend] Gemini attempt failed:`, geminiErr.message);
      }
    }

    // ==========================================
    // 5. Intelligent Resilient Fallback Engine
    // Activates if third-party keys are rate-limited or have zero balance!
    // ==========================================
    if (!itinerary) {
      console.log(`[Backend] 🛡️ Activating WanderAI Resilient Engine for ${destination}...`);
      itinerary = generateFallbackItinerary({
        destination,
        days,
        budget,
        travelWith,
        interests,
        homeCurrency
      });
      engineUsed = 'WanderAI Resilient Engine';
    }

    itinerary.aiEngineUsed = engineUsed;
    res.json({ success: true, itinerary });

  } catch (err) {
    console.error('[Plan Route Error]:', err.message);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// ----------------------------------------------------
// 5. User Authentication Routes (JWT + bcryptjs)
// ----------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'wanderai_super_secret_jwt_key_2026';

// POST /api/auth/register — Register new traveler
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`[Auth] 👤 New user registered: ${user.name} (${user.email})`);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('[Register Error]:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login — Authenticate existing traveler
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`[Auth] 🔑 User logged in: ${user.name} (${user.email})`);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('[Login Error]:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me — Verify token and get profile
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify session.' });
  }
});

// ----------------------------------------------------
// 6. Database CRUD Routes (MongoDB)
// ----------------------------------------------------

// GET /api/trips — Retrieve saved trips from MongoDB (isolated to logged-in user or guest trips)
app.get('/api/trips', optionalAuth, async (req, res) => {
  try {
    const filter = req.user 
      ? { $or: [{ userId: req.user.id }, { userId: null }] } 
      : {};
    const trips = await Trip.find(filter).sort({ savedAt: -1 });
    const formatted = trips.map(t => ({ id: t._id.toString(), ...t.toObject() }));
    res.json({ success: true, trips: formatted });
  } catch (err) {
    console.error('[DB Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve saved trips.' });
  }
});

// POST /api/trips — Save an itinerary to MongoDB (links to user if logged in)
app.post('/api/trips', optionalAuth, async (req, res) => {
  try {
    const { itinerary } = req.body;
    if (!itinerary) {
      return res.status(400).json({ error: 'Itinerary payload is required.' });
    }

    const newTrip = new Trip({
      userId: req.user ? req.user.id : null,
      destination: itinerary.destination,
      tripTitle: itinerary.tripTitle,
      overview: itinerary.overview,
      daysCount: itinerary.days?.length || 1,
      budgetTier: itinerary.budget || 'Moderate',
      localCurrency: itinerary.localCurrency,
      homeCurrency: itinerary.homeCurrency,
      estimatedDailyCost: itinerary.estimatedDailyCost,
      estimatedDailyCostHome: itinerary.estimatedDailyCostHome,
      packingTips: itinerary.packingTips || [],
      mustTryFoods: itinerary.mustTryFoods || [],
      aiEngineUsed: itinerary.aiEngineUsed || 'Dual-AI',
      days: itinerary.days || []
    });
    const saved = await newTrip.save();
    console.log(`[MongoDB] 💾 Persisted trip for ${req.user ? req.user.name : 'Guest'}: ${saved.destination} (ID: ${saved._id})`);
    res.json({ success: true, savedTrip: saved });
  } catch (err) {
    console.error('[DB Save Error]:', err);
    res.status(500).json({ error: 'Failed to save trip to MongoDB.' });
  }
});

// DELETE /api/trips/:id — Delete a trip by ID
app.delete('/api/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Trip.findByIdAndDelete(id);
    res.json({ success: true, message: 'Trip deleted successfully.' });
  } catch (err) {
    console.error('[DB Delete Error]:', err);
    res.status(500).json({ error: 'Failed to delete trip.' });
  }
});

// ----------------------------------------------------
// 7. Start Express Server
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 WanderAI Multi-AI Server running on http://localhost:${PORT}`);
  console.log(`========================================\n`);
});
