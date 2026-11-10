import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Trash2, AlertTriangle, 
  CheckCircle2, ShoppingBag, Utensils, Compass, Car, Edit3, Check, RotateCcw
} from 'lucide-react';

export default function BudgetTracker({ itinerary }) {
  // Extract upper bound of daily cost range (e.g. "$100 - $180" -> 180, "₹3,500 - ₹5,000" -> 5000)
  const extractCostNumber = (costStr) => {
    if (!costStr) return 150;
    const matches = costStr.match(/\d[\d,]*/g);
    if (!matches || matches.length === 0) return 150;
    const numbers = matches.map(m => parseFloat(m.replace(/,/g, ''))).filter(n => !isNaN(n));
    if (numbers.length === 0) return 150;
    return Math.max(...numbers);
  };

  const daysCount = itinerary.days?.length || 3;

  // Prefer home currency estimate if provided (e.g. "₹12,000 / day"), otherwise local
  const preferHome = Boolean(itinerary.estimatedDailyCostHome);
  const activeCostString = preferHome ? itinerary.estimatedDailyCostHome : itinerary.estimatedDailyCost;
  const defaultDailyCost = extractCostNumber(activeCostString);

  // Extract currency symbol (e.g. "INR (₹)" -> "₹", "USD ($)" -> "$")
  const getCurrencySymbol = () => {
    const raw = preferHome ? (itinerary.homeCurrency || '₹') : (itinerary.localCurrency || '$');
    const match = raw.match(/\((.*?)\)/);
    return match ? match[1] : (raw.split(' ')[0] || '$');
  };

  const symbol = getCurrencySymbol();
  const destKey = itinerary.destination?.toLowerCase().replace(/\s+/g, '') || 'trip';
  const storageKey = `wanderai_expenses_${destKey}`;
  const budgetStorageKey = `wanderai_budget_${destKey}`;

  // Custom Budget State (Allows user to override AI estimated total)
  const [customBudget, setCustomBudget] = useState(() => {
    try {
      const saved = localStorage.getItem(budgetStorageKey);
      return saved ? parseFloat(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  // Auto-calculated baseline budget (Days * daily estimate + 15% travel buffer)
  const autoBudget = Math.round(defaultDailyCost * daysCount * 1.15);
  const totalBudget = (customBudget && customBudget > 0) ? customBudget : autoBudget;

  // Expenses State (Starts clean from real user entries)
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Dining');

  // Sync expenses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Could not save expenses:', e.message);
    }
  }, [expenses, storageKey]);

  // Sync custom budget to localStorage
  useEffect(() => {
    try {
      if (customBudget) {
        localStorage.setItem(budgetStorageKey, String(customBudget));
      } else {
        localStorage.removeItem(budgetStorageKey);
      }
    } catch (e) {
      console.warn('Could not save budget override:', e.message);
    }
  }, [customBudget, budgetStorageKey]);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      setCustomBudget(Math.round(val));
    }
    setIsEditingBudget(false);
  };

  const handleResetBudget = () => {
    setCustomBudget(null);
    setIsEditingBudget(false);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newExpense = {
      id: Date.now(),
      title: title.trim(),
      amount: Math.round(parsedAmount),
      category,
      date: `Day ${Math.min(expenses.length + 1, daysCount)}`
    };

    setExpenses([newExpense, ...expenses]);
    setTitle('');
    setAmount('');
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(ex => ex.id !== id));
  };

  const handleClearAllExpenses = () => {
    if (window.confirm('Clear all logged expenses for this trip?')) {
      setExpenses([]);
    }
  };

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalBudget - totalSpent;
  const percentage = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;
  const isOverBudget = totalSpent > totalBudget;

  const categoryIcons = {
    Dining: <Utensils className="w-3.5 h-3.5 text-amber-400" />,
    Transit: <Car className="w-3.5 h-3.5 text-sky-400" />,
    Activities: <Compass className="w-3.5 h-3.5 text-indigo-400" />,
    Shopping: <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
  };

  return (
    <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Trip Expense & Budget Tracker
            </h3>
            <p className="text-xs text-slate-400">
              Track your actual spending against your {daysCount}-day trip allowance.
            </p>
          </div>
        </div>

        {/* Budget Status Badge */}
        <div className="flex items-center gap-2">
          {isOverBudget ? (
            <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              Over Budget by {symbol}{(totalSpent - totalBudget).toLocaleString()}
            </span>
          ) : (
            <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {symbol}{remaining.toLocaleString()} Available
            </span>
          )}
        </div>
      </div>

      {/* Progress & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
        {/* Total Budget Card with Inline Edit Mode */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl relative group">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Trip Budget Target
            </span>
            {!isEditingBudget && (
              <button 
                onClick={() => { setBudgetInput(String(totalBudget)); setIsEditingBudget(true); }}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 no-print font-medium"
                title="Edit total budget"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          {isEditingBudget ? (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-1.5 mt-1">
              <span className="text-sm font-bold text-slate-400">{symbol}</span>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-28 px-2 py-1 bg-slate-900 border border-amber-500 rounded-lg text-sm text-white font-bold focus:outline-none"
                autoFocus
              />
              <button type="submit" className="p-1 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400" title="Save">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={handleResetBudget} className="p-1 text-slate-400 hover:text-white" title="Reset to AI estimate">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <>
              <span className="text-xl font-black text-white">
                {symbol}{totalBudget.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {customBudget ? 'Custom User Budget Target' : `(Based on ≈ ${symbol}${defaultDailyCost}/day + buffer)`}
              </span>
            </>
          )}
        </div>

        {/* Total Spent Card */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Logged Expenses
            </span>
            {expenses.length > 0 && (
              <button 
                onClick={handleClearAllExpenses}
                className="text-[10px] text-slate-500 hover:text-rose-400 no-print"
                title="Reset expenses"
              >
                Clear
              </button>
            )}
          </div>
          <span className={`text-xl font-black ${isOverBudget ? 'text-rose-400' : 'text-amber-400'}`}>
            {symbol}{totalSpent.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {expenses.length} transaction{expenses.length === 1 ? '' : 's'} recorded
          </span>
        </div>

        {/* Burn Rate Card */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Budget Burn Rate
          </span>
          <span className="text-xl font-black text-white">
            {percentage}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {isOverBudget ? 'Exceeded assigned budget' : `${100 - percentage}% safety cushion remaining`}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-400 font-medium">Spending vs Allocation</span>
          <span className="font-bold text-white">{percentage}% Used</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget 
                ? 'bg-rose-500' 
                : (percentage > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-amber-400')
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Add Expense Form (Hidden during print) */}
      <form onSubmit={handleAddExpense} className="no-print bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl mb-5 flex flex-wrap sm:flex-nowrap gap-2.5 items-center">
        <input
          type="text"
          placeholder="Expense title (e.g. Scooter rental, Gelato)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-[160px] px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />

        <div className="relative w-28 shrink-0">
          <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">{symbol}</span>
          <input
            type="number"
            step="any"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0"
        >
          <option value="Dining">Dining 🍔</option>
          <option value="Transit">Transit 🚕</option>
          <option value="Activities">Activities 🎟️</option>
          <option value="Shopping">Shopping 🛍️</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {/* Logged Expenses List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {expenses.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            No expenses recorded yet. Your full budget is available!
          </p>
        ) : (
          expenses.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition group text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                  {categoryIcons[item.category] || <Compass className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div>
                  <h5 className="font-semibold text-white">{item.title}</h5>
                  <span className="text-[10px] text-slate-500">{item.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-extrabold text-white text-sm">
                  {symbol}{item.amount.toLocaleString()}
                </span>
                <button
                  onClick={() => handleDeleteExpense(item.id)}
                  className="no-print opacity-60 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition p-1"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
