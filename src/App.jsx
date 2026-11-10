import React, { useState, useEffect } from 'react';
import { 
  Compass, MapPin, Calendar, DollarSign, Users, Sparkles, 
  Clock, Coffee, Utensils, Moon, CheckCircle, AlertCircle, Loader2, 
  Globe, Bookmark, Trash2, Check, Share2, Printer, ArrowRight 
} from 'lucide-react';
import { 
  generateItinerary, 
  saveTripToDatabase, 
  fetchSavedTrips, 
  deleteTripFromDatabase 
} from './services/gemini';
import TripMap from './components/TripMap';
import BudgetTracker from './components/BudgetTracker';
import AuthModal from './components/AuthModal';
import { getDestinationBackground, resolveAnyDestinationImage, getDestinationTheme } from './services/destinations';
import { getStoredUser, fetchCurrentUser, logoutUser } from './services/auth';

const POPULAR_DESTINATIONS = [
  { name: 'Kyoto, Japan', category: 'Temples & Sakura', badge: '⛩️' },
  { name: 'Paris, France', category: 'Romance & Culture', badge: '🥐' },
  { name: 'Bali, Indonesia', category: 'Tropical Beaches', badge: '🌴' },
  { name: 'Swiss Alps, Switzerland', category: 'Snow & Mountains', badge: '🏔️' },
  { name: 'Dubai, UAE', category: 'Modern Luxury', badge: '✨' },
  { name: 'Rome, Italy', category: 'Colosseum & History', badge: '🏛️' },
  { name: 'Goa, India', category: 'Coast & Sunshine', badge: '🏖️' },
  { name: 'Santorini, Greece', category: 'Sunsets & Aegean', badge: '🇬🇷' },
  { name: 'Tokyo, Japan', category: 'Cyberpunk & Cuisine', badge: '🗼' },
  { name: 'Manali, India', category: 'Himalayan Escape', badge: '❄️' },
  { name: 'London, UK', category: 'Heritage & Thames', badge: '🇬🇧' },
  { name: 'New York, USA', category: 'Manhattan Skyline', badge: '🗽' },
  { name: 'Agra, India', category: 'Taj Mahal Monument', badge: '🕌' },
  { name: 'Barcelona, Spain', category: 'Gothic & Architecture', badge: '🇪🇸' }
];

