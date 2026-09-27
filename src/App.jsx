import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Landmark, Building2, Home, Users, Gavel, ScrollText, Trophy, TrendingUp,
  Check, Briefcase, Crown, AlertTriangle, Lock, ChevronRight, ChevronLeft,
  Coins, UserCog, X, Camera, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { initAds, showBanner, hideBanner, maybeShowInterstitialForLevel, showRewardedAd, showNativeAd, hideNativeAd } from './ads';

/* ============================================================================
   STATIC WORLD DATA
   ========================================================================== */

const CITIES = [
  'Nairobi', 'Lagos', 'Cairo', 'Kampala', 'Addis Ababa', 'Accra', 'Johannesburg',
  'Casablanca', 'Mumbai', 'Shanghai', 'Singapore', 'Hong Kong', 'Seoul', 'Tokyo',
  'Bangkok', 'Manila', 'Jakarta', 'Dubai', 'Doha', 'Riyadh', 'Istanbul', 'London',
  'Zurich', 'Frankfurt', 'Paris', 'Milan', 'Madrid', 'Lisbon', 'Amsterdam',
  'Vienna', 'Warsaw', 'Stockholm', 'Dublin', 'Toronto', 'New York', 'Chicago',
  'Sao Paulo', 'Buenos Aires', 'Mexico City', 'Sydney',
];

const BANK_TIERS = [
  { key: 'community', label: 'Community Credit Union', icon: '🏪', count: 35, minLevel: 1, costMin: 250000, costMax: 4000000, pbMin: 900, pbMax: 6000 },
  { key: 'regional', label: 'Regional Bank', icon: '🏬', count: 35, minLevel: 8, costMin: 8000000, costMax: 120000000, pbMin: 5000, pbMax: 30000 },
  { key: 'national', label: 'National Bank', icon: '🏦', count: 30, minLevel: 20, costMin: 150000000, costMax: 4000000000, pbMin: 20000, pbMax: 90000 },
  { key: 'investment', label: 'Investment Bank', icon: '💹', count: 25, minLevel: 35, costMin: 6000000000, costMax: 120000000000, pbMin: 60000, pbMax: 200000 },
  { key: 'central', label: 'Central Bank', icon: '🏛️', count: 20, minLevel: 55, costMin: 200000000000, costMax: 4000000000000, pbMin: 150000, pbMax: 500000 },
  { key: 'worldbank', label: 'World Bank Governing Seat', icon: '🌍', count: 5, minLevel: 80, costMin: 6000000000000, costMax: 60000000000000, pbMin: 500000, pbMax: 1500000 },
];
const TOTAL_BANKS = BANK_TIERS.reduce((s, t) => s + t.count, 0); // 150

function buildBanks() {
  const banks = [];
  let id = 0;
  BANK_TIERS.forEach((tier) => {
    for (let j = 0; j < tier.count; j++) {
      const frac = tier.count > 1 ? j / (tier.count - 1) : 0;
      const cost = Math.round(tier.costMin * Math.pow(tier.costMax / tier.costMin, frac));
      const payback = tier.pbMin * Math.pow(tier.pbMax / tier.pbMin, frac);
      const income = Math.max(1, Math.round(cost / payback));
      const city = CITIES[id % CITIES.length];
      const cycle = Math.floor(id / CITIES.length);
      const name = `${city} ${tier.label}${cycle > 0 ? ' ' + (cycle + 1) : ''}`;
      banks.push({ id, tierKey: tier.key, tierLabel: tier.label, icon: tier.icon, name, cost, income, minLevel: tier.minLevel });
      id++;
    }
  });
  return banks;
}
const ALL_BANKS = buildBanks();

const HOUSES = [
  { name: 'Rented Bedsit', icon: '🛏️', cost: 0, prestige: 0 },
  { name: 'Studio Apartment', icon: '🏠', cost: 2250, prestige: 2 },
  { name: 'Suburban House', icon: '🏘️', cost: 22500, prestige: 6 },
  { name: 'Downtown Townhouse', icon: '🏙️', cost: 180000, prestige: 14 },
  { name: 'Luxury Condominium', icon: '🏢', cost: 1350000, prestige: 30 },
  { name: 'Private Villa', icon: '🏡', cost: 12000000, prestige: 65 },
  { name: 'Beachfront Mansion', icon: '🏖️', cost: 90000000, prestige: 140 },
  { name: 'Private Island Estate', icon: '🏝️', cost: 750000000, prestige: 320 },
  { name: 'Sky Palace Penthouse (Untouchable)', icon: '🏰', cost: 6000000000, prestige: 700 },
];
const CARS = [
  { name: 'Borrowed Bicycle', icon: '🚲', cost: 0, prestige: 0 },
  { name: 'Second-Hand Sedan', icon: '🚗', cost: 1350, prestige: 1 },
  { name: 'Compact Hatchback', icon: '🚙', cost: 12000, prestige: 4 },
  { name: 'Sports Coupe', icon: '🏎️', cost: 90000, prestige: 10 },
  { name: 'Luxury Sedan', icon: '🚘', cost: 600000, prestige: 22 },
  { name: 'Supercar', icon: '🏁', cost: 4500000, prestige: 50 },
  { name: 'Hypercar', icon: '🚀', cost: 33000000, prestige: 110 },
  { name: 'Armored Convoy Fleet', icon: '🛡️', cost: 225000000, prestige: 250 },
  { name: 'One-of-One Concept Car (Untouchable)', icon: '👑', cost: 1800000000, prestige: 550 },
];
const JETS = [
  { name: 'Economy Ticket', icon: '🎫', cost: 0, prestige: 0 },
  { name: 'Charter Flights', icon: '🛩️', cost: 225000, prestige: 8 },
  { name: 'Turboprop', icon: '✈️', cost: 2250000, prestige: 20 },
  { name: 'Light Jet', icon: '🛫', cost: 18000000, prestige: 45 },
  { name: 'Midsize Jet', icon: '🛬', cost: 120000000, prestige: 100 },
  { name: 'Long-Range Airliner', icon: '🛩️', cost: 750000000, prestige: 240 },
  { name: 'Private Fleet of Jets (Untouchable)', icon: '👑', cost: 5250000000, prestige: 520 },
];
const CHOPPERS = [
  { name: 'No Helicopter', icon: '🚫', cost: 0, prestige: 0 },
  { name: 'Tour Helicopter Rental', icon: '🚁', cost: 600000, prestige: 10 },
  { name: 'Light Utility Helicopter', icon: '🚁', cost: 4500000, prestige: 25 },
  { name: 'Executive Helicopter', icon: '🚁', cost: 27000000, prestige: 55 },
  { name: 'VIP Luxury Helicopter', icon: '🚁', cost: 135000000, prestige: 120 },
  { name: 'Presidential-Grade Helicopter (Untouchable)', icon: '👑', cost: 900000000, prestige: 260 },
];
const SHIPS = [
  { name: 'No Vessel', icon: '🚫', cost: 0, prestige: 0 },
  { name: 'Fishing Boat', icon: '🚤', cost: 300000, prestige: 8 },
  { name: 'Motor Yacht', icon: '⛵', cost: 7500000, prestige: 30 },
  { name: 'Superyacht', icon: '🛥️', cost: 67500000, prestige: 90 },
  { name: 'Mega Yacht with Helipad', icon: '🛳️', cost: 525000000, prestige: 220 },
  { name: 'Private Cruise Liner (Untouchable)', icon: '👑', cost: 3750000000, prestige: 480 },
];
const VAULTS = [
  { name: 'Kitchen Drawer', icon: '🗄️', cost: 0, prestige: 0 },
  { name: 'Personal Safe', icon: '🔒', cost: 7500, prestige: 4 },
  { name: 'Bank-Grade Vault Room', icon: '🚪', cost: 525000, prestige: 18 },
  { name: 'Fortress Vault', icon: '🏰', cost: 9000000, prestige: 50 },
  { name: 'Underground Bullion Vault', icon: '🪙', cost: 120000000, prestige: 130 },
  { name: 'Private Mountain Bunker Vault', icon: '⛰️', cost: 1050000000, prestige: 280 },
  { name: 'National Reserve-Grade Vault (Untouchable)', icon: '👑', cost: 7500000000, prestige: 600 },
];
const LUXURY_ITEMS = [
  { id: 'art', icon: '🎨', name: 'Blue-Chip Art Collection', cost: 3000000, prestige: 25 },
  { id: 'watch', icon: '⌚', name: 'Rare Watch Vault', cost: 7500000, prestige: 30 },
  { id: 'vineyard', icon: '🍇', name: 'Private Vineyard', cost: 60000000, prestige: 70 },
  { id: 'stable', icon: '🐎', name: 'Racehorse Stable', cost: 27000000, prestige: 45 },
  { id: 'diamond', icon: '💎', name: 'Diamond Vault', cost: 135000000, prestige: 120 },
  { id: 'skybox', icon: '🏟️', name: 'Global Sports Arena Skyboxes', cost: 90000000, prestige: 90 },
  { id: 'space', icon: '🚀', name: 'Space Tourism Seat', cost: 375000000, prestige: 200 },
  { id: 'wine', icon: '🍷', name: 'Rare Wine Cellar', cost: 18000000, prestige: 40 },
  { id: 'jewel', icon: '👑', name: 'Royal Jewelry Collection', cost: 195000000, prestige: 160 },
  { id: 'island', icon: '🏝️', name: 'Private Island', cost: 1350000000, prestige: 350 },
  { id: 'team', icon: '🏆', name: 'Own a Sports Franchise', cost: 6000000000, prestige: 700 },
  { id: 'gallery', icon: '🖼️', name: "Old Masters' Gallery Wing", cost: 1050000000, prestige: 320 },
  { id: 'library', icon: '📚', name: 'Rare Manuscripts Library', cost: 67500000, prestige: 85 },
  { id: 'car_collection', icon: '🏎️', name: 'Vintage Car Collection', cost: 300000000, prestige: 180 },
];

const STAFF_DEFS = {
  assistant: { name: 'Executive Assistant', cost: 8000, desc: 'A small steady lift to all income.', icon: UserCog },
  manager: { name: 'Personal Manager', cost: 180000, desc: 'Runs day-to-day branch operations.', icon: Briefcase },
  secretary: { name: 'Executive Secretary', cost: 60000, desc: 'Unlocks scheduled board meetings.', icon: ScrollText },
  treasurer: { name: 'Treasurer', cost: 3500000, desc: 'Sharpens your market instincts.', icon: Coins },
};
const BODYGUARD_COST = 20000, SOLDIER_COST = 150000, DIRECTOR_BASE_COST = 50000000;
const MAX_BODYGUARDS = 20, MAX_SOLDIERS = 20, MAX_DIRECTORS = 7;

/* Economy hardening: taxes, upkeep, and crew salaries */
const CORP_TAX_RATE = 0.16;      // government tax on bank + dividend income, every tick
const PERSONAL_TAX_RATE = 0.12;  // government tax on the salary you draw from the bank
const SALARY_RATE = 0.07;        // fraction of net bank income paid to you personally, every tick
const UPKEEP_RATE = 0.000012;    // per-tick upkeep as a fraction of an asset's purchase price
const CREW_SALARY = {            // per-tick wage, paid from bank cash
  assistant: 4, manager: 40, secretary: 18, treasurer: 250,
  director: 900, bodyguard: 6, soldier: 20,
};

/* A bank is a building, not just a number: it needs workers, resources, and upkeep
   before it ever turns a profit. This is taken off the top of raw bank income. */
const BANK_OPERATING_RATE = 0.24;

/* Every owned bank can be renovated/modernized/staffed up through 4 upgrade tiers.
   Cost is a multiple of the bank's own price; each tier adds +18% income. */
const BANK_UPGRADE_COST_MULT = [0.35, 0.75, 1.5, 2.75];
const BANK_UPGRADE_INCOME_BONUS = 0.18; // per upgrade level
const BANK_UPGRADE_LABELS = ['Standard Branch', 'Renovated', 'Modernized', 'Flagship', 'Landmark'];

/* Customer confidence: interviews and other reputational moments move this up or down,
   and it directly scales every bank's income. */
const CUSTOMER_BASE = 100;

const MINT_AUTHORITY_COST = 250000000000000; // $250T — the true final unlock

const LEVEL_TITLES = [
  [1, 'Loan Clerk'], [10, 'Branch Manager'], [20, 'Regional Director'],
  [30, 'Vice President'], [40, 'Bank President'], [50, 'Holding Chairman'],
  [60, 'Financial Magnate'], [70, 'National Reserve Advisor'],
  [80, 'Central Bank Governor'], [90, 'Global Monetary Envoy'],
  [100, 'World Bank Chairman'],
];
function titleForLevel(lvl) { let t = LEVEL_TITLES[0][1]; for (const [l, n] of LEVEL_TITLES) if (lvl >= l) t = n; return t; }
const CUM_XP = (() => {
  const cum = [0];
  for (let n = 1; n <= 100; n++) cum.push(cum[n - 1] + Math.round(900 * Math.pow(1.235, n)));
  return cum;
})();
function levelFromEarned(total) { let lvl = 1; for (let n = 1; n <= 100; n++) if (total >= CUM_XP[n]) lvl = n; else break; return lvl; }

