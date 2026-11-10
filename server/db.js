import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Creates or opens 'wanderai.db' file in the server directory
const dbPath = path.join(__dirname, 'wanderai.db');
const db = new Database(dbPath);

// Enable WAL mode (Write-Ahead Logging) for fast, reliable reads & writes
db.pragma('journal_mode = WAL');

// Initialize the 'trips' table schema if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    destination TEXT NOT NULL,
    trip_title TEXT NOT NULL,
    days INTEGER NOT NULL,
    budget TEXT,
    local_currency TEXT,
    home_currency TEXT,
    daily_cost_local TEXT,
    daily_cost_home TEXT,
    itinerary_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('📦 SQLite Database initialized at:', dbPath);

/**
 * 1. Get all trips (ordered by newest first)
 */
export function getAllTrips() {
  const stmt = db.prepare('SELECT * FROM trips ORDER BY created_at DESC');
  const rows = stmt.all();

  // Parse the stored JSON string back into real JavaScript objects
  return rows.map(row => ({
    id: row.id,
    savedAt: row.created_at,
    ...JSON.parse(row.itinerary_json)
  }));
}

/**
 * 2. Save a new trip
 */
export function insertTrip(itinerary) {
  const id = Date.now().toString();
  const stmt = db.prepare(`
    INSERT INTO trips (
      id, destination, trip_title, days, budget, 
      local_currency, home_currency, daily_cost_local, daily_cost_home, itinerary_json
    ) VALUES (
      @id, @destination, @trip_title, @days, @budget,
      @local_currency, @home_currency, @daily_cost_local, @daily_cost_home, @itinerary_json
    )
  `);

  stmt.run({
    id,
    destination: itinerary.destination || 'Unknown',
    trip_title: itinerary.tripTitle || 'Trip Plan',
    days: itinerary.days?.length || 1,
    budget: itinerary.budget || 'Moderate',
    local_currency: itinerary.localCurrency || '',
    home_currency: itinerary.homeCurrency || '',
    daily_cost_local: itinerary.estimatedDailyCost || '',
    daily_cost_home: itinerary.estimatedDailyCostHome || '',
    itinerary_json: JSON.stringify(itinerary)
  });

  return { id, savedAt: new Date().toISOString(), ...itinerary };
}

/**
 * 3. Delete a trip by ID
 */
export function removeTrip(id) {
  const stmt = db.prepare('DELETE FROM trips WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}