export default function App() {
  // Form State
  const [destination, setDestination] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState('Moderate');
  const [travelWith, setTravelWith] = useState('Solo');
  const [selectedInterests, setSelectedInterests] = useState(['Foodie', 'Culture']);
  const [homeCurrency, setHomeCurrency] = useState('INR (₹)');

  const handleSurpriseMe = () => {
    const random = POPULAR_DESTINATIONS[Math.floor(Math.random() * POPULAR_DESTINATIONS.length)];
    setDestination(random.name);
    setShowSuggestions(false);
  };

  const filteredSuggestions = destination.trim()
    ? POPULAR_DESTINATIONS.filter(item => 
        item.name.toLowerCase().includes(destination.toLowerCase()) || 
        item.category.toLowerCase().includes(destination.toLowerCase())
      )
    : POPULAR_DESTINATIONS.slice(0, 6);

  // Auth State
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  // App UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [activeDayTab, setActiveDayTab] = useState('all');
  const [checkedPacking, setCheckedPacking] = useState({});
  const [copied, setCopied] = useState(false);

  // Database / Saved Trips State
  const [savedTrips, setSavedTrips] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    });
    loadSavedTrips();
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    loadSavedTrips();
  };

  const loadSavedTrips = async () => {
    try {
      const trips = await fetchSavedTrips();
      setSavedTrips(trips);
    } catch (err) {
      console.warn('Backend offline:', err.message);
    }
  };

  const handleSaveTrip = async () => {
    if (!itinerary) return;
    try {
      await saveTripToDatabase(itinerary);
      setIsSaved(true);
      loadSavedTrips();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert('Error saving trip: ' + err.message);
    }
  };

  const handleDeleteTrip = async (id) => {
    try {
      await deleteTripFromDatabase(id);
      loadSavedTrips();
    } catch (err) {
      alert('Error deleting trip: ' + err.message);
    }
  };

  const togglePackingItem = (idx) => {
    setCheckedPacking(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopySummary = () => {
    if (!itinerary) return;
    const summary = `🌍 ${itinerary.tripTitle} (${itinerary.destination})\n` +
      `⏱️ Duration: ${itinerary.days?.length} Days | Budget: ${itinerary.estimatedDailyCost}/day\n\n` +
      itinerary.days?.map(d => `Day ${d.day}: ${d.theme}\n- Morning: ${d.morning?.activity}\n- Afternoon: ${d.afternoon?.activity}\n- Evening: ${d.evening?.activity}`).join('\n\n');
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const interestOptions = [
    '🏛️ Culture', '🍜 Foodie', '🧗 Adventure', 
    '🌲 Nature', '🏖️ Relaxation', '🍸 Nightlife',
    '📸 Photography', '🛍️ Shopping'
  ];

  const budgetOptions = [
    { label: 'Budget', desc: 'Hostels & street bites', icon: '💵' },
    { label: 'Moderate', desc: 'Boutiques & dining', icon: '💳' },
    { label: 'Luxury', desc: '5-star & fine cuisine', icon: '💎' }
  ];

  const companionOptions = [
    { label: 'Solo', icon: '🎒' },
    { label: 'Couple', icon: '💑' },
    { label: 'Family', icon: '👨‍👩‍👧' },
    { label: 'Friends', icon: '🎉' }
  ];

  const currencyOptions = [
    { code: 'INR (₹)', label: 'INR - Indian Rupee (₹)' },
    { code: 'USD ($)', label: 'USD - US Dollar ($)' },
    { code: 'EUR (€)', label: 'EUR - Euro (€)' },
    { code: 'GBP (£)', label: 'GBP - British Pound (£)' },
    { code: 'CAD ($)', label: 'CAD - Canadian Dollar ($)' },
    { code: 'AUD ($)', label: 'AUD - Australian Dollar ($)' },
    { code: 'AED (AED)', label: 'AED - UAE Dirham (AED)' }
  ];

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError('Please enter a destination.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setActiveDayTab('all');
      setCheckedPacking({});
      const data = await generateItinerary({
        destination,
        days,
        budget,
        travelWith,
        interests: selectedInterests,
        homeCurrency
      });
      setItinerary(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not connect to backend server. Make sure your Express server is running on port 5000!');
    } finally {
      setLoading(false);
    }
  };

  const displayedDays = activeDayTab === 'all' 
    ? itinerary?.days 
    : itinerary?.days?.filter(d => d.day === Number(activeDayTab));

  const activeDestination = itinerary?.destination || destination || '';
  const theme = getDestinationTheme(activeDestination);
  const [bgImage, setBgImage] = useState(() => getDestinationBackground(''));

  useEffect(() => {
    let isMounted = true;
    if (!activeDestination) {
      setBgImage('/bg.jpg?v=2');
      return;
    }

    const instant = getDestinationBackground(activeDestination);
    if (instant && instant !== '/bg.jpg?v=2') {
      setBgImage(instant);
    }

    // Dynamic resolution for any city or town worldwide via Wikipedia
    resolveAnyDestinationImage(activeDestination).then(url => {
      if (isMounted && url) {
        setBgImage(url);
      }
    });

    return () => { isMounted = false; };
  }, [activeDestination]);

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      
      {/* 📸 Dynamic Location-Adaptive Photo Background (Changes with destination) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat no-print transition-all duration-1000 ease-in-out"
        style={{ 
          backgroundImage: `url('${bgImage}')`,
        }}
      />

      {/* Top Clean Navbar */}
      <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between relative z-10">
          
          {/* Brand Logo with Custom Tropical Beach Photo */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${theme.logoBadge} p-0.5 shadow-lg ${theme.shadowGlow} group-hover:scale-105 transition-all duration-700`}>
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-950">
                <img 
                  src="/logo.jpg?v=1" 
                  alt="WanderAI Palm Beach Logo" 
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1 font-sans">
                Wander<span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientText} transition-all duration-700`}>AI</span>
              </span>
              <span className={`text-[10px] block ${theme.accentText} font-semibold tracking-wider uppercase -mt-0.5 transition-colors duration-700`}>
                Smart Travel Companion
              </span>
            </div>
          </div>

          {/* Right Actions: Saved Trips + Auth Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSavedModal(!showSavedModal)}
              className="text-xs px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-xl font-medium border border-slate-800 hover:border-slate-700 flex items-center gap-2 transition duration-200 shadow-sm"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Saved Trips</span>
              <span className="px-2 py-0.5 bg-amber-400/15 text-amber-300 rounded-full text-[10px] font-bold">
                {savedTrips.length}
              </span>
            </button>

            {/* Auth Profile / Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-semibold">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs px-2.5 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Log Out"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl transition duration-200 shadow-lg shadow-orange-500/20 flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-slate-950" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Saved Trips Drawer */}
        {showSavedModal && (
          <div className="bg-slate-900/95 backdrop-blur-2xl border-b border-slate-800 px-4 py-4 animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" /> Your Travel Passport
                </h3>
                <button onClick={() => setShowSavedModal(false)} className="text-slate-400 hover:text-white text-xs font-semibold">
                  ✕ Close
                </button>
              </div>

              {savedTrips.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No trips saved yet. Generate an itinerary and click "Save Trip"!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {savedTrips.map(trip => (
                    <div key={trip.id} className="bg-slate-950/70 hover:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-800 hover:border-amber-500/40 flex justify-between items-start transition-all duration-300 group shadow-md">
                      <div 
                        className="cursor-pointer flex-1 pr-2"
                        onClick={() => {
                          setItinerary(trip);
                          setShowSavedModal(false);
                        }}
                      >
                        <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition">{trip.destination}</h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{trip.tripTitle}</p>
                        <span className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1 font-semibold">
                          Open Itinerary <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition" />
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 🌍 Immersive Hero Banner with Dynamic Harmonized Text Gradient */}
      <div className="max-w-4xl mx-auto px-4 pt-14 pb-10 text-center relative z-10 no-print">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Where will your{' '}
          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientText} drop-shadow-[0_2px_30px_rgba(255,255,255,0.35)] transition-all duration-700`}>
            journey
          </span>{' '}
          take you?
        </h1>

        {/* Visual Destination Quick-Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
          {[
            { name: 'Kyoto', badge: '⛩️ Temples' },
            { name: 'Paris', badge: '🥐 Romance' },
            { name: 'Bali', badge: '🌴 Tropical' },
            { name: 'Swiss Alps', badge: '🏔️ Nature' },
            { name: 'Dubai', badge: '✨ Luxury' }
          ].map(item => (
            <button
              key={item.name}
              type="button"
              onClick={() => setDestination(item.name)}
              className="text-xs px-3.5 py-1.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white rounded-full transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95"
            >
              <span>{item.badge}</span>
              <span className="font-semibold">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center space-y-8 relative z-10 w-full">
        
        {/* 🧭 Centered Travel Preferences Card */}
        <div className="w-full max-w-2xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden no-print">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradientText}`}></div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2.5">
              <Compass className={`w-4 h-4 ${theme.accentText}`} />
              <span>Plan Your Journey</span>
            </h2>

            {theme.atmosphereBadge && (
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 ${theme.accentText}`}>
                {theme.atmosphereBadge}
              </span>
            )}
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
                {/* Enhanced Command Search Bar with Autocomplete & Surprise Me */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <MapPin className={`w-3.5 h-3.5 ${theme.accentText}`} /> Destination
                    </label>
                    <button
                      type="button"
                      onClick={handleSurpriseMe}
                      className="text-[11px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 transition"
                      title="Pick a random dream destination"
                    >
                      <span>🎲 Surprise Me</span>
                    </button>
                  </div>

                  <div className="relative group">
                    <div className="relative flex items-center bg-slate-950/90 border border-white/15 rounded-2xl transition-all duration-300 focus-within:border-transparent focus-within:ring-2 focus-within:ring-amber-400 shadow-md">
                      <div className={`pl-4 pr-1 ${theme.accentText} transition`}>
                        <Compass className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => { setDestination(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                        placeholder="Where do you want to explore? (e.g. Kyoto, Paris, Bali...)"
                        className="w-full py-3 pl-2 pr-12 bg-transparent text-white placeholder-slate-400 text-sm font-semibold focus:outline-none"
                      />
                      {destination && (
                        <button
                          type="button"
                          onClick={() => setDestination('')}
                          className="absolute right-3 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition text-xs"
                          title="Clear destination"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Autocomplete & Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                        <div className="px-3.5 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                          <span>✨ Trending Destinations</span>
                          <span>Click to select</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto py-1">
                          {filteredSuggestions.map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onMouseDown={() => {
                                setDestination(item.name);
                                setShowSuggestions(false);
                              }}
                              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/80 transition text-left group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-base group-hover:scale-110 transition">{item.badge}</span>
                                <div>
                                  <div className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                                    {item.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium">
                                    {item.category}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono group-hover:text-amber-400/80 transition">
                                Explore &rarr;
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Home Currency */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                    <Globe className="w-3.5 h-3.5 text-amber-400" /> Your Home Currency
                  </label>
                  <select
                    value={homeCurrency}
                    onChange={(e) => setHomeCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {currencyOptions.map(c => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-white">{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Duration Selector (1 to 30 Days + Stepper & Slider) */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Trip Duration
                    </label>
                    
                    {/* Stepper with +/- buttons and Direct Input */}
                    <div className="flex items-center gap-1.5 bg-black/60 border border-white/15 rounded-xl px-2.5 py-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setDays(prev => Math.max(1, prev - 1))}
                        className="w-6 h-6 flex items-center justify-center text-amber-400 hover:text-white rounded-lg hover:bg-white/10 text-sm font-black transition"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={days}
                        onChange={(e) => setDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                        className="w-8 text-center bg-transparent text-white font-bold text-xs focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-300 font-bold">Days</span>
                      <button
                        type="button"
                        onClick={() => setDays(prev => Math.min(30, prev + 1))}
                        className="w-6 h-6 flex items-center justify-center text-amber-400 hover:text-white rounded-lg hover:bg-white/10 text-sm font-black transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Slider (1 to 30 days) */}
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer bg-slate-800/80 h-2 rounded-lg appearance-none shadow-inner"
                  />
                </div>

                {/* Traveling With */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> Traveling With
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {companionOptions.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setTravelWith(opt.label)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                          travelWith === opt.label
                            ? `border-transparent bg-gradient-to-r ${theme.buttonGradient} text-slate-950 shadow-lg ${theme.shadowGlow} scale-[1.02]`
                            : 'border-white/10 hover:border-white/20 bg-slate-950/60 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Budget Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {budgetOptions.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setBudget(opt.label)}
                        className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${
                          budget === opt.label
                            ? `border-transparent bg-gradient-to-r ${theme.buttonGradient} text-slate-950 font-black shadow-lg ${theme.shadowGlow} scale-[1.02]`
                            : 'border-white/10 hover:border-white/20 bg-slate-950/60 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="text-base">{opt.icon}</div>
                        <div className="text-xs font-bold mt-1">{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Travel Mood & Interests
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {interestOptions.map(interest => {
                      const active = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all duration-200 ${
                            active
                              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold scale-105'
                              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 hover:border-white/20'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-3 py-3.5 px-5 bg-gradient-to-r ${theme.buttonGradient} text-slate-950 font-black text-sm tracking-wide rounded-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xl hover:scale-[1.01] active:scale-[0.98]`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Planning Your Journey...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4 text-slate-950" />
                      <span>Build My Itinerary</span>
                    </>
                  )}
                </button>
              </form>
            </div>

        {/* Centered Alerts & Output Feed */}
        <div className="w-full">
          {error && (
            <div className="max-w-2xl mx-auto p-4 bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-xl flex items-center gap-3 text-xs mb-6">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-16 text-center shadow-xl">
              <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto mb-4" />
              <p className="font-bold text-white text-lg">Curating your custom journey...</p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                Mapping morning, afternoon, and evening experiences with authentic local pricing.
              </p>
            </div>
          )}

          {itinerary && !loading && (
            <div className="space-y-6 w-full">
              
              {/* 🖨️ Printable Travel Guide Header */}
              <div className="print-only-header">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      WANDERAI TRAVEL GUIDE
                    </h1>
                    <p className="text-xs text-slate-600 mt-1 uppercase tracking-wider font-bold">
                      {itinerary.destination} &bull; {itinerary.days?.length} Day Journey
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p className="font-bold text-slate-900">Traveler: {currentUser ? currentUser.name : 'Registered Traveler'}</p>
                  </div>
                </div>
              </div>

              {/* Trip Overview Card */}
              <div className="bg-slate-950/85 backdrop-blur-2xl rounded-3xl p-7 border border-white/15 shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradientText}`}></div>
                <div className="flex justify-between items-start gap-4">
                  <span className={`text-xs font-black px-3.5 py-1.5 bg-gradient-to-r ${theme.buttonGradient} text-slate-950 rounded-full uppercase tracking-wider shadow-sm`}>
                    {itinerary.destination}
                  </span>
                  
                  {/* Action Bar */}
                  <div className="flex items-center gap-1.5 no-print">
                    <button
                      onClick={handleCopySummary}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-200 hover:text-white transition text-xs flex items-center gap-1 border border-white/10"
                      title="Copy Summary"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-200 hover:text-white transition text-xs border border-white/10"
                      title="Print / Save PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleSaveTrip}
                      className={`px-3.5 py-1.5 bg-gradient-to-r ${theme.buttonGradient} text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-sm hover:scale-105`}
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Bookmark className="w-3.5 h-3.5 text-slate-950" />}
                      <span>{isSaved ? 'Saved!' : 'Save Trip'}</span>
                    </button>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white mt-4 tracking-tight leading-tight">
                  {itinerary.tripTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed font-normal">
                  {itinerary.overview}
                </p>

                {/* Financial Summary */}
                <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-300">
                  <div>
                    <span className="block text-slate-400 text-[11px] font-medium">Daily Local Estimate:</span>
                    <span className="font-extrabold text-white text-base">{itinerary.estimatedDailyCost}</span>
                  </div>

                  {itinerary.estimatedDailyCostHome && (
                    <div className="border-l border-white/10 pl-6">
                      <span className="block text-slate-400 text-[11px] font-medium">In Your Currency:</span>
                      <span className={`font-extrabold text-base bg-gradient-to-r ${theme.gradientText} bg-clip-text text-transparent`}>
                        ≈ {itinerary.estimatedDailyCostHome}
                      </span>
                    </div>
                  )}

                  {itinerary.approxExchangeRate && (
                    <div className="text-[11px] text-slate-300 ml-auto bg-black/50 border border-white/10 px-3 py-1 rounded-full font-mono">
                      {itinerary.approxExchangeRate}
                    </div>
                  )}
                </div>
              </div>

              {/* 🗺️ Interactive Route Map */}
              <TripMap 
                destination={itinerary.destination} 
                days={itinerary.days} 
                activeDay={activeDayTab} 
              />

              {/* 💰 Live Budget & Expense Tracker */}
              <BudgetTracker itinerary={itinerary} />

              {/* Must-Try Foods & Interactive Packing Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    🍜 Culinary Highlights
                  </h4>
                  <ul className="text-xs space-y-2 text-slate-300">
                    {itinerary.mustTryFoods?.map((food, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        <span>{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    🎒 Packing Essentials
                  </h4>
                  <ul className="text-xs space-y-2">
                    {itinerary.packingTips?.map((tip, i) => (
                      <li 
                        key={i} 
                        onClick={() => togglePackingItem(i)}
                        className={`flex items-center gap-2 cursor-pointer transition select-none ${
                          checkedPacking[i] ? 'text-slate-500 line-through' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 transition ${
                          checkedPacking[i] ? 'text-emerald-500' : 'text-slate-600'
                        }`} />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Day Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
                <button
                  onClick={() => setActiveDayTab('all')}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition shrink-0 ${
                    activeDayTab === 'all'
                      ? theme.activeTab
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Days ({itinerary.days?.length})
                </button>
                {itinerary.days?.map(d => (
                  <button
                    key={d.day}
                    onClick={() => setActiveDayTab(d.day)}
                    className={`text-xs px-4 py-2 rounded-xl font-bold transition shrink-0 ${
                      activeDayTab === d.day
                        ? theme.activeTab
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Day {d.day}
                  </button>
                ))}
              </div>

              {/* Day-by-Day Timeline */}
              <div className="space-y-6">
                {displayedDays?.map((day) => {
                  const dayStyle = [
                    {
                      border: 'border-amber-500/30 hover:border-amber-500/50',
                      headerBg: 'bg-gradient-to-r from-amber-500/20 via-slate-900/90 to-slate-900/90',
                      headerBorder: 'border-amber-500/20',
                      badge: 'bg-amber-400 text-slate-950',
                      titleColor: 'text-amber-200',
                      costBorder: 'border-amber-500/30',
                      cardBg: 'bg-gradient-to-br from-amber-950/20 via-slate-950/90 to-slate-950/95',
                      accentText: 'text-amber-400'
                    },
                    {
                      border: 'border-cyan-500/30 hover:border-cyan-500/50',
                      headerBg: 'bg-gradient-to-r from-cyan-500/20 via-slate-900/90 to-slate-900/90',
                      headerBorder: 'border-cyan-500/20',
                      badge: 'bg-cyan-400 text-slate-950',
                      titleColor: 'text-cyan-200',
                      costBorder: 'border-cyan-500/30',
                      cardBg: 'bg-gradient-to-br from-cyan-950/20 via-slate-950/90 to-slate-950/95',
                      accentText: 'text-cyan-400'
                    },
                    {
                      border: 'border-emerald-500/30 hover:border-emerald-500/50',
                      headerBg: 'bg-gradient-to-r from-emerald-500/20 via-slate-900/90 to-slate-900/90',
                      headerBorder: 'border-emerald-500/20',
                      badge: 'bg-emerald-400 text-slate-950',
                      titleColor: 'text-emerald-200',
                      costBorder: 'border-emerald-500/30',
                      cardBg: 'bg-gradient-to-br from-emerald-950/20 via-slate-950/90 to-slate-950/95',
                      accentText: 'text-emerald-400'
                    },
                    {
                      border: 'border-rose-500/30 hover:border-rose-500/50',
                      headerBg: 'bg-gradient-to-r from-rose-500/20 via-slate-900/90 to-slate-900/90',
                      headerBorder: 'border-rose-500/20',
                      badge: 'bg-rose-400 text-slate-950',
                      titleColor: 'text-rose-200',
                      costBorder: 'border-rose-500/30',
                      cardBg: 'bg-gradient-to-br from-rose-950/20 via-slate-950/90 to-slate-950/95',
                      accentText: 'text-rose-400'
                    },
                    {
                      border: 'border-purple-500/30 hover:border-purple-500/50',
                      headerBg: 'bg-gradient-to-r from-purple-500/20 via-slate-900/90 to-slate-900/90',
                      headerBorder: 'border-purple-500/20',
                      badge: 'bg-purple-400 text-slate-950',
                      titleColor: 'text-purple-200',
                      costBorder: 'border-purple-500/30',
                      cardBg: 'bg-gradient-to-br from-purple-950/20 via-slate-950/90 to-slate-950/95',
                      accentText: 'text-purple-400'
                    }
                  ][(day.day - 1) % 5];

                  return (
                    <div key={day.day} className={`${dayStyle.cardBg} backdrop-blur-xl rounded-3xl border ${dayStyle.border} overflow-hidden shadow-2xl transition-all duration-300 page-break-inside-avoid`}>
                      
                      {/* Day Header Banner */}
                      <div className={`${dayStyle.headerBg} px-6 py-4 border-b ${dayStyle.headerBorder} flex flex-wrap justify-between items-center gap-3`}>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-xl ${dayStyle.badge} font-black text-xs tracking-wider shadow-sm`}>
                            DAY {day.day}
                          </span>
                          <span className={`text-xs ${dayStyle.titleColor} font-bold`}>
                            • {day.theme}
                          </span>
                        </div>
                        
                        {day.dayCost && (
                          <div className={`text-xs font-semibold px-3 py-1 bg-black/50 rounded-xl border ${dayStyle.costBorder} text-slate-200 flex items-center gap-1.5 shadow-sm`}>
                            <span className="text-slate-400 font-normal">Est. Total:</span>
                            <span className="text-white font-bold">{day.dayCost}</span>
                            {day.dayCostHome && (
                              <span className="text-amber-400 font-medium text-[11px]">(≈ {day.dayCostHome})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Schedule Slots */}
                      <div className="p-6 space-y-4">
                        {/* Morning */}
                        <div className="flex gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all duration-300">
                          <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 h-fit shadow-sm">
                            <Coffee className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="font-bold text-white text-sm">{day.morning?.activity}</h5>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((day.morning?.activity || '') + ', ' + (itinerary.destination || ''))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 hover:underline mt-0.5"
                                >
                                  🗺️ Google Maps Directions →
                                </a>
                              </div>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono shrink-0">
                                <Clock className="w-3 h-3 text-amber-400" /> {day.morning?.time}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{day.morning?.description}</p>
                            <span className="inline-block mt-2.5 text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                              {day.morning?.approxCost}
                            </span>
                          </div>
                        </div>

                        {/* Afternoon */}
                        <div className="flex gap-4 p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 hover:border-sky-500/40 hover:bg-sky-500/10 transition-all duration-300">
                          <div className="p-2.5 bg-sky-500/20 border border-sky-500/30 rounded-xl text-sky-300 h-fit shadow-sm">
                            <Utensils className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="font-bold text-white text-sm">{day.afternoon?.activity}</h5>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((day.afternoon?.activity || '') + ', ' + (itinerary.destination || ''))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-sky-300 hover:text-sky-200 hover:underline mt-0.5"
                                >
                                  🗺️ Google Maps Directions →
                                </a>
                              </div>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono shrink-0">
                                <Clock className="w-3 h-3 text-sky-400" /> {day.afternoon?.time}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{day.afternoon?.description}</p>
                            <span className="inline-block mt-2.5 text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                              {day.afternoon?.approxCost}
                            </span>
                          </div>
                        </div>

                        {/* Evening */}
                        <div className="flex gap-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-300">
                          <div className="p-2.5 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300 h-fit shadow-sm">
                            <Moon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="font-bold text-white text-sm">{day.evening?.activity}</h5>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((day.evening?.activity || '') + ', ' + (itinerary.destination || ''))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-purple-200 hover:underline mt-0.5"
                                >
                                  🗺️ Google Maps Directions →
                                </a>
                              </div>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono shrink-0">
                                <Clock className="w-3 h-3 text-purple-400" /> {day.evening?.time}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{day.evening?.description}</p>
                            <span className="inline-block mt-2.5 text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                              {day.evening?.approxCost}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🧭 Clean Minimalist Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl py-5 px-6 no-print relative z-10 w-full">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-white text-sm tracking-tight">
              Wander<span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientText}`}>AI</span>
            </span>
            <span className="text-slate-700 font-bold">|</span>
            <span className="text-slate-400 font-medium">Smart Travel Companion</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              Crafted for Curious Explorers
            </span>

            {activeDestination && (
              <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Atmosphere: <strong className="text-white capitalize">{activeDestination}</strong></span>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* 🔐 Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          loadSavedTrips();
        }}
      />

    </div>
  );
}