const COMPANIES_INIT = [
  { id: 'iron', icon: '📦', name: 'Ironclad Logistics', sector: 'Shipping', price: 4500, divRate: 0.0030 },
  { id: 'sky', icon: '✈️', name: 'Skyline Air Holdings', sector: 'Aviation', price: 12000, divRate: 0.0024 },
  { id: 'trq', icon: '🏎️', name: 'Torque Motors Co.', sector: 'Automotive', price: 1800, divRate: 0.0036 },
  { id: 'hrb', icon: '🏦', name: 'Harborline Bank', sector: 'Banking', price: 52000, divRate: 0.0042 },
  { id: 'amb', icon: '🥃', name: 'Amberfield Distillers', sector: 'Spirits', price: 6700, divRate: 0.0030 },
  { id: 'fort', icon: '🎰', name: 'Fortune Casinos Group', sector: 'Gaming', price: 9200, divRate: 0.0036 },
  { id: 'mer', icon: '🏢', name: 'Meridian Realty Trust', sector: 'Property', price: 35000, divRate: 0.0024 },
  { id: 'sw', icon: '📡', name: 'Skywave Telecom', sector: 'Telecom', price: 7600, divRate: 0.0027 },
  { id: 'forge', icon: '⚙️', name: 'Forgeline Steelworks', sector: 'Industrial', price: 5600, divRate: 0.0030 },
  { id: 'pan', icon: '🎬', name: 'Panorama Media Group', sector: 'Media', price: 12600, divRate: 0.0024 },
  { id: 'sen', icon: '🛡️', name: 'Sentinel Security Corp', sector: 'Private Security', price: 20000, divRate: 0.0033 },
  { id: 'volt', icon: '⚡', name: 'Volt Energy Holdings', sector: 'Energy', price: 88000, divRate: 0.0039 },
  { id: 'harv', icon: '🌾', name: 'Harvestline Agriculture', sector: 'Agriculture', price: 3200, divRate: 0.0033 },
  { id: 'pixel', icon: '🎮', name: 'Pixelforge Interactive', sector: 'Gaming Tech', price: 15400, divRate: 0.0027 },
  { id: 'medi', icon: '💊', name: 'Meditrust Pharmaceuticals', sector: 'Pharma', price: 41000, divRate: 0.0036 },
  { id: 'cloud', icon: '☁️', name: 'Cloudspire Data Systems', sector: 'Cloud Computing', price: 26500, divRate: 0.0024 },
  { id: 'ore', icon: '⛏️', name: 'Ironvein Mining Co.', sector: 'Mining', price: 9800, divRate: 0.0039 },
  { id: 'fash', icon: '👗', name: 'Vellara Fashion House', sector: 'Retail Fashion', price: 5100, divRate: 0.0030 },
  { id: 'auto2', icon: '🚚', name: 'Continental Freight Co.', sector: 'Trucking', price: 3900, divRate: 0.0033 },
];

const FOREX_INIT = [
  { pair: 'EUR/USD', flag: '🇪🇺', rate: 1.0710 },
  { pair: 'GBP/USD', flag: '🇬🇧', rate: 1.2581 },
  { pair: 'USD/JPY', flag: '🇯🇵', rate: 151.20 },
  { pair: 'USD/KES', flag: '🇰🇪', rate: 129.50 },
  { pair: 'USD/CHF', flag: '🇨🇭', rate: 0.9060 },
];

const GOVERNMENTS = [
  { name: 'Kenya', flag: '🇰🇪' }, { name: 'Nigeria', flag: '🇳🇬' }, { name: 'Egypt', flag: '🇪🇬' },
  { name: 'India', flag: '🇮🇳' }, { name: 'Brazil', flag: '🇧🇷' }, { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Turkey', flag: '🇹🇷' }, { name: 'South Africa', flag: '🇿🇦' }, { name: 'Vietnam', flag: '🇻🇳' },
  { name: 'Philippines', flag: '🇵🇭' }, { name: 'Mexico', flag: '🇲🇽' }, { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Pakistan', flag: '🇵🇰' }, { name: 'Bangladesh', flag: '🇧🇩' }, { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Ethiopia', flag: '🇪🇹' }, { name: 'Poland', flag: '🇵🇱' }, { name: 'Ukraine', flag: '🇺🇦' },
  { name: 'Thailand', flag: '🇹🇭' }, { name: 'Colombia', flag: '🇨🇴' }, { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Peru', flag: '🇵🇪' }, { name: 'Romania', flag: '🇷🇴' }, { name: 'Sri Lanka', flag: '🇱🇰' },
];

const ADVERTISING_CAMPAIGNS = [
  { id: 'flyer', icon: '📰', name: 'Local Flyer Campaign', cost: 5000, mult: 1.05, ticks: 20, rep: 1 },
  { id: 'radio', icon: '📻', name: 'Regional Radio Spots', cost: 400000, mult: 1.12, ticks: 25, rep: 3 },
  { id: 'tv', icon: '📺', name: 'National TV Campaign', cost: 20000000, mult: 1.22, ticks: 35, rep: 6 },
  { id: 'global', icon: '🌐', name: 'Global Ad Blitz', cost: 1200000000, mult: 1.4, ticks: 45, rep: 12 },
  { id: 'prime', icon: '🎥', name: 'Prime-Time Mega Campaign', cost: 60000000000, mult: 1.7, ticks: 60, rep: 25 },
];

const FORBES_NAMES = [
  'Aldric Venn', 'Mei-Lin Zhao', 'Otieno Barasa', 'Ingrid Solheim', 'Rafael Contreras',
  'Priya Anand', 'Klaus Reinholt', 'Fatima Al-Sayed', 'Jonas Eriksen', 'Chiamaka Obi',
  'Viktor Sokolov', 'Elena Papadaki', 'Hiro Tanaka', 'Amara Diallo', 'Liu Chen',
];
function initForbes() { return FORBES_NAMES.map((name, i) => ({ name, netWorth: Math.round(35000000000 * Math.pow(1.24, i)) })); }

const EVENTS = [
  { id: 'rate_hike', title: 'The Central Bank Raises Interest Rates', desc: 'Benchmark rates just jumped nationwide. Your loan book is exposed.',
    choices: [
      { label: 'Absorb the hit', kind: 'cashPct', value: -0.05, repDelta: 2, note: 'You ate the cost to keep customers loyal.' },
      { label: 'Pass it to customers', kind: 'tempMult', value: 1.15, ticks: 20, repDelta: -4, note: 'Customers grumble, but income climbs for a while.' },
    ] },
  { id: 'ai_rival', title: 'An AI-Driven Fintech Is Undercutting You', desc: 'An algorithmic rival is offering rates no human desk can match.',
    choices: [
      { label: 'Fund a counter campaign', kind: 'cashPct', value: -0.08, repDelta: 6, tempMult: 1.10, ticks: 15, note: 'Your marketing desk fights back.' },
      { label: 'Ride it out', kind: 'tempMult', value: 0.85, ticks: 20, repDelta: -2, note: 'You lose ground quietly.' },
    ] },
  { id: 'audit', title: 'Surprise Government Audit', desc: 'Regulators want your books, today.',
    choices: [
      { label: 'Cooperate fully', kind: 'cashPct', value: -0.03, repDelta: 5, note: 'The audit closes clean.' },
      { label: 'Lawyer up', kind: 'cashPctGuarded', value: -0.04, guardedValue: -0.01, repDelta: 1, note: 'Your security & legal team smooths things over.' },
    ] },
  { id: 'policy_shift', title: 'New Banking Regulation Announced', desc: 'Lending requirements just tightened across every market you operate in.',
    choices: [
      { label: 'Lobby against it', kind: 'cashPct', value: -0.06, repDelta: 4, note: 'Your lobbyists buy you an exemption.' },
      { label: 'Comply immediately', kind: 'tempMult', value: 0.9, ticks: 25, repDelta: 1, note: 'Compliance slows you down, but it is clean.' },
    ] },
  { id: 'red_carpet', title: 'Invitation: Global Finance Gala', desc: 'The red carpet is rolled out, and your name is on the list.',
    choices: [
      { label: 'Attend in style', kind: 'cashPct', value: -0.02, repDelta: 12, note: 'Cameras flash. Your name spreads.' },
      { label: 'Skip it, keep working', kind: 'tempMult', value: 1.05, ticks: 10, repDelta: -1, note: 'You stay heads-down at the office.' },
    ] },
  { id: 'hostile_takeover', title: 'Hostile Takeover Attempt', desc: 'A rival conglomerate is circling your holdings. Your banks are legally protected, but the fight still costs you.',
    choices: [
      { label: 'Pay them off', kind: 'cashPct', value: -0.10, repDelta: 0, note: 'Expensive, but the matter is closed.' },
      { label: 'Fight it in court', kind: 'gamble', winChance: 0.5, repDeltaWin: 8, repDeltaLose: -6, loseCashPct: -0.12, note: 'A costly legal battle either way.' },
    ] },
];
const INTERVIEW_QUESTIONS = [
  { q: 'A journalist asks: "What happens to your loan book if interest rates rise sharply?"', choices: ['Variable-rate loans become more expensive for borrowers, raising default risk', 'Nothing changes, rates only affect currency trading', 'All loans are automatically forgiven'], correct: 0 },
  { q: 'An investor asks: "Why do you diversify across multiple bank tiers instead of one giant bank?"', choices: ['Diversification spreads risk so one bad sector cannot sink the whole business', 'It has no effect on risk at all', 'Bigger banks are always safer, so this is unnecessary'], correct: 0 },
  { q: 'A regulator asks: "What is a bank run?"', choices: ['When too many depositors withdraw funds at once, straining the bank\u2019s reserves', 'A marketing event for new customers', 'A type of loan with no interest'], correct: 0 },
  { q: 'A reporter asks: "Why do you keep a reserve of bank cash instead of investing every dollar?"', choices: ['To keep the business solvent through downturns and cover unexpected expenses', 'Cash reserves have no purpose in banking', 'Reserves are required to buy jets only'], correct: 0 },
  { q: 'A student asks: "What does \u2018payback period\u2019 mean for one of your banks?"', choices: ['How long it takes for that bank\u2019s income to repay its purchase price', 'How long a customer has to repay a personal loan', 'The number of years a building lease runs'], correct: 0 },
  { q: 'A rival CEO asks: "Why does taking on debt carry risk even when it accelerates growth?"', choices: ['Debt must be repaid regardless of whether the investment pays off, so losses compound', 'Debt is always free money with no obligations', 'Debt automatically improves your credit rating with no downside'], correct: 0 },
  { q: 'A finance podcast asks: "What is the real cost of running a bank branch, beyond the building?"', choices: ['Staff wages, utilities, security, and ongoing maintenance', 'There are no costs once the building is purchased', 'Only the cost of the sign outside'], correct: 0 },
  { q: 'An economist asks: "Why does upgrading a bank\u2019s technology and staff increase its income?"', choices: ['Better systems and trained staff serve more customers more efficiently', 'Upgrades are purely cosmetic and do nothing', 'Upgrades only increase costs with no benefit'], correct: 0 },
  { q: 'A government auditor asks: "Why must you pay corporate tax even on reinvested profit?"', choices: ['Tax is owed on income earned, whether it is reinvested or not', 'Reinvested profit is legally invisible to regulators', 'Only personal income is ever taxed'], correct: 0 },
  { q: 'A customer advocate asks: "What happens to customer trust after a scandal or a failed audit?"', choices: ['Trust and customer numbers typically fall, hurting future income', 'Customer numbers always rise after any news coverage', 'Trust has no measurable effect on a bank\u2019s business'], correct: 0 },
];

const ECONOMIST_TIPS = [
  { title: 'Diversify Your Holdings', body: 'Never let one bank tier or one company carry your whole empire. A downturn in one sector should not be able to sink you.' },
  { title: 'Compounding Rewards Patience', body: 'Reinvested income grows faster than income you spend immediately. The banks you buy today quietly fund the ones you buy next month.' },
  { title: 'Separate Business From Personal', body: 'Smart operators pay themselves a modest, steady salary from the business rather than raiding company capital for personal spending. It keeps the business solvent.' },
  { title: 'Taxes Are a Cost of Doing Business', body: 'Corporate and personal tax are not optional — plan your expansion assuming a meaningful slice of income is already spoken for.' },
  { title: 'Leverage Cuts Both Ways', body: 'Loans and margin can accelerate growth, but a string of defaults can undo months of progress. Never lend out money you cannot afford to lose.' },
  { title: 'Upkeep Is Real', body: 'A mansion or a private jet does not just cost money to buy — it costs money to maintain. Scale your lifestyle to your income, not your net worth.' },
  { title: 'Watch the Payback Period', body: 'A cheaper asset that pays for itself quickly often beats an expensive one that takes forever to break even.' },
  { title: 'Reputation Opens Doors', body: 'Board approval, red-carpet invitations, and favorable press all hinge on reputation — it is worth protecting even when it costs a little cash.' },
  { title: 'Markets Are Never Flat', body: 'Share prices and currency rates drift constantly, and occasionally swing hard. Do not assume today\u2019s price will still be there tomorrow.' },
  { title: 'Security Has Value', body: 'Bodyguards and soldiers are not just flavor — they measurably reduce your losses from audits, defaults, and hostile takeovers.' },
  { title: 'A Board Needs a Quorum', body: 'You cannot govern an empire alone. Directors and a secretary unlock formal board votes that can bring in acquisitions for free.' },
  { title: 'Dividends Reward Ownership', body: 'The more shares of a company you hold, the larger your slice of every payout — small stakes only ever pay small dividends.' },
];

const BOARD_AGENDAS = [
  { id: 'dividend', title: 'Approve a Dividend Payout to Shareholders?', choices: [
    { label: 'Approve', kind: 'cashPct', value: -0.10, repDelta: 8 },
    { label: 'Reject', kind: 'none', repDelta: -5 } ] },
  { id: 'acquire', title: 'Vote to Acquire a Struggling Competitor Bank?', choices: [
    { label: 'Approve', kind: 'cashPct', value: -0.15, repDelta: 3, grantBank: true },
    { label: 'Reject', kind: 'none', repDelta: 2 } ] },
  { id: 'expand', title: 'Authorize Expansion Into a New Regulatory Zone?', choices: [
    { label: 'Authorize', kind: 'cashPct', value: -0.08, repDelta: 2, tempMult: 1.2, ticks: 30 },
    { label: 'Hold off', kind: 'none', repDelta: 0 } ] },
  { id: 'bonus', title: 'The Board Proposes an Executive Bonus Package for You', choices: [
    { label: 'Accept', kind: 'bonusIncome', repDelta: -3 },
    { label: 'Decline publicly', kind: 'none', repDelta: 6 } ] },
];

function formatMoney(n) {
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n || 0);
  if (n >= 1e12) return sign + '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return sign + '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return sign + '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return sign + '$' + (n / 1e3).toFixed(1) + 'K';
  return sign + '$' + n.toFixed(0);
}
function formatUnits(n) {
  n = Math.abs(n || 0);
  if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(n % 1e3 === 0 ? 0 : 1) + 'K';
  return n.toFixed(0);
}

/* In-game calendar: 1 real day = 1 game day, measured from when the empire was founded */
function daysSince(startTimestamp) {
  if (!startTimestamp) return 0;
  return Math.max(0, Math.floor((Date.now() - startTimestamp) / 86400000));
}
function gameDateParts(startTimestamp) {
  const totalDays = daysSince(startTimestamp);
  const year = Math.floor(totalDays / 365) + 1;
  const dayOfYear = totalDays % 365;
  const week = Math.floor(dayOfYear / 7) + 1;
  const dayOfWeek = (dayOfYear % 7) + 1;
  return { year, week, dayOfWeek, dayOfYear: dayOfYear + 1, totalDays };
}
function gameDateLabel(startTimestamp) {
  const { year, week, dayOfWeek, totalDays } = gameDateParts(startTimestamp);
  return totalDays === 0 ? 'Day 1 of your empire — founded today' : `Year ${year} · Week ${week} · Day ${dayOfWeek} of week (Day ${totalDays + 1} overall)`;
}
function gameDateShort(startTimestamp) {
  const { year, dayOfYear } = gameDateParts(startTimestamp);
  return `Y${year}·D${dayOfYear}`;
}

const SCALE_MULT = [1, 10, 100, 1000];
const SCALE_LABEL = ['x1', 'x10', 'x100', 'x1000'];

/* ============================================================================
   THEME — pure black
   ========================================================================== */
const COLORS = {
  bg: '#0A0A0C', panel: '#101114', card: '#15161A', cardElevated: '#1C1E24',
  cardBorder: 'rgba(255,255,255,0.09)', cardBorderActive: 'rgba(43,196,150,0.55)',
  gold: '#D9C08A', accent: '#2BC496', warn: '#E0A03C', text: '#EDEDEF', muted: '#8B8E96',
  emerald: '#34D399', crimson: '#F0605A', buy: '#1FAE7A', sell: '#D6473F',
  serif: "Georgia, 'Times New Roman', serif", mono: "'Courier New', monospace",
  shadow: '0 4px 14px rgba(0,0,0,0.5)',
};
// kept for save-file compatibility with older code paths that reference it
COLORS.parchment = COLORS.text;
const SAVE_KEY = 'banking-empire-save-v3';
const BG_IMAGE = 'data:image/jpeg;base64,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';

/* Lightweight dependency-free sparkline with gridlines, gradient fill, glow, and min/max labels */
let sparkUid = 0;
function Sparkline({ data, color, height = 60, fill = true, labelFormatter, showChange = false }) {
  const gradId = useRef(`spark-grad-${sparkUid++}`).current;
  const glowId = useRef(`spark-glow-${sparkUid++}`).current;
  if (!data || data.length < 2) return <div style={{ height }} />;
  const w = 300;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * height]);
  const lineStr = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaStr = `0,${height} ${lineStr} ${w},${height}`;
  const change = ((data[data.length - 1] - data[0]) / (data[0] || 1)) * 100;
  const changeUp = change >= 0;
  return (
    <div style={{ position: 'relative' }}>
      {labelFormatter && (
        <>
          <div style={{ position: 'absolute', top: -2, left: 0, fontSize: 10, color: COLORS.muted, fontFamily: COLORS.mono }}>{labelFormatter(max)}</div>
          <div style={{ position: 'absolute', bottom: -2, left: 0, fontSize: 10, color: COLORS.muted, fontFamily: COLORS.mono }}>{labelFormatter(min)}</div>
        </>
      )}
      {showChange && (
        <div style={{ position: 'absolute', top: -2, right: 0, fontSize: 10.5, fontFamily: COLORS.mono, fontWeight: 700, color: changeUp ? COLORS.emerald : COLORS.crimson }}>
          {changeUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={0} x2={w} y1={height * f} y2={height * f} stroke="#161a20" strokeWidth="1" />)}
        {fill && <polygon points={areaStr} fill={`url(#${gradId})`} />}
        <polyline points={lineStr} fill="none" stroke={color} strokeWidth="2" filter={`url(#${glowId})`} />
      </svg>
    </div>
  );
}

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ============================================================================
   MAIN COMPONENT
   ========================================================================== */
