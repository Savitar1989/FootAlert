

import { User, AlertStrategy, ApiSettings, SystemStats, TargetOutcome, CriteriaMetric, Operator, Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

// KEYS
const DB_USERS = 'footalert_db_users';
const DB_STRATEGIES = 'footalert_db_strategies';
const DB_SETTINGS = 'footalert_db_settings';
const DB_STATS = 'footalert_db_stats';
const DB_TRANSACTIONS = 'footalert_db_transactions';

// DEFAULT DATA
const DEFAULT_STRATEGY_TEMPLATE: Omit<AlertStrategy, 'id' | 'userId'> = {
  name: 'Late Goal Hunter (Default)',
  active: true,
  targetOutcome: TargetOutcome.OVER_0_5_GOALS,
  criteria: [
    { id: 'c1', metric: CriteriaMetric.TIME, operator: Operator.GREATER_THAN, value: 70 },
    { id: 'c2', metric: CriteriaMetric.GOALS_TOTAL, operator: Operator.EQUALS, value: 0 },
    { id: 'c3', metric: CriteriaMetric.DA_TOTAL, operator: Operator.GREATER_THAN, value: 30 }
  ],
  triggeredMatches: [],
  wins: 0,
  totalHits: 0,
  strikeRate: 0,
  avgOdds: 1.80,
  roi: 0,
  history: [],
  price: 0,
  isPublic: false
};

// INITIALIZATION
const initDB = () => {
  if (!localStorage.getItem(DB_USERS)) {
    const admin: User = {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@footalert.com',
      role: 'admin',
      createdAt: Date.now(),
      walletBalance: 1000,
      subscription: { plan: 'monthly', status: 'active', expiryDate: 9999999999999 }
    };
    localStorage.setItem(DB_USERS, JSON.stringify([admin]));
  }
  if (!localStorage.getItem(DB_STRATEGIES)) localStorage.setItem(DB_STRATEGIES, JSON.stringify([]));
  if (!localStorage.getItem(DB_SETTINGS)) localStorage.setItem(DB_SETTINGS, JSON.stringify([]));
  if (!localStorage.getItem(DB_TRANSACTIONS)) localStorage.setItem(DB_TRANSACTIONS, JSON.stringify([]));
  if (!localStorage.getItem(DB_STATS)) {
    const stats: SystemStats = {
      totalUsers: 1,
      totalStrategies: 0,
      totalAlertsSent: 14502,
      serverLoad: 12,
      globalRoi: 5.4,
      traffic: Array.from({length: 7}, () => Math.floor(Math.random() * 500 + 100))
    };
    localStorage.setItem(DB_STATS, JSON.stringify(stats));
  }
};

initDB();

// HELPERS
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const load = <T>(key: string): T => JSON.parse(localStorage.getItem(key) || '[]');
const save = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const db = {
  users: {
    getAll: async (): Promise<User[]> => {
      await delay(200);
      return load<User[]>(DB_USERS);
    },
    getById: async (id: string): Promise<User | undefined> => {
      const users = load<User[]>(DB_USERS);
      return users.find(u => u.id === id);
    },
    create: async (username: string, email: string): Promise<User> => {
      await delay(500);
      const users = load<User[]>(DB_USERS);
      if (users.find(u => u.username === username)) throw new Error("Username taken");
      
      const newUser: User = {
        id: uuidv4(),
        username,
        email,
        role: 'user',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        walletBalance: 0,
        // 1 Day Trial
        subscription: {
          plan: 'trial',
          status: 'active',
          expiryDate: Date.now() + (24 * 60 * 60 * 1000)
        }
      };
      
      users.push(newUser);
      save(DB_USERS, users);
      
      // Create Default Strategy for new user
      await db.strategies.create({
        ...DEFAULT_STRATEGY_TEMPLATE,
        userId: newUser.id,
        id: uuidv4()
      } as AlertStrategy);

      // Create Default Settings
      await db.settings.save({
        userId: newUser.id,
        apiKey: '',
        refreshRate: 60,
        useDemoData: true
      });

      // Update Stats
      const stats = load<SystemStats>(DB_STATS);
      stats.totalUsers++;
      save(DB_STATS, stats);

      return newUser;
    },
    login: async (username: string): Promise<User> => {
      await delay(500);
      const users = load<User[]>(DB_USERS);
      const user = users.find(u => u.username === username);
      if (!user) throw new Error("User not found");
      
      // Check Subscription Status on Login
      if (user.subscription.expiryDate < Date.now()) {
        user.subscription.status = 'expired';
      }

      user.lastLogin = Date.now();
      save(DB_USERS, users);
      return user;
    },
    updateSubscription: async (userId: string, plan: 'weekly' | 'monthly') => {
      const users = load<User[]>(DB_USERS);
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const duration = plan === 'weekly' ? 7 : 30;
      user.subscription = {
        plan,
        status: 'active',
        expiryDate: Date.now() + (duration * 24 * 60 * 60 * 1000)
      };
      save(DB_USERS, users);
      return user;
    },
    updateWallet: async (userId: string, amount: number) => {
      const users = load<User[]>(DB_USERS);
      const user = users.find(u => u.id === userId);
      if (user) {
        user.walletBalance += amount;
        save(DB_USERS, users);
      }
    }
  },

  strategies: {
    getAll: async (): Promise<AlertStrategy[]> => {
      await delay(200);
      return load<AlertStrategy[]>(DB_STRATEGIES);
    },
    getByUser: async (userId: string): Promise<AlertStrategy[]> => {
      await delay(200);
      const all = load<AlertStrategy[]>(DB_STRATEGIES);
      return all.filter(s => s.userId === userId);
    },
    create: async (strategy: AlertStrategy): Promise<AlertStrategy> => {
      const all = load<AlertStrategy[]>(DB_STRATEGIES);
      all.push(strategy);
      save(DB_STRATEGIES, all);
      
      const stats = load<SystemStats>(DB_STATS);
      stats.totalStrategies++;
      save(DB_STATS, stats);
      
      return strategy;
    },
    update: async (strategy: AlertStrategy): Promise<void> => {
      const all = load<AlertStrategy[]>(DB_STRATEGIES);
      const idx = all.findIndex(s => s.id === strategy.id);
      if (idx !== -1) {
        all[idx] = strategy;
        save(DB_STRATEGIES, all);
      }
    },
    delete: async (id: string): Promise<void> => {
      let all = load<AlertStrategy[]>(DB_STRATEGIES);
      all = all.filter(s => s.id !== id);
      save(DB_STRATEGIES, all);
    },
    logAlert: async () => {
       const stats = load<SystemStats>(DB_STATS);
       stats.totalAlertsSent++;
       save(DB_STATS, stats);
    }
  },

  settings: {
    get: async (userId: string): Promise<ApiSettings> => {
      await delay(100);
      const all = load<ApiSettings[]>(DB_SETTINGS);
      const found = all.find(s => s.userId === userId);
      return found || { userId, apiKey: '', refreshRate: 60, useDemoData: true };
    },
    save: async (settings: ApiSettings): Promise<void> => {
      let all = load<ApiSettings[]>(DB_SETTINGS);
      const idx = all.findIndex(s => s.userId === settings.userId);
      if (idx !== -1) all[idx] = settings;
      else all.push(settings);
      save(DB_SETTINGS, all);
    }
  },

  transactions: {
    processPurchase: async (buyerId: string, authorId: string, strategyName: string, amount: number) => {
      const users = load<User[]>(DB_USERS);
      const buyer = users.find(u => u.id === buyerId);
      const author = users.find(u => u.id === authorId);

      if (!buyer) throw new Error("Buyer not found");
      
      // Note: In real app, check if buyer wallet has funds. 
      // For now, we assume purchase is via Card (Stripe) so we don't deduct wallet, we just process fee.
      // IF using wallet balance:
      // if (buyer.walletBalance < amount) throw new Error("Insufficient funds");
      // buyer.walletBalance -= amount;

      // Seller receives 85% (15% platform fee)
      if (author) {
        const netEarnings = amount * 0.85;
        author.walletBalance += netEarnings;
        
        // Log Seller Transaction
        const txSeller: Transaction = {
          id: uuidv4(), userId: authorId, type: 'sale', amount: netEarnings,
          description: `Sold strategy: ${strategyName}`, date: Date.now()
        };
        const allTx = load<Transaction[]>(DB_TRANSACTIONS);
        allTx.push(txSeller);
        save(DB_TRANSACTIONS, allTx);
      }
      
      save(DB_USERS, users);
    }
  },

  stats: {
    getGlobal: async (): Promise<SystemStats> => {
      await delay(100);
      return load<SystemStats>(DB_STATS) || {
        totalUsers: 0, totalStrategies: 0, totalAlertsSent: 0, serverLoad: 0, globalRoi: 0, traffic: []
      };
    }
  }
};