function BankingEmpireInner() {
  const isNativeApp = useMemo(() => Capacitor.isNativePlatform(), []);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  const [bankCash, setBankCash] = useState(12000);
  const [personalCash, setPersonalCash] = useState(1500);
  const [customerIndex, setCustomerIndex] = useState(CUSTOMER_BASE);
  const [bankUpgrades, setBankUpgrades] = useState({});
  const [mintAuthority, setMintAuthority] = useState(false);
  const [activeInterview, setActiveInterview] = useState(null);
  const [interviewResult, setInterviewResult] = useState(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [reputation, setReputation] = useState(0);
  const [ownedBanks, setOwnedBanks] = useState([]);
  const [houseTier, setHouseTier] = useState(0);
  const [carTier, setCarTier] = useState(0);
  const [jetTier, setJetTier] = useState(0);
  const [chopperTier, setChopperTier] = useState(0);
  const [shipTier, setShipTier] = useState(0);
  const [vaultTier, setVaultTier] = useState(0);
  const [luxuryOwned, setLuxuryOwned] = useState([]);
  const [staff, setStaff] = useState({ assistant: false, manager: false, secretary: false, treasurer: false, directors: 0, bodyguards: 0, soldiers: 0 });
  const [companies, setCompanies] = useState(COMPANIES_INIT.map((c) => ({ ...c, history: [c.price] })));
  const [companyHoldings, setCompanyHoldings] = useState({});
  const [selectedCompanyId, setSelectedCompanyId] = useState(COMPANIES_INIT[0].id);
  const [forex, setForex] = useState(FOREX_INIT.map((f) => ({ ...f, history: [f.rate] })));
  const [forexHoldings, setForexHoldings] = useState({});
  const [lendingBook, setLendingBook] = useState([]);
  const [govLoans, setGovLoans] = useState([]);
  const [adMult, setAdMult] = useState(1);
  const [adMultUntil, setAdMultUntil] = useState(0);
  const [tempMult, setTempMult] = useState(1);
  const [tempMultUntil, setTempMultUntil] = useState(0);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeBoard, setActiveBoard] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [forbes, setForbes] = useState(initForbes());
  const [scaleIdx, setScaleIdx] = useState(0);
  const [avatarDataUrl, setAvatarDataUrl] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [tab, setTab] = useState('empire');
  const nativeAdSlotRef = useRef(null);
  const [exchangeSub, setExchangeSub] = useState('companies');
  const [lendSub, setLendSub] = useState('business');
  const [officeSub, setOfficeSub] = useState('board');
  const [toast, setToast] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedTick, setLastSavedTick] = useState(null);

  const stateRef = useRef();
  const pendingRef = useRef(false);
  const lastEventTickRef = useRef(-99999);
  const lastBoardTickRef = useRef(-99999);
  const lastInterviewTickRef = useRef(-99999);
  stateRef.current = { bankCash, personalCash, ownedBanks, staff, tempMult, tempMultUntil, adMult, adMultUntil, tick, reputation, lendingBook, govLoans, forex, activeEvent, activeBoard, companies, companyHoldings, houseTier, carTier, jetTier, chopperTier, shipTier, vaultTier, luxuryOwned, customerIndex, bankUpgrades, activeInterview };

  /* ---------- load save ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(SAVE_KEY, false);
        if (res && res.value) {
          const d = JSON.parse(res.value);
          setBankCash(d.bankCash ?? 12000);
          setPersonalCash(d.personalCash ?? 1500);
          setTotalEarned(d.totalEarned ?? 0);
          setReputation(d.reputation ?? 0);
          setOwnedBanks(d.ownedBanks ?? []);
          setHouseTier(d.houseTier ?? 0);
          setCarTier(d.carTier ?? 0);
          setJetTier(d.jetTier ?? 0);
          setChopperTier(d.chopperTier ?? 0);
          setShipTier(d.shipTier ?? 0);
          setVaultTier(d.vaultTier ?? 0);
          setLuxuryOwned(d.luxuryOwned ?? []);
          setStaff(d.staff ?? { assistant: false, manager: false, secretary: false, treasurer: false, directors: 0, bodyguards: 0, soldiers: 0 });
          setCompanies(d.companies ?? COMPANIES_INIT.map((c) => ({ ...c, history: [c.price] })));
          setCompanyHoldings(d.companyHoldings ?? {});
          setForex(d.forex ?? FOREX_INIT.map((f) => ({ ...f, history: [f.rate] })));
          setForexHoldings(d.forexHoldings ?? {});
          setForbes(d.forbes ?? initForbes());
          setLedger(d.ledger ?? []);
          setTick(d.tick ?? 0);
          setAvatarDataUrl(d.avatarDataUrl ?? null);
          setDisplayName(d.displayName ?? '');
          setStartTimestamp(d.startTimestamp ?? Date.now());
          setCustomerIndex(d.customerIndex ?? CUSTOMER_BASE);
          setBankUpgrades(d.bankUpgrades ?? {});
          setMintAuthority(d.mintAuthority ?? false);
        } else {
          setStartTimestamp(Date.now());
        }
      } catch (e) { setStartTimestamp(Date.now()); /* fresh start */ }
      setLoaded(true);
    })();
  }, []);

  /* ---------- save periodically ---------- */
  useEffect(() => {
    if (!loaded) return;
    if (!window.storage || typeof window.storage.set !== 'function') { setSaveStatus('unsupported'); return; }
    const t = setInterval(async () => {
      const snap = {
        bankCash: stateRef.current.bankCash, personalCash: stateRef.current.personalCash, totalEarned, reputation: stateRef.current.reputation,
        ownedBanks: stateRef.current.ownedBanks, houseTier, carTier, jetTier, chopperTier, shipTier, vaultTier, luxuryOwned,
        staff: stateRef.current.staff, companies, companyHoldings, forex: stateRef.current.forex,
        forexHoldings, forbes, ledger, tick: stateRef.current.tick, avatarDataUrl, displayName, startTimestamp,
        customerIndex: stateRef.current.customerIndex, bankUpgrades: stateRef.current.bankUpgrades, mintAuthority,
      };
      try {
        const res = await window.storage.set(SAVE_KEY, JSON.stringify(snap), false);
        if (res) { setSaveStatus('ok'); setLastSavedTick(stateRef.current.tick); } else setSaveStatus('error');
      } catch (e) { setSaveStatus('error'); }
    }, 6000);
    return () => clearInterval(t);
  }, [loaded, totalEarned, houseTier, carTier, jetTier, chopperTier, shipTier, vaultTier, luxuryOwned, companies, companyHoldings, forexHoldings, forbes, ledger, avatarDataUrl, displayName, mintAuthority]);

  const addLedger = useCallback((text) => {
    setLedger((l) => [{ t: Date.now(), tick: stateRef.current.tick, text }, ...l].slice(0, 150));
  }, []);

  /* Ads: init once on mount, show the banner, and fire an interstitial every 5 levels */
  useEffect(() => {
    initAds().then(showBanner);
    return () => { hideBanner(); };
  }, []);

  /* Native Advanced ad: only ever visible on the Empire tab (where its slot
     element actually exists in the DOM), and re-measured whenever that tab
     becomes active. It's a native overlay, not real WebView content, so it
     must be explicitly hidden the moment you navigate away or it'll float
     on top of whatever tab you switch to. */
  useEffect(() => {
    if (tab === 'empire' && isNativeApp) {
      const id = setTimeout(() => showNativeAd(nativeAdSlotRef.current), 200);
      return () => { clearTimeout(id); hideNativeAd(); };
    }
    hideNativeAd();
  }, [tab, isNativeApp]);

  const level = levelFromEarned(totalEarned);
  useEffect(() => { maybeShowInterstitialForLevel(level); }, [level]);
  const title = titleForLevel(level);
  const xpIntoLevel = totalEarned - CUM_XP[level - 1];
  const xpForLevel = level < 100 ? CUM_XP[level] - CUM_XP[level - 1] : 1;
  const xpPct = level >= 100 ? 100 : Math.min(100, (xpIntoLevel / xpForLevel) * 100);

  const incomeBonusPct = (staff.assistant ? 0.03 : 0) + (staff.manager ? 0.10 : 0) + (staff.directors * 0.02);

  const passiveIncome = useMemo(() => {
    const base = ownedBanks.reduce((sum, id) => {
      const b = ALL_BANKS[id];
      if (!b) return sum;
      const lvl = bankUpgrades[id] || 0;
      return sum + b.income * (1 + lvl * BANK_UPGRADE_INCOME_BONUS);
    }, 0);
    const customerMult = customerIndex / CUSTOMER_BASE;
    return base * (1 + incomeBonusPct) * tempMult * adMult * customerMult;
  }, [ownedBanks, incomeBonusPct, tempMult, adMult, bankUpgrades, customerIndex]);

  const dividendIncome = useMemo(() => (
    Object.entries(companyHoldings).reduce((s, [id, qty]) => {
      const c = companies.find((x) => x.id === id);
      return s + (c && qty ? c.price * qty * c.divRate : 0);
    }, 0)
  ), [companyHoldings, companies]);
  // dividendIncome is shown in the header as part of the income rate, but the actual
  // per-tick payout below reads fresh prices/holdings from stateRef so this memo
  // changing every 2s (as prices drift) never has to restart the game-loop interval.

  const assetValue = useMemo(() => {
    const houseVal = HOUSES.slice(0, houseTier + 1).reduce((s, h) => s + h.cost, 0) * 0.7;
    const carVal = CARS.slice(0, carTier + 1).reduce((s, c) => s + c.cost, 0) * 0.6;
    const jetVal = JETS.slice(0, jetTier + 1).reduce((s, j) => s + j.cost, 0) * 0.6;
    const chopperVal = CHOPPERS.slice(0, chopperTier + 1).reduce((s, j) => s + j.cost, 0) * 0.6;
    const shipVal = SHIPS.slice(0, shipTier + 1).reduce((s, j) => s + j.cost, 0) * 0.6;
    const vaultVal = VAULTS.slice(0, vaultTier + 1).reduce((s, j) => s + j.cost, 0) * 0.6;
    const luxVal = luxuryOwned.reduce((s, id) => s + (LUXURY_ITEMS.find((l) => l.id === id)?.cost || 0), 0);
    const bankVal = ownedBanks.reduce((s, id) => s + (ALL_BANKS[id] ? ALL_BANKS[id].cost : 0), 0);
    const compVal = Object.entries(companyHoldings).reduce((s, [id, qty]) => {
      const c = companies.find((x) => x.id === id); return s + (c ? c.price * qty : 0);
    }, 0);
    const fxVal = Object.entries(forexHoldings).reduce((s, [pair, units]) => {
      const f = forex.find((x) => x.pair === pair); return s + (f ? f.rate * units : 0);
    }, 0);
    const lendVal = lendingBook.reduce((s, l) => s + l.amount, 0) + govLoans.reduce((s, l) => s + l.amount, 0);
    return houseVal + carVal + jetVal + chopperVal + shipVal + vaultVal + luxVal + bankVal + compVal + fxVal + lendVal;
  }, [houseTier, carTier, jetTier, chopperTier, shipTier, vaultTier, luxuryOwned, ownedBanks, companyHoldings, companies, forexHoldings, forex, lendingBook, govLoans]);

  const netWorth = bankCash + personalCash + assetValue + reputation * 1000;
  const prestige = HOUSES[houseTier].prestige + CARS[carTier].prestige + JETS[jetTier].prestige + CHOPPERS[chopperTier].prestige + SHIPS[shipTier].prestige + VAULTS[vaultTier].prestige +
    luxuryOwned.reduce((s, id) => s + (LUXURY_ITEMS.find((l) => l.id === id)?.prestige || 0), 0);

  const forbesRanked = useMemo(() => {
    const list = [...forbes, { name: displayName || 'YOU', netWorth, isPlayer: true }];
    list.sort((a, b) => b.netWorth - a.netWorth);
    return list;
  }, [forbes, netWorth, displayName]);
  const playerRank = forbesRanked.findIndex((p) => p.isPlayer) + 1;

  /* ---------- game loop ---------- */
  useEffect(() => {
    if (!loaded) return;
    let localTick = 0;
    const iv = setInterval(() => {
      localTick++;
      setTick((t) => t + 1);
      const divInc = Object.entries(stateRef.current.companyHoldings).reduce((s, [id, qty]) => {
        const c = stateRef.current.companies.find((x) => x.id === id);
        return s + (c && qty ? c.price * qty * c.divRate : 0);
      }, 0);
      // A bank is a building: workers, resources, and maintenance come off the top
      // before the government or anyone else sees a cent of it.
      const bankOperatingCost = passiveIncome * BANK_OPERATING_RATE;
      const grossBankIncome = (passiveIncome - bankOperatingCost) + divInc;
      const corpTax = grossBankIncome * CORP_TAX_RATE;
      const netBankIncome = grossBankIncome - corpTax;

      const st = stateRef.current.staff;
      const crewCost = (st.assistant ? CREW_SALARY.assistant : 0) + (st.manager ? CREW_SALARY.manager : 0) +
        (st.secretary ? CREW_SALARY.secretary : 0) + (st.treasurer ? CREW_SALARY.treasurer : 0) +
        st.directors * CREW_SALARY.director + st.bodyguards * CREW_SALARY.bodyguard + st.soldiers * CREW_SALARY.soldier;

      const salaryGross = netBankIncome * SALARY_RATE;
      const personalTax = salaryGross * PERSONAL_TAX_RATE;
      const salaryNet = salaryGross - personalTax;

      setBankCash((c) => Math.max(0, c + netBankIncome - salaryGross - crewCost));

      const upkeep = (
        HOUSES[stateRef.current.houseTier].cost + CARS[stateRef.current.carTier].cost +
        JETS[stateRef.current.jetTier].cost + CHOPPERS[stateRef.current.chopperTier].cost +
        SHIPS[stateRef.current.shipTier].cost + VAULTS[stateRef.current.vaultTier].cost +
        stateRef.current.luxuryOwned.reduce((s2, id) => s2 + (LUXURY_ITEMS.find((l) => l.id === id)?.cost || 0), 0)
      ) * UPKEEP_RATE;
      setPersonalCash((c) => Math.max(0, c + salaryNet - upkeep));

      setTotalEarned((e) => e + netBankIncome);

      setTempMultUntil((until) => { if (until > 0 && stateRef.current.tick + 1 >= until) { setTempMult(1); return 0; } return until; });
      setAdMultUntil((until) => { if (until > 0 && stateRef.current.tick + 1 >= until) { setAdMult(1); return 0; } return until; });

      if (localTick % 2 === 0) {
        setCompanies((prev) => prev.map((c) => {
          const spike = Math.random() < 0.04;
          const drift = spike ? (Math.random() - 0.5) * 0.32 : (Math.random() - 0.5) * 0.09;
          const price = Math.max(1, c.price * (1 + drift));
          return { ...c, price, history: [...c.history, price].slice(-24) };
        }));
        setForex((prev) => prev.map((f) => {
          const spike = Math.random() < 0.04;
          const drift = spike ? (Math.random() - 0.5) * 0.10 : (Math.random() - 0.5) * 0.022;
          const rate = Math.max(0.0001, f.rate * (1 + drift));
          return { ...f, rate, history: [...f.history, rate].slice(-24) };
        }));
        setForbes((prev) => prev.map((p) => ({ ...p, netWorth: p.netWorth * (1 + Math.random() * 0.008) })));
      }

      setLendingBook((prev) => {
        const remaining = [];
        prev.forEach((loan) => {
          if (stateRef.current.tick + 1 >= loan.resolveTick) {
            const guardBonus = Math.min(0.10, stateRef.current.staff.bodyguards * 0.005);
            if (Math.random() < 0.85 + guardBonus) {
              const ret = loan.amount * 1.28;
              setBankCash((c) => c + ret);
              addLedger(`Loan to ${loan.npc} repaid in full: +${formatMoney(ret)}`);
            } else {
              const recovery = stateRef.current.staff.soldiers >= 5 ? loan.amount * 0.3 : 0;
              setBankCash((c) => c + recovery);
              addLedger(`Loan to ${loan.npc} defaulted. Recovered ${formatMoney(recovery)}`);
            }
          } else remaining.push(loan);
        });
        return remaining;
      });

      setGovLoans((prev) => {
        const remaining = [];
        prev.forEach((loan) => {
          if (stateRef.current.tick + 1 >= loan.resolveTick) {
            if (Math.random() < 0.92) {
              const ret = loan.amount * 1.4;
              setBankCash((c) => c + ret);
              addLedger(`${loan.flag} ${loan.country} repaid its sovereign loan in full: +${formatMoney(ret)}`);
            } else {
              const recovery = loan.amount * 0.6;
              setBankCash((c) => c + recovery);
              addLedger(`${loan.flag} ${loan.country} restructured its debt. Recovered ${formatMoney(recovery)}`);
            }
          } else remaining.push(loan);
        });
        return remaining;
      });

      const EVENT_COOLDOWN = 180; // 3 minutes between random events, minimum
      const BOARD_COOLDOWN = 240; // 4 minutes between board meetings, minimum
      if (!stateRef.current.activeEvent && !stateRef.current.activeBoard && !stateRef.current.activeInterview && !pendingRef.current
        && stateRef.current.tick - lastEventTickRef.current >= EVENT_COOLDOWN
        && Math.random() < 0.02 && stateRef.current.tick > 30) {
        pendingRef.current = true;
        lastEventTickRef.current = stateRef.current.tick;
        showToast('⚠️ A situation is developing at headquarters...');
        const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        setTimeout(() => { setActiveEvent(ev); pendingRef.current = false; }, 750);
      }
      if (!stateRef.current.activeEvent && !stateRef.current.activeBoard && !stateRef.current.activeInterview && !pendingRef.current
        && stateRef.current.tick - lastBoardTickRef.current >= BOARD_COOLDOWN
        && staff.secretary && staff.directors > 0 && stateRef.current.tick > 30) {
        pendingRef.current = true;
        lastBoardTickRef.current = stateRef.current.tick;
        showToast('📋 The board is convening...');
        const ag = BOARD_AGENDAS[Math.floor(Math.random() * BOARD_AGENDAS.length)];
        setTimeout(() => { setActiveBoard(ag); pendingRef.current = false; }, 750);
      }
      const INTERVIEW_COOLDOWN = 300; // 5 minutes between press interviews
      if (!stateRef.current.activeEvent && !stateRef.current.activeBoard && !stateRef.current.activeInterview && !pendingRef.current
        && stateRef.current.tick - lastInterviewTickRef.current >= INTERVIEW_COOLDOWN
        && stateRef.current.tick > 60 && Math.random() < 0.02) {
        pendingRef.current = true;
        lastInterviewTickRef.current = stateRef.current.tick;
        showToast('🎙️ A journalist wants a word...');
        const q = INTERVIEW_QUESTIONS[Math.floor(Math.random() * INTERVIEW_QUESTIONS.length)];
        setTimeout(() => { setActiveInterview(q); setInterviewResult(null); pendingRef.current = false; }, 750);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [loaded, passiveIncome, staff, addLedger]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  /* ---------- actions ---------- */
  function buyBank(bank) {
    if (ownedBanks.includes(bank.id)) return;
    if (level < bank.minLevel) return showToast(`Requires level ${bank.minLevel}`);
    if (bankCash < bank.cost) return showToast('Not enough bank cash');
    setBankCash((c) => c - bank.cost);
    setOwnedBanks((o) => [...o, bank.id]);
    addLedger(`Acquired ${bank.name} for ${formatMoney(bank.cost)} — permanent holding`);
  }
  function buyHouse(idx) { if (idx <= houseTier) return; const h = HOUSES[idx]; if (personalCash < h.cost) return showToast('Not enough personal cash'); setPersonalCash((c) => c - h.cost); setHouseTier(idx); addLedger(`Moved into ${h.name} for ${formatMoney(h.cost)} (personal)`); }
  function buyCar(idx) { if (idx <= carTier) return; const c0 = CARS[idx]; if (personalCash < c0.cost) return showToast('Not enough personal cash'); setPersonalCash((c) => c - c0.cost); setCarTier(idx); addLedger(`Purchased ${c0.name} for ${formatMoney(c0.cost)} (personal)`); }
  function buyJet(idx) { if (idx <= jetTier) return; const j = JETS[idx]; if (personalCash < j.cost) return showToast('Not enough personal cash'); setPersonalCash((c) => c - j.cost); setJetTier(idx); addLedger(`Took delivery of ${j.name} for ${formatMoney(j.cost)} (personal)`); }
  function buyChopper(idx) { if (idx <= chopperTier) return; const j = CHOPPERS[idx]; if (personalCash < j.cost) return showToast('Not enough personal cash'); setPersonalCash((c) => c - j.cost); setChopperTier(idx); addLedger(`Took delivery of ${j.name} for ${formatMoney(j.cost)} (personal)`); }
  function buyShip(idx) { if (idx <= shipTier) return; const j = SHIPS[idx]; if (personalCash < j.cost) return showToast('Not enough personal cash'); setPersonalCash((c) => c - j.cost); setShipTier(idx); addLedger(`Took delivery of ${j.name} for ${formatMoney(j.cost)} (personal)`); }
  function buyVault(idx) { if (idx <= vaultTier) return; const j = VAULTS[idx]; if (personalCash < j.cost) return showToast('Not enough personal cash'); setPersonalCash((c) => c - j.cost); setVaultTier(idx); addLedger(`Installed ${j.name} for ${formatMoney(j.cost)} (personal)`); }
  function buyLuxury(item) { if (luxuryOwned.includes(item.id)) return; if (personalCash < item.cost) return showToast('Not enough personal cash'); setPersonalCash((c) => c - item.cost); setLuxuryOwned((l) => [...l, item.id]); addLedger(`Acquired ${item.name} for ${formatMoney(item.cost)} (personal)`); }

  function hireStaff(key) { const def = STAFF_DEFS[key]; if (staff[key]) return; if (bankCash < def.cost) return showToast('Not enough bank cash'); setBankCash((c) => c - def.cost); setStaff((s) => ({ ...s, [key]: true })); addLedger(`Hired your ${def.name} for ${formatMoney(def.cost)}`); }
  function hireDirector() { if (staff.directors >= MAX_DIRECTORS) return; const cost = DIRECTOR_BASE_COST * (staff.directors + 1); if (bankCash < cost) return showToast('Not enough bank cash'); setBankCash((c) => c - cost); setStaff((s) => ({ ...s, directors: s.directors + 1 })); addLedger(`Appointed board director #${staff.directors + 1} for ${formatMoney(cost)}`); }
  function hireGuard(type) { const isBody = type === 'bodyguards'; const cost = isBody ? BODYGUARD_COST : SOLDIER_COST; const max = isBody ? MAX_BODYGUARDS : MAX_SOLDIERS; if (staff[type] >= max) return; if (bankCash < cost) return showToast('Not enough bank cash'); setBankCash((c) => c - cost); setStaff((s) => ({ ...s, [type]: s[type] + 1 })); addLedger(`${isBody ? 'Hired a bodyguard' : 'Enlisted a soldier'} for ${formatMoney(cost)}`); }

  function tradeCompany(id, dir) {
    const c = companies.find((x) => x.id === id);
    if (!c) return;
    const qty = SCALE_MULT[scaleIdx];
    if (dir === 'buy') {
      const cost = c.price * qty;
      if (bankCash < cost) return showToast('Not enough bank cash');
      setBankCash((cc) => cc - cost);
      setCompanyHoldings((h) => ({ ...h, [id]: (h[id] || 0) + qty }));
      addLedger(`Bought ${qty} shares of ${c.name} @ ${formatMoney(c.price)}`);
    } else {
      const have = companyHoldings[id] || 0;
      const sellQty = Math.min(qty, have);
      if (sellQty <= 0) return showToast('No shares to sell');
      setBankCash((cc) => cc + c.price * sellQty);
      setCompanyHoldings((h) => ({ ...h, [id]: have - sellQty }));
      addLedger(`Sold ${sellQty} shares of ${c.name} @ ${formatMoney(c.price)}`);
    }
  }
  function tradeForex(pair, dir) {
    const f = forex.find((x) => x.pair === pair);
    if (!f) return;
    const units = 1000 * SCALE_MULT[scaleIdx];
    if (dir === 'buy') {
      const cost = f.rate * units;
      if (bankCash < cost) return showToast('Not enough bank cash');
      setBankCash((c) => c - cost);
      setForexHoldings((h) => ({ ...h, [pair]: (h[pair] || 0) + units }));
      addLedger(`Bought ${formatUnits(units)} ${pair.split('/')[0]}`);
    } else {
      const have = forexHoldings[pair] || 0;
      const sellUnits = Math.min(units, have);
      if (sellUnits <= 0) return showToast('Nothing held to sell');
      setBankCash((c) => c + f.rate * sellUnits);
      setForexHoldings((h) => ({ ...h, [pair]: have - sellUnits }));
      addLedger(`Sold ${formatUnits(sellUnits)} ${pair.split('/')[0]}`);
    }
  }

  function issueLoan(pctOfCash) {
    const amount = Math.round(bankCash * pctOfCash);
    if (amount < 100) return showToast('Not enough bank cash to lend');
    setBankCash((c) => c - amount);
    const npc = FORBES_NAMES[Math.floor(Math.random() * FORBES_NAMES.length)];
    setLendingBook((l) => [...l, { id: Math.random(), amount, npc, resolveTick: tick + 90 }]);
    addLedger(`Issued a business loan of ${formatMoney(amount)} to ${npc}`);
  }
  function issueGovLoan(pctOfCash) {
    const amount = Math.round(bankCash * pctOfCash);
    if (amount < 100) return showToast('Not enough bank cash to lend');
    setBankCash((c) => c - amount);
    const gov = GOVERNMENTS[Math.floor(Math.random() * GOVERNMENTS.length)];
    setGovLoans((l) => [...l, { id: Math.random(), amount, country: gov.name, flag: gov.flag, resolveTick: tick + 150 }]);
    addLedger(`Issued a sovereign loan of ${formatMoney(amount)} to ${gov.flag} ${gov.name}`);
  }
  function launchCampaign(camp) {
    if (bankCash < camp.cost) return showToast('Not enough bank cash');
    setBankCash((c) => c - camp.cost);
    setAdMult(camp.mult);
    setAdMultUntil(tick + camp.ticks);
    setReputation((r) => r + camp.rep);
    addLedger(`Launched ${camp.name} for ${formatMoney(camp.cost)}`);
  }

  const [rewardPending, setRewardPending] = useState(null);
  function claimReward(itemId) {
    if (rewardPending) return;
    setRewardPending(itemId);
    showRewardedAd(
      (rewardType, rewardAmount) => {
        if (itemId === 'investor_briefing') {
          const gain = Math.max(1500, Math.round(personalCash * 0.12));
          setPersonalCash((c) => c + gain);
          addLedger(`Watched a sponsor video — Investor Briefing paid out ${formatMoney(gain)} personally`);
          showToast(`+${formatMoney(gain)} personal cash`);
        } else if (itemId === 'confidence_campaign') {
          setCustomerIndex((c) => c + 15);
          addLedger('Watched a sponsor video — Confidence Campaign: +15 customer confidence');
          showToast('+15 customer confidence');
        } else if (itemId === 'emergency_capital') {
          const gain = Math.max(10000, Math.round(bankCash * 0.10));
          setBankCash((c) => c + gain);
          addLedger(`Watched a sponsor video — Emergency Capital injection of ${formatMoney(gain)} into the bank`);
          showToast(`+${formatMoney(gain)} bank cash`);
        }
        setRewardPending(null);
      },
      (reason) => {
        setRewardPending(null);
        if (reason === 'not-native') showToast('Rewarded ads only work in the installed app');
        else showToast('Ad not available right now — try again shortly');
      }
    );
  }

  function resolveEvent(ev, choice) {
    let repDelta = choice.repDelta || 0;
    if (choice.kind === 'cashPct') setBankCash((c) => Math.max(0, c + c * choice.value));
    else if (choice.kind === 'cashPctGuarded') { const guarded = staff.bodyguards >= 5; const val = guarded ? choice.guardedValue : choice.value; setBankCash((c) => Math.max(0, c + c * val)); }
    else if (choice.kind === 'tempMult') { setTempMult(choice.value); setTempMultUntil(tick + choice.ticks); }
    else if (choice.kind === 'gamble') {
      const win = Math.random() < choice.winChance;
      repDelta = win ? choice.repDeltaWin : choice.repDeltaLose;
      if (!win && choice.loseCashPct) setBankCash((c) => Math.max(0, c + c * choice.loseCashPct));
    }
    if (choice.tempMult && choice.kind === 'cashPct') { setTempMult(choice.tempMult); setTempMultUntil(tick + choice.ticks); }
    setReputation((r) => Math.max(0, r + repDelta));
    addLedger(`${ev.title}: chose "${choice.label}" — ${choice.note || ''}`);
    setActiveEvent(null);
  }
  function resolveBoard(ag, choice) {
    let repDelta = choice.repDelta || 0;
    if (choice.kind === 'cashPct') setBankCash((c) => Math.max(0, c + c * choice.value));
    if (choice.tempMult) { setTempMult(choice.tempMult); setTempMultUntil(tick + choice.ticks); }
    if (choice.grantBank) {
      const free = ALL_BANKS.find((b) => !ownedBanks.includes(b.id) && level >= b.minLevel);
      if (free) { setOwnedBanks((o) => [...o, free.id]); addLedger(`Board acquisition brought ${free.name} into the empire, free of charge`); }
    }
    if (choice.kind === 'bonusIncome') { const bonus = passiveIncome * 60; setBankCash((c) => c + bonus); addLedger(`Accepted executive bonus of ${formatMoney(bonus)}`); }
    setReputation((r) => Math.max(0, r + repDelta));
    addLedger(`Board vote — ${ag.title}: "${choice.label}"`);
    setActiveBoard(null);
  }

  function answerInterview(choiceIdx) {
    const q = activeInterview;
    if (!q) return;
    const correct = choiceIdx === q.correct;
    const delta = correct ? (8 + Math.floor(Math.random() * 8)) : -(6 + Math.floor(Math.random() * 8));
    setCustomerIndex((c) => Math.max(20, c + delta));
    setReputation((r) => Math.max(0, r + (correct ? 5 : -4)));
    setInterviewResult({ correct, delta });
    addLedger(correct
      ? `Nailed a press interview — customer confidence +${delta}`
      : `Fumbled a press interview — customer confidence ${delta}`);
  }
  function closeInterview() {
    setActiveInterview(null);
    setInterviewResult(null);
  }

  function upgradeBank(bank) {
    const lvl = bankUpgrades[bank.id] || 0;
    if (lvl >= BANK_UPGRADE_COST_MULT.length) return;
    const cost = Math.round(bank.cost * BANK_UPGRADE_COST_MULT[lvl]);
    if (bankCash < cost) return showToast('Not enough bank cash');
    setBankCash((c) => c - cost);
    setBankUpgrades((u) => ({ ...u, [bank.id]: lvl + 1 }));
    addLedger(`Upgraded ${bank.name} to "${BANK_UPGRADE_LABELS[lvl + 1]}" for ${formatMoney(cost)}`);
  }

  function buyMintAuthority() {
    if (mintAuthority) return;
    if (bankCash < MINT_AUTHORITY_COST) return showToast('Not enough bank cash');
    setBankCash((c) => c - MINT_AUTHORITY_COST);
    setMintAuthority(true);
    setReputation((r) => r + 200);
    addLedger(`Acquired the National Mint & Currency Design Authority for ${formatMoney(MINT_AUTHORITY_COST)} — you now help design the money itself`);
  }

  async function onAvatarFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try { const url = await resizeImageFile(f); setAvatarDataUrl(url); }
    catch (err) { showToast('Could not load that image'); }
    e.target.value = '';
  }

  const tabIdx = TABS.findIndex((t) => t.key === tab);
  function prevTab() { setTab(TABS[(tabIdx - 1 + TABS.length) % TABS.length].key); }
  function nextTab() { setTab(TABS[(tabIdx + 1) % TABS.length].key); }

  if (!loaded) {
    // Data restore is still in flight — the effects below wait on `loaded`,
    // but we never block the actual UI paint on it, so a slow or failing
    // storage call can never leave the screen blank.
  }

  return (
    <div style={{ background: `linear-gradient(180deg, rgba(10,10,12,0.08) 0%, rgba(10,10,12,0.35) 30%, rgba(10,10,12,0.75) 50%, ${COLORS.bg} 78%), url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat', color: COLORS.text, height: isNativeApp ? '100vh' : '700px', paddingBottom: isNativeApp ? 52 : 0, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
      <Header level={level} title={title} netWorth={netWorth} bankCash={bankCash} personalCash={personalCash} passiveIncome={passiveIncome + dividendIncome}
        reputation={reputation} tempMult={tempMult} adMult={adMult} xpPct={xpPct} saveStatus={saveStatus} lastSavedTick={lastSavedTick} tick={tick}
        avatarDataUrl={avatarDataUrl} onAvatarClick={() => setProfileOpen(true)} displayName={displayName} startTimestamp={startTimestamp} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 18px 8px' }}>
        <button onClick={prevTab} style={navArrowBtn}><ChevronLeft size={18} /></button>
        <div style={{ fontFamily: COLORS.serif, fontSize: 13, letterSpacing: 1.5, color: COLORS.accent }}>{TABS[tabIdx].label.toUpperCase()}</div>
        <button onClick={nextTab} style={navArrowBtn}><ChevronRight size={18} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 20px', minHeight: 0 }}>
        {tab === 'empire' && (
          <EmpireTab level={level} title={title} ownedBanks={ownedBanks} prestige={prestige}
            lendingBook={lendingBook} govLoans={govLoans} lendSub={lendSub} setLendSub={setLendSub}
            issueLoan={issueLoan} issueGovLoan={issueGovLoan} tick={tick}
            houseTier={houseTier} carTier={carTier} jetTier={jetTier} chopperTier={chopperTier} shipTier={shipTier}
            adMult={adMult} adMultUntil={adMultUntil} launchCampaign={launchCampaign} bankCash={bankCash} startTimestamp={startTimestamp}
            customerIndex={customerIndex} mintAuthority={mintAuthority} buyMintAuthority={buyMintAuthority}
            isNativeApp={isNativeApp} rewardPending={rewardPending} claimReward={claimReward} nativeAdSlotRef={nativeAdSlotRef} />
        )}
        {tab === 'banks' && <BanksTab ownedBanks={ownedBanks} level={level} bankCash={bankCash} buyBank={buyBank} bankUpgrades={bankUpgrades} upgradeBank={upgradeBank} />}
        {tab === 'exchange' && (
          <ExchangeTab exchangeSub={exchangeSub} setExchangeSub={setExchangeSub}
            companies={companies} companyHoldings={companyHoldings} tradeCompany={tradeCompany}
            selectedCompanyId={selectedCompanyId} setSelectedCompanyId={setSelectedCompanyId}
            forex={forex} forexHoldings={forexHoldings} tradeForex={tradeForex}
            bankCash={bankCash} scaleIdx={scaleIdx} setScaleIdx={setScaleIdx} />
        )}
        {tab === 'assets' && <AssetsTab houseTier={houseTier} carTier={carTier} jetTier={jetTier} chopperTier={chopperTier} shipTier={shipTier} vaultTier={vaultTier} luxuryOwned={luxuryOwned} personalCash={personalCash} buyHouse={buyHouse} buyCar={buyCar} buyJet={buyJet} buyChopper={buyChopper} buyShip={buyShip} buyVault={buyVault} buyLuxury={buyLuxury} />}
        {tab === 'staff' && <StaffTab staff={staff} bankCash={bankCash} hireStaff={hireStaff} hireDirector={hireDirector} hireGuard={hireGuard} />}
        {tab === 'office' && (
          <OfficeTab officeSub={officeSub} setOfficeSub={setOfficeSub} staff={staff}
            boardLedger={ledger.filter((l) => l.text.startsWith('Board vote'))}
            forbesRanked={forbesRanked} playerRank={playerRank} ledger={ledger} />
        )}
      </div>

      <TabStrip tab={tab} setTab={setTab} />

      {activeEvent && <EventModal ev={activeEvent} onChoose={(c) => resolveEvent(activeEvent, c)} />}
      {activeBoard && <EventModal ev={{ title: activeBoard.title, desc: 'Board of Directors — formal vote required.' }} choicesOverride={activeBoard.choices} onChoose={(c) => resolveBoard(activeBoard, c)} />}
      {activeInterview && <InterviewModal q={activeInterview} result={interviewResult} onAnswer={answerInterview} onClose={closeInterview} />}
      {profileOpen && (
        <ProfileModal avatarDataUrl={avatarDataUrl} displayName={displayName} setDisplayName={setDisplayName}
          onClose={() => setProfileOpen(false)} />
      )}
      <input id="avatar-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarFile} />
      {toast && <div style={{ position: 'absolute', bottom: 66, left: '50%', transform: 'translateX(-50%)', background: COLORS.card, border: `1px solid ${COLORS.gold}`, color: COLORS.parchment, padding: '8px 16px', fontSize: 13, borderRadius: 8, zIndex: 5 }}>{toast}</div>}
    </div>
  );
}

const navArrowBtn = { background: 'none', border: 'none', color: COLORS.muted, cursor: 'pointer', padding: 6 };

/* ============================================================================
   HEADER
   ========================================================================== */
function Header({ level, title, netWorth, bankCash, personalCash, passiveIncome, reputation, tempMult, adMult, xpPct, saveStatus, lastSavedTick, tick, avatarDataUrl, onAvatarClick, displayName, startTimestamp }) {
  let saveLabel = 'saving disabled here';
  if (saveStatus === 'ok' && lastSavedTick != null) saveLabel = `saved ${Math.max(0, tick - lastSavedTick)}s ago`;
  else if (saveStatus === 'error') saveLabel = 'save failed — retrying';
  else if (saveStatus === 'idle') saveLabel = 'saving...';
  const boosted = tempMult !== 1 || adMult !== 1;
  return (
    <div style={{ margin: '12px 12px 4px', padding: '16px 16px 14px', borderRadius: 18, background: `linear-gradient(180deg, rgba(10,12,14,0.55) 0%, rgba(14,16,20,0.85) 100%)`, border: `1px solid rgba(255,255,255,0.14)`, boxShadow: '0 10px 26px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <button onClick={onAvatarClick} style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${COLORS.accent}`, background: avatarDataUrl ? `url(${avatarDataUrl})` : COLORS.cardElevated, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            {!avatarDataUrl && <Camera size={14} color={COLORS.muted} />}
          </button>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: COLORS.text }}>{displayName || `Level ${level}`} {displayName && <span style={{ color: COLORS.muted, fontWeight: 400 }}>· Lvl {level}</span>}</div>
            <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 1 }}>{title}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9.5, color: COLORS.muted, fontFamily: COLORS.mono }}>{gameDateShort(startTimestamp)}</div>
          <div style={{ fontSize: 9.5, color: COLORS.muted, fontFamily: COLORS.mono, marginTop: 1 }}>{saveLabel}</div>
        </div>
      </div>

      <div style={{ fontFamily: COLORS.serif, fontSize: 36, lineHeight: 1.1, color: COLORS.gold, marginTop: 14, letterSpacing: -0.5 }}>{formatMoney(netWorth)}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bank Cash</div>
          <div style={{ fontFamily: COLORS.mono, fontSize: 13, color: COLORS.text, marginTop: 2 }}>{formatMoney(bankCash)}</div>
        </div>
        <div style={{ background: 'rgba(217,192,138,0.07)', border: `1px solid rgba(217,192,138,0.25)`, borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 9, color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Personal Cash</div>
          <div style={{ fontFamily: COLORS.mono, fontSize: 13, color: COLORS.gold, marginTop: 2 }}>{formatMoney(personalCash)}</div>
        </div>
        <div style={{ background: 'rgba(43,196,150,0.07)', border: `1px solid rgba(43,196,150,0.25)`, borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 9, color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bank Income /s</div>
          <div style={{ fontFamily: COLORS.mono, fontSize: 13, color: COLORS.accent, marginTop: 2 }}>+{formatMoney(passiveIncome)}{boosted ? ` ×${(tempMult * adMult).toFixed(2)}` : ''}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 3 }}><Sparkles size={9} /> Reputation</div>
          <div style={{ fontFamily: COLORS.mono, fontSize: 13, color: COLORS.text, marginTop: 2 }}>{reputation.toFixed(0)}</div>
        </div>
      </div>

      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', marginTop: 12, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${xpPct}%`, background: `linear-gradient(90deg, ${COLORS.accent}, #6FE3BE)`, borderRadius: 2 }} />
      </div>
    </div>
  );
}

/* ============================================================================
   TABS
   ========================================================================== */
const TABS = [
  { key: 'empire', label: 'Empire', icon: Landmark },
  { key: 'banks', label: 'Banks', icon: Building2 },
  { key: 'exchange', label: 'Market', icon: TrendingUp },
  { key: 'assets', label: 'Assets', icon: Home },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'office', label: 'Office', icon: Gavel },
];
function TabStrip({ tab, setTab }) {
  return (
    <div style={{ display: 'flex', gap: 4, margin: '0 12px 12px', padding: 6, borderRadius: 16, background: COLORS.panel, border: `1px solid ${COLORS.cardBorder}`, boxShadow: '0 6px 18px rgba(0,0,0,0.4)', flex: '0 0 auto' }}>
      {TABS.map((t) => {
        const Icon = t.icon; const active = tab === t.key;
        return (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, height: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            padding: '0 2px', background: active ? 'rgba(43,196,150,0.14)' : 'none', border: 'none', borderRadius: 12, cursor: 'pointer',
            color: active ? COLORS.accent : COLORS.muted, transition: 'background 150ms ease',
            fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            <Icon size={16} />{t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
   SHARED UI PRIMITIVES
   ========================================================================== */
function SectionLabel({ text, sub }) {
  return (
    <div style={{ margin: '18px 0 8px' }}>
      <div style={{ fontFamily: COLORS.serif, fontSize: 17, color: COLORS.accent }}>{text}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function EmptyNote({ text }) { return <div style={{ fontSize: 12, color: COLORS.muted, fontStyle: 'italic', padding: '8px 0' }}>{text}</div>; }
function Card({ children, active, style, elevated }) {
  const bg = elevated ? `linear-gradient(155deg, ${COLORS.cardElevated}, ${COLORS.card})` : COLORS.card;
  const boxShadow = elevated ? (active ? `0 0 0 1px ${COLORS.accent}55, ${COLORS.shadow}` : COLORS.shadow) : 'none';
  return <div style={{ background: bg, border: `1px solid ${active ? COLORS.cardBorderActive : COLORS.cardBorder}`, boxShadow, borderRadius: 12, padding: '12px 14px', marginBottom: 10, ...style }}>{children}</div>;
}
function IconTile({ icon, size = 38 }) {
  if (!icon) return null;
  const isComponent = typeof icon !== 'string';
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.3), flexShrink: 0,
      background: '#1B2622',
      border: '1px solid rgba(43,196,150,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.48), lineHeight: 1,
    }}>
      {isComponent ? icon : <span style={{ filter: 'saturate(0.75) brightness(1.05)' }}>{icon}</span>}
    </div>
  );
}
function ListRow({ icon, title, sub, right, locked }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <IconTile icon={icon} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: locked ? COLORS.muted : COLORS.text, display: 'flex', alignItems: 'center', gap: 5 }}>{locked && <Lock size={10} />} {title}</div>
            <div style={{ fontSize: 10.5, color: COLORS.muted, fontFamily: COLORS.mono, marginTop: 2 }}>{sub}</div>
          </div>
        </div>
        {right}
      </div>
    </Card>
  );
}
const buyBtn = (disabled) => ({ padding: '7px 12px', background: disabled ? '#1B1C20' : `linear-gradient(180deg, #E8D6A8, ${COLORS.gold})`, color: disabled ? COLORS.muted : '#241F14', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' });
const buyGreenBtn = (disabled) => ({ padding: '7px 12px', background: disabled ? '#1B1C20' : `linear-gradient(180deg, #3FDDA8, ${COLORS.buy})`, color: disabled ? COLORS.muted : '#08201A', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' });
const sellRedBtn = (disabled) => ({ padding: '7px 12px', background: disabled ? '#1B1C20' : `linear-gradient(180deg, #E2564C, ${COLORS.sell})`, color: disabled ? COLORS.muted : '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' });
const ghostBtn = { flex: 1, padding: '9px 6px', background: COLORS.cardElevated, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.accent, fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: 'pointer' };
function StatRow({ label, value }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.cardBorder}`, fontSize: 13 }}><span style={{ color: COLORS.muted }}>{label}</span><span style={{ fontFamily: COLORS.mono }}>{value}</span></div>;
}
function StatTile({ label, value }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: '10px 11px' }}>
      <div style={{ fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: COLORS.text, marginTop: 3, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}
function SubTabs({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
      {options.map((o) => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{ flex: '0 0 auto', minWidth: 74, height: 34, padding: '0 10px', fontSize: 11, borderRadius: 8, background: value === o.key ? COLORS.accent : COLORS.card, color: value === o.key ? '#ffffff' : COLORS.muted, border: `1px solid ${COLORS.cardBorder}`, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center' }}>{o.label}</button>
      ))}
    </div>
  );
}

/* ============================================================================
   EMPIRE TAB
   ========================================================================== */
function EmpireTab({ level, title, ownedBanks, prestige, lendingBook, govLoans, lendSub, setLendSub, issueLoan, issueGovLoan, tick, houseTier, carTier, jetTier, chopperTier, shipTier, adMult, adMultUntil, launchCampaign, bankCash, startTimestamp, customerIndex, mintAuthority, buyMintAuthority, isNativeApp, rewardPending, claimReward, nativeAdSlotRef }) {
  const worldBankSeats = ownedBanks.filter((id) => ALL_BANKS[id].tierKey === 'worldbank').length;
  const custColor = customerIndex >= CUSTOMER_BASE ? COLORS.emerald : COLORS.crimson;
  return (
    <div>
      <SectionLabel text="Empire Overview" sub={gameDateLabel(startTimestamp)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
        <StatTile label="Title" value={title} />
        <StatTile label="Level" value={`${level} / 100`} />
        <StatTile label="Banks controlled" value={`${ownedBanks.length} / 150`} />
        <StatTile label="World Bank seats" value={`${worldBankSeats} / 5`} />
        <StatTile label="Prestige" value={prestige.toFixed(0)} />
        <StatTile label="Customer Confidence" value={<span style={{ color: custColor }}>{customerIndex.toFixed(0)}%</span>} />
        <StatTile label="Residence" value={`${HOUSES[houseTier].icon} ${HOUSES[houseTier].name}`} />
        <StatTile label="Garage" value={`${CARS[carTier].icon} ${CARS[carTier].name}`} />
        <StatTile label="Aviation" value={`${JETS[jetTier].icon} ${JETS[jetTier].name}`} />
        <StatTile label="Helicopter" value={`${CHOPPERS[chopperTier].icon} ${CHOPPERS[chopperTier].name}`} />
        <StatTile label="Fleet" value={`${SHIPS[shipTier].icon} ${SHIPS[shipTier].name}`} />
      </div>

      {worldBankSeats === 5 && level >= 100 && (
        <>
          <SectionLabel text="The Final Seat" sub="Own all five World Bank seats and reach level 100, and one door remains." />
          <ListRow icon="🖨️" title="National Mint & Currency Design Authority"
            sub={mintAuthority ? 'Acquired — you now help design the money itself' : `${formatMoney(MINT_AUTHORITY_COST)} · the true endgame`}
            right={mintAuthority ? <Check size={16} color={COLORS.emerald} /> : <button style={buyBtn(bankCash < MINT_AUTHORITY_COST)} onClick={buyMintAuthority}>Acquire</button>} />
        </>
      )}

      <SectionLabel text="Lending Desk" sub="Business loans are fast but risky. Sovereign loans pay better and rarely default." />
      <SubTabs options={[{ key: 'business', label: 'Business' }, { key: 'government', label: 'Government' }]} value={lendSub} onChange={setLendSub} />
      {lendSub === 'business' ? (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[0.05, 0.10, 0.25].map((pct) => <button key={pct} onClick={() => issueLoan(pct)} style={ghostBtn}>Lend {(pct * 100).toFixed(0)}% bankCash</button>)}
          </div>
          {lendingBook.length > 0 ? lendingBook.map((l) => <ListRow key={l.id} icon="🤝" title={`Loan to ${l.npc}`} sub={`${formatMoney(l.amount)} · matures in ${Math.max(0, l.resolveTick - tick)}s`} />) : <EmptyNote text="No business loans out right now." />}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[0.05, 0.10, 0.25].map((pct) => <button key={pct} onClick={() => issueGovLoan(pct)} style={ghostBtn}>Lend {(pct * 100).toFixed(0)}% bankCash</button>)}
          </div>
          {govLoans.length > 0 ? govLoans.map((l) => <ListRow key={l.id} icon={l.flag} title={`Sovereign loan to ${l.country}`} sub={`${formatMoney(l.amount)} · matures in ${Math.max(0, l.resolveTick - tick)}s`} />) : <EmptyNote text="No governments currently owe you anything." />}
        </>
      )}

      <SectionLabel text="Advertising Bureau" sub={adMult !== 1 ? `Active campaign boosting income x${adMult.toFixed(2)} for ${Math.max(0, adMultUntil - tick)}s` : 'Launch a campaign to temporarily boost income and reputation.'} />
      {ADVERTISING_CAMPAIGNS.map((camp) => (
        <ListRow key={camp.id} icon={camp.icon} title={camp.name} sub={`${formatMoney(camp.cost)} · x${camp.mult} income for ${camp.ticks}s · +${camp.rep} rep`}
          right={<button style={buyBtn(bankCash < camp.cost)} onClick={() => launchCampaign(camp)}>Launch</button>} />
      ))}

      {isNativeApp && (
        <>
          <SectionLabel text="Sponsor Offers" sub="Watch a short video from a sponsor to claim one of these, free — no cash required." />
          <ListRow icon="🎬" title="Investor Briefing" sub="Watch a video · +12% personal cash"
            right={<button style={buyBtn(!!rewardPending)} onClick={() => claimReward('investor_briefing')}>{rewardPending === 'investor_briefing' ? 'Loading…' : 'Watch'}</button>} />
          <ListRow icon="🎬" title="Confidence Campaign" sub="Watch a video · +15 customer confidence"
            right={<button style={buyBtn(!!rewardPending)} onClick={() => claimReward('confidence_campaign')}>{rewardPending === 'confidence_campaign' ? 'Loading…' : 'Watch'}</button>} />
          <ListRow icon="🎬" title="Emergency Capital" sub="Watch a video · +10% bank cash"
            right={<button style={buyBtn(!!rewardPending)} onClick={() => claimReward('emergency_capital')}>{rewardPending === 'emergency_capital' ? 'Loading…' : 'Watch'}</button>} />

          <SectionLabel text="Featured Partner" />
          {/* This div is just a sized placeholder — the real ad is a native Android
              view the plugin overlays exactly on top of this element's screen position. */}
          <div ref={nativeAdSlotRef} style={{ width: '100%', height: 72, borderRadius: 10, overflow: 'hidden', background: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }} />
        </>
      )}
    </div>
  );
}

/* ============================================================================
   BANKS TAB
   ========================================================================== */
function BanksTab({ ownedBanks, level, bankCash, buyBank, bankUpgrades, upgradeBank }) {
  const [tierFilter, setTierFilter] = useState('community');
  const tiers = ['all', ...BANK_TIERS.map((t) => t.key)];
  const banksToShow = ALL_BANKS.filter((b) => tierFilter === 'all' || b.tierKey === tierFilter);
  return (
    <div>
      <SectionLabel text="The Bank Register" sub={`${ownedBanks.length} of 150 institutions under your control — every acquisition is permanent. Each one needs staff, resources, and upkeep to run.`} />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10, paddingBottom: 4 }}>
        {tiers.map((tk) => {
          const tierDef = BANK_TIERS.find((t) => t.key === tk);
          return <button key={tk} onClick={() => setTierFilter(tk)} style={{ flex: '0 0 auto', padding: '6px 11px', fontSize: 10, borderRadius: 8, background: tierFilter === tk ? COLORS.accent : COLORS.card, color: tierFilter === tk ? '#ffffff' : COLORS.muted, border: `1px solid ${COLORS.cardBorder}`, cursor: 'pointer' }}>{tk === 'all' ? 'All' : `${tierDef.icon} ${tierDef.label}`}</button>;
        })}
      </div>
      {banksToShow.map((b) => {
        const owned = ownedBanks.includes(b.id);
        const locked = level < b.minLevel;
        if (!owned) {
          return (
            <ListRow key={b.id} icon={b.icon} locked={locked} title={b.name}
              sub={locked ? `unlocks at level ${b.minLevel}` : `${formatMoney(b.cost)} · ${formatMoney(b.income)}/s`}
              right={<button style={buyBtn(locked || bankCash < b.cost)} onClick={() => buyBank(b)}>Buy</button>} />
          );
        }
        const lvl = bankUpgrades[b.id] || 0;
        const maxed = lvl >= BANK_UPGRADE_COST_MULT.length;
        const upgradeCost = maxed ? 0 : Math.round(b.cost * BANK_UPGRADE_COST_MULT[lvl]);
        const effIncome = b.income * (1 + lvl * BANK_UPGRADE_INCOME_BONUS);
        return (
          <Card key={b.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                <IconTile icon={b.icon} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.text }}>{b.name}</div>
                  <div style={{ fontSize: 10.5, color: COLORS.muted, fontFamily: COLORS.mono, marginTop: 1 }}>{BANK_UPGRADE_LABELS[lvl]} · earning {formatMoney(effIncome)}/s</div>
                </div>
              </div>
              <Check size={16} color={COLORS.emerald} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 10, color: COLORS.gold }}>{'★'.repeat(lvl)}{'☆'.repeat(BANK_UPGRADE_COST_MULT.length - lvl)}</div>
              {maxed ? (
                <span style={{ fontSize: 10, color: COLORS.muted }}>Fully upgraded</span>
              ) : (
                <button style={buyBtn(bankCash < upgradeCost)} onClick={() => upgradeBank(b)}>Upgrade · {formatMoney(upgradeCost)}</button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================================================================
   ASSETS TAB
   ========================================================================== */
function AssetsTab({ houseTier, carTier, jetTier, chopperTier, shipTier, vaultTier, luxuryOwned, personalCash, buyHouse, buyCar, buyJet, buyChopper, buyShip, buyVault, buyLuxury }) {
  const [sub, setSub] = useState('houses');
  const upkeepNote = (cost) => cost > 0 ? ` · upkeep ${formatMoney(cost * UPKEEP_RATE)}/s` : '';
  return (
    <div>
      <SectionLabel text="Lifestyle & Assets" sub="Paid for out of your personal cash, not the bank's capital. Every tier you own costs upkeep." />
      <SubTabs options={[{ key: 'houses', label: 'Houses' }, { key: 'cars', label: 'Cars' }, { key: 'jets', label: 'Jets' }, { key: 'choppers', label: 'Choppers' }, { key: 'ships', label: 'Ships' }, { key: 'vaults', label: 'Vaults' }, { key: 'luxury', label: 'Luxury' }]} value={sub} onChange={setSub} />
      {sub === 'houses' && HOUSES.map((h, i) => <ListRow key={i} icon={h.icon} title={h.name} sub={i <= houseTier ? `current residence${upkeepNote(h.cost)}` : `${formatMoney(h.cost)} · prestige ${h.prestige}${upkeepNote(h.cost)}`} right={i === houseTier ? <Check size={16} color={COLORS.emerald} /> : i < houseTier ? null : <button style={buyBtn(personalCash < h.cost)} onClick={() => buyHouse(i)}>Move in</button>} />)}
      {sub === 'cars' && CARS.map((c, i) => <ListRow key={i} icon={c.icon} title={c.name} sub={i <= carTier ? `current garage${upkeepNote(c.cost)}` : `${formatMoney(c.cost)} · prestige ${c.prestige}${upkeepNote(c.cost)}`} right={i === carTier ? <Check size={16} color={COLORS.emerald} /> : i < carTier ? null : <button style={buyBtn(personalCash < c.cost)} onClick={() => buyCar(i)}>Buy</button>} />)}
      {sub === 'jets' && JETS.map((j, i) => <ListRow key={i} icon={j.icon} title={j.name} sub={i <= jetTier ? `current aviation${upkeepNote(j.cost)}` : `${formatMoney(j.cost)} · prestige ${j.prestige}${upkeepNote(j.cost)}`} right={i === jetTier ? <Check size={16} color={COLORS.emerald} /> : i < jetTier ? null : <button style={buyBtn(personalCash < j.cost)} onClick={() => buyJet(i)}>Buy</button>} />)}
      {sub === 'choppers' && CHOPPERS.map((j, i) => <ListRow key={i} icon={j.icon} title={j.name} sub={i <= chopperTier ? `current helicopter${upkeepNote(j.cost)}` : `${formatMoney(j.cost)} · prestige ${j.prestige}${upkeepNote(j.cost)}`} right={i === chopperTier ? <Check size={16} color={COLORS.emerald} /> : i < chopperTier ? null : <button style={buyBtn(personalCash < j.cost)} onClick={() => buyChopper(i)}>Buy</button>} />)}
      {sub === 'ships' && SHIPS.map((j, i) => <ListRow key={i} icon={j.icon} title={j.name} sub={i <= shipTier ? `current vessel${upkeepNote(j.cost)}` : `${formatMoney(j.cost)} · prestige ${j.prestige}${upkeepNote(j.cost)}`} right={i === shipTier ? <Check size={16} color={COLORS.emerald} /> : i < shipTier ? null : <button style={buyBtn(personalCash < j.cost)} onClick={() => buyShip(i)}>Buy</button>} />)}
      {sub === 'vaults' && VAULTS.map((j, i) => <ListRow key={i} icon={j.icon} title={j.name} sub={i <= vaultTier ? `current vault${upkeepNote(j.cost)}` : `${formatMoney(j.cost)} · prestige ${j.prestige}${upkeepNote(j.cost)}`} right={i === vaultTier ? <Check size={16} color={COLORS.emerald} /> : i < vaultTier ? null : <button style={buyBtn(personalCash < j.cost)} onClick={() => buyVault(i)}>Buy</button>} />)}
      {sub === 'luxury' && LUXURY_ITEMS.map((item) => { const owned = luxuryOwned.includes(item.id); return <ListRow key={item.id} icon={item.icon} title={item.name} sub={owned ? `owned${upkeepNote(item.cost)}` : `${formatMoney(item.cost)} · prestige ${item.prestige}${upkeepNote(item.cost)}`} right={owned ? <Check size={16} color={COLORS.emerald} /> : <button style={buyBtn(personalCash < item.cost)} onClick={() => buyLuxury(item)}>Buy</button>} />; })}
    </div>
  );
}

/* ============================================================================
   STAFF TAB
   ========================================================================== */
function StaffTab({ staff, bankCash, hireStaff, hireDirector, hireGuard }) {
  return (
    <div>
      <SectionLabel text="Your People" sub="The team that runs the empire while you sleep." />
      {Object.entries(STAFF_DEFS).map(([key, def]) => {
        const Icon = def.icon; const hired = staff[key];
        return <ListRow key={key} icon={<Icon size={16} color={COLORS.accent} />} title={def.name} sub={hired ? 'on staff' : `${formatMoney(def.cost)} · ${def.desc}`} right={hired ? <Check size={16} color={COLORS.emerald} /> : <button style={buyBtn(bankCash < def.cost)} onClick={() => hireStaff(key)}>Hire</button>} />;
      })}
      <SectionLabel text="Board of Directors" sub={`${staff.directors} / ${MAX_DIRECTORS} seats filled — required for board meetings & top-tier acquisitions`} />
      <ListRow icon={<ShieldCheck size={16} color={COLORS.accent} />} title="Appoint a Director" sub={staff.directors >= MAX_DIRECTORS ? 'Board is full' : `${formatMoney(DIRECTOR_BASE_COST * (staff.directors + 1))}`}
        right={staff.directors >= MAX_DIRECTORS ? null : <button style={buyBtn(bankCash < DIRECTOR_BASE_COST * (staff.directors + 1))} onClick={hireDirector}>Appoint</button>} />
      <SectionLabel text="Security" sub="Bodyguards soften audits & defaults. Soldiers deter hostile takeovers." />
      <ListRow icon="🛡️" title={`Bodyguards (${staff.bodyguards}/${MAX_BODYGUARDS})`} sub={formatMoney(BODYGUARD_COST)} right={staff.bodyguards >= MAX_BODYGUARDS ? null : <button style={buyBtn(bankCash < BODYGUARD_COST)} onClick={() => hireGuard('bodyguards')}>Hire</button>} />
      <ListRow icon="⚔️" title={`Soldiers (${staff.soldiers}/${MAX_SOLDIERS})`} sub={formatMoney(SOLDIER_COST)} right={staff.soldiers >= MAX_SOLDIERS ? null : <button style={buyBtn(bankCash < SOLDIER_COST)} onClick={() => hireGuard('soldiers')}>Enlist</button>} />
    </div>
  );
}

/* ============================================================================
   EXCHANGE TAB — Companies (with dividends) + Forex
   ========================================================================== */
function ExchangeTab({ exchangeSub, setExchangeSub, companies, companyHoldings, tradeCompany, selectedCompanyId, setSelectedCompanyId, forex, forexHoldings, tradeForex, bankCash, scaleIdx, setScaleIdx }) {
  const selCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const shareQty = SCALE_MULT[scaleIdx];
  const fxUnits = 1000 * SCALE_MULT[scaleIdx];

  return (
    <div>
      <SectionLabel text="Exchange" sub="Trade companies and currencies. Set a scale to buy or sell in bulk." />
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {SCALE_LABEL.map((lab, i) => (
          <button key={lab} onClick={() => setScaleIdx(i)} style={{ flex: 1, padding: '7px 4px', fontSize: 11, borderRadius: 8, background: scaleIdx === i ? COLORS.accent : COLORS.card, color: scaleIdx === i ? '#ffffff' : COLORS.muted, border: `1px solid ${COLORS.cardBorder}`, cursor: 'pointer', fontWeight: 700 }}>{lab}</button>
        ))}
      </div>
      <SubTabs options={[{ key: 'companies', label: 'Companies' }, { key: 'forex', label: 'Forex' }]} value={exchangeSub} onChange={setExchangeSub} />

      {exchangeSub === 'companies' && (
        <>
          <Card active elevated style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconTile icon={selCompany.icon} size={40} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{selCompany.name}</div>
                  <div style={{ fontSize: 10.5, color: COLORS.muted, marginTop: 1 }}>{selCompany.sector} · div {(selCompany.divRate * 100).toFixed(2)}%/tick</div>
                </div>
              </div>
              <div style={{ fontFamily: COLORS.mono, fontSize: 18, color: COLORS.emerald }}>{formatMoney(selCompany.price)}</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Sparkline data={selCompany.history} color={COLORS.emerald} height={70} labelFormatter={(v) => '$' + v.toFixed(2)} showChange />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={buyGreenBtn(bankCash < selCompany.price * shareQty)} onClick={() => tradeCompany(selCompany.id, 'buy')}>BUY {shareQty > 1 ? `x${shareQty}` : ''}</button>
              <button style={sellRedBtn((companyHoldings[selCompany.id] || 0) < 1)} onClick={() => tradeCompany(selCompany.id, 'sell')}>SELL {shareQty > 1 ? `x${shareQty}` : ''}</button>
            </div>
          </Card>
          <EmptyNote text="Dividends pay automatically into bankCash on hand every tick, based on shares held — no need to sell." />
          {companies.map((c) => {
            const held = companyHoldings[c.id] || 0;
            return (
              <Card key={c.id} active={c.id === selectedCompanyId} style={{ cursor: 'pointer' }}>
                <div onClick={() => setSelectedCompanyId(c.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconTile icon={c.icon} />
                    <div>
                      <div style={{ fontSize: 12.5 }}>{c.name} {held > 0 && <span style={{ color: COLORS.accent, fontFamily: COLORS.mono }}>· {held}</span>}</div>
                      <div style={{ fontSize: 10.5, color: COLORS.muted }}>{c.sector}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: COLORS.mono, fontSize: 13, color: COLORS.emerald }}>{formatMoney(c.price)}</span>
                    <button style={buyGreenBtn(bankCash < c.price * shareQty)} onClick={(e) => { e.stopPropagation(); tradeCompany(c.id, 'buy'); }}>BUY</button>
                    <button style={sellRedBtn(held < 1)} onClick={(e) => { e.stopPropagation(); tradeCompany(c.id, 'sell'); }}>SELL</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </>
      )}

      {exchangeSub === 'forex' && (
        <>
          {forex.map((f) => {
            const held = forexHoldings[f.pair] || 0;
            return (
              <Card key={f.pair}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{f.flag}</span>
                    <div>
                      <div style={{ fontSize: 12.5 }}>{f.pair}</div>
                      {held > 0 && <div style={{ fontSize: 10.5, color: COLORS.gold, fontFamily: COLORS.mono }}>HELD {formatUnits(held)}</div>}
                    </div>
                  </div>
                  <div style={{ fontFamily: COLORS.mono, fontSize: 15, color: COLORS.gold }}>{f.rate.toFixed(4)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}><Sparkline data={f.history} color={COLORS.gold} height={34} fill={false} /></div>
                  <button style={buyGreenBtn(bankCash < f.rate * fxUnits)} onClick={() => tradeForex(f.pair, 'buy')}>BUY {formatUnits(fxUnits)}</button>
                  <button style={sellRedBtn(held < fxUnits)} onClick={() => tradeForex(f.pair, 'sell')}>SELL {formatUnits(fxUnits)}</button>
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ============================================================================
   OFFICE TAB — Board / Forbes / Ledger
   ========================================================================== */
function OfficeTab({ officeSub, setOfficeSub, staff, boardLedger, forbesRanked, playerRank, ledger }) {
  const [tipIdx, setTipIdx] = useState(0);
  const tip = ECONOMIST_TIPS[tipIdx];
  return (
    <div>
      <SectionLabel text="The Office" />
      <SubTabs options={[{ key: 'board', label: 'Board' }, { key: 'forbes', label: 'Forbes' }, { key: 'advisor', label: 'Advisor' }, { key: 'ledger', label: 'Ledger' }]} value={officeSub} onChange={setOfficeSub} />

      {officeSub === 'board' && (
        <>
          {(!staff.secretary || staff.directors === 0) && <EmptyNote text="Hire an Executive Secretary and appoint at least one Director to schedule meetings." />}
          {staff.secretary && staff.directors > 0 && boardLedger.length === 0 && <EmptyNote text="No votes yet. The next meeting is approaching." />}
          {boardLedger.map((l, i) => <ListRow key={i} icon="⚖️" title={l.text} sub={`tick ${l.tick}`} />)}
        </>
      )}
      {officeSub === 'forbes' && (
        <>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 10 }}>You are ranked #{playerRank} of {forbesRanked.length} in global net worth.</div>
          {forbesRanked.map((p, i) => (
            <Card key={p.name + i} active={p.isPlayer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: COLORS.mono, width: 24, color: COLORS.muted, fontSize: 12 }}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}</span>
                  <span style={{ fontSize: 12.5, color: p.isPlayer ? COLORS.gold : COLORS.text, fontWeight: p.isPlayer ? 700 : 400 }}>{p.name}</span>
                </div>
                <span style={{ fontFamily: COLORS.mono, fontSize: 12.5 }}>{formatMoney(p.netWorth)}</span>
              </div>
            </Card>
          ))}
        </>
      )}
      {officeSub === 'advisor' && (
        <>
          <Card active elevated style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <IconTile icon="🎓" size={38} />
              <div>
                <div style={{ fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Economist</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{tip.title}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.muted, lineHeight: 1.5 }}>{tip.body}</div>
          </Card>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={ghostBtn} onClick={() => setTipIdx((i) => (i - 1 + ECONOMIST_TIPS.length) % ECONOMIST_TIPS.length)}>‹ Previous</button>
            <button style={ghostBtn} onClick={() => setTipIdx((i) => (i + 1) % ECONOMIST_TIPS.length)}>Next ›</button>
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, textAlign: 'center', marginTop: 8 }}>Tip {tipIdx + 1} of {ECONOMIST_TIPS.length}</div>
        </>
      )}
      {officeSub === 'ledger' && (
        <>
          {ledger.length === 0 && <EmptyNote text="Nothing recorded yet." />}
          {ledger.map((l, i) => <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${COLORS.cardBorder}`, fontFamily: COLORS.mono, fontSize: 11 }}><span style={{ color: COLORS.muted }}>[{l.tick}]</span> {l.text}</div>)}
        </>
      )}
    </div>
  );
}

/* ============================================================================
   MODALS
   ========================================================================== */
function EventModal({ ev, onChoose, choicesOverride }) {
  const choices = choicesOverride || ev.choices;
  const isBoard = !!choicesOverride;
  const tone = isBoard ? COLORS.accent : COLORS.warn;
  const [entered, setEntered] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setEntered(true)); return () => cancelAnimationFrame(id); }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 10, opacity: entered ? 1 : 0, transition: 'opacity 260ms ease' }}>
      <div style={{ background: `linear-gradient(180deg, ${COLORS.cardElevated}, ${COLORS.card})`, border: `1px solid ${tone}`, borderRadius: 14, padding: 20, maxWidth: 360, boxShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02)`, transform: entered ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(10px)', transition: 'transform 260ms cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: tone }}>
          {isBoard ? <Gavel size={18} /> : <AlertTriangle size={18} />}<div style={{ fontFamily: COLORS.serif, fontSize: 18 }}>{ev.title}</div>
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16 }}>{ev.desc}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {choices.map((c, i) => (
            <button key={i} onClick={() => onChoose(c)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 13px', background: COLORS.cardElevated, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.text, borderRadius: 9, cursor: 'pointer', fontSize: 13 }}>
              {c.label} <ChevronRight size={14} color={COLORS.muted} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InterviewModal({ q, result, onAnswer, onClose }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setEntered(true)); return () => cancelAnimationFrame(id); }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 10, opacity: entered ? 1 : 0, transition: 'opacity 260ms ease' }}>
      <div style={{ background: `linear-gradient(180deg, ${COLORS.cardElevated}, ${COLORS.card})`, border: `1px solid ${COLORS.gold}`, borderRadius: 14, padding: 20, maxWidth: 360, boxShadow: '0 10px 40px rgba(0,0,0,0.6)', transform: entered ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(10px)', transition: 'transform 260ms cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: COLORS.gold }}>
          <span style={{ fontSize: 18 }}>🎙️</span><div style={{ fontFamily: COLORS.serif, fontSize: 17 }}>Press Interview</div>
        </div>
        {!result ? (
          <>
            <div style={{ fontSize: 13, color: COLORS.text, marginBottom: 16, lineHeight: 1.5 }}>{q.q}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.choices.map((c, i) => (
                <button key={i} onClick={() => onAnswer(i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 13px', background: COLORS.cardElevated, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.text, borderRadius: 9, cursor: 'pointer', fontSize: 12.5, textAlign: 'left' }}>
                  {c} <ChevronRight size={14} color={COLORS.muted} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: result.correct ? COLORS.emerald : COLORS.crimson, marginBottom: 8, fontWeight: 700 }}>
              {result.correct ? '✓ Solid answer.' : '✕ That answer missed the mark.'}
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.muted, marginBottom: 16 }}>
              Customer confidence {result.delta >= 0 ? '+' : ''}{result.delta}. {result.correct ? 'Word spreads and business picks up.' : 'A few customers take their business elsewhere.'}
            </div>
            <button onClick={onClose} style={{ ...buyBtn(false), width: '100%', padding: 10 }}>Continue</button>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileModal({ avatarDataUrl, displayName, setDisplayName, onClose }) {
  const [draft, setDraft] = useState(displayName);
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 10 }}>
      <div style={{ background: `linear-gradient(180deg, ${COLORS.cardElevated}, ${COLORS.card})`, border: `1px solid ${COLORS.accent}`, borderRadius: 14, padding: 20, maxWidth: 320, width: '100%', boxShadow: COLORS.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: COLORS.serif, fontSize: 18, color: COLORS.accent }}>Your Profile</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS.muted, cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <label htmlFor="avatar-file-input" style={{ width: 84, height: 84, borderRadius: '50%', border: `2px solid ${COLORS.accent}`, background: avatarDataUrl ? `url(${avatarDataUrl})` : '#161a20', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {!avatarDataUrl && <Camera size={22} color={COLORS.muted} />}
          </label>
        </div>
        <label htmlFor="avatar-file-input" style={{ ...ghostBtn, display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'center', marginBottom: 12 }}>Choose Photo from Gallery</label>
        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Display name</div>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={24} placeholder="e.g. Nexarion" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', background: '#161a20', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, color: COLORS.text, fontSize: 13, marginBottom: 14 }} />
        <button onClick={() => { setDisplayName(draft); onClose(); }} style={{ ...buyBtn(false), width: '100%', padding: 10 }}>Save</button>
      </div>
    </div>
  );
}

/* ============================================================================
   ERROR BOUNDARY — if anything above throws during render, show the actual
   error instead of leaving a silent black screen.
   ========================================================================== */
class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('BankingEmpire crashed:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#0A0A0C', color: '#EDEDEF', minHeight: 400, padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ color: '#F0605A', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>The app hit an error while rendering:</div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, whiteSpace: 'pre-wrap', background: '#15161A', border: '1px solid #2a2a30', borderRadius: 8, padding: 12, color: '#E8B84B' }}>
            {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function BankingEmpire() {
  return (
    <GameErrorBoundary>
      <BankingEmpireInner />
    </GameErrorBoundary>
  );
}
