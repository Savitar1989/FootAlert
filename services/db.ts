
import { User, AlertStrategy, ApiSettings, SystemStats, TargetOutcome, CriteriaMetric, Operator, Transaction, MarketStrategy, AuditLog, GlobalSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { MOCK_MARKET_STRATEGIES } from '../constants';

// KEYS
const DB_USERS = 'footalert_db_users';
const DB_STRATEGIES = 'footalert_db_strategies';
const DB_MARKET = 'footalert_db_market'; 
const DB_SETTINGS = 'footalert_db_settings';
const DB_GLOBAL_SETTINGS = 'footalert_db_global_settings';
const DB_STATS = 'footalert_db_stats';
const DB_TRANSACTIONS = 'footalert_db_transactions';
const DB_AUDIT = 'footalert_db_audit';

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

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  siteName: 'FootAlert Pro',
  maintenanceMode: false,
  apiFootballKey: '',
  sportMonksToken: '',
  oddsApiKey: '',
  geminiApiKey: '',
  stripePublishableKey: 'pk_test_placeholder',
  stripeSecretKey: 'sk_test_placeholder',
  currencyCode: 'USD',
  smtpHost: 'smtp.mailgun.org',
  smtpPort: 587,
  smtpUser: 'postmaster@mg.footalert.com',
  smtpFrom: 'noreply@footalert.com'
};

// INITIALIZATION
const initDB = () => {
  if (!localStorage.getItem(DB_USERS)) {
    // Admin password "admin" hashed with SHA-256
    const adminHash = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"; 
    
    const admin: User = {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@footalert.com',
      role: 'admin',
      createdAt: Date.now(),
      walletBalance: 1000,
      twoFactorEnabled: false,
      subscription: { plan: 'monthly', status: 'active', expiryDate: 9999999999999 },
      preferences: { email: true, push: true, sound: true, telegram: false },
      passwordHash: adminHash // Added property for local auth check
    } as any; // Cast to any to allow passwordHash for local db auth logic
    localStorage.setItem(DB_USERS, JSON.stringify([admin]));
  }
  if (!localStorage.getItem(DB_STRATEGIES)) localStorage.setItem(DB_STRATEGIES, JSON.stringify([]));
  if (!localStorage.getItem(DB_MARKET)) localStorage.setItem(DB_MARKET, JSON.stringify(MOCK_MARKET_STRATEGIES));
  
  if (!localStorage.getItem(DB_SETTINGS)) localStorage.setItem(DB_SETTINGS, JSON.stringify([]));
  if (!localStorage.getItem(DB_GLOBAL_SETTINGS)) localStorage.setItem(DB_GLOBAL_SETTINGS, JSON.stringify(DEFAULT_GLOBAL_SETTINGS));
  if (!localStorage.getItem(DB_TRANSACTIONS)) localStorage.setItem(DB_TRANSACTIONS, JSON.stringify([]));
  if (!localStorage.getItem(DB_AUDIT)) localStorage.setItem(DB_AUDIT, JSON.stringify([]));
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
    // Modified create to accept password hash
    create: async (username: string, email: string, passwordHash?: string): Promise<User> => {
      await delay(500);
      const users = load<any[]>(DB_USERS);
      if (users.find(u => u.username === username)) throw new Error("Username taken");
      
      const newUser: any = {
        id: uuidv4(),
        username,
        email,
        passwordHash, // Store the hash
        role: 'user',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        walletBalance: 0,
        twoFactorEnabled: false,
        preferences: { email: true, push: true, sound: true, telegram: false },
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
        sportMonksApiKey: '',
        oddsApiKey: '',
        primaryProvider: 'api-football',
        refreshRate: 60,
        useDemoData: true
      });

      // Update Stats
      const stats = load<SystemStats>(DB_STATS);
      stats.totalUsers++;
      save(DB_STATS, stats);

      return newUser;
    },
    // Modified login to return the full object (including hash for verification)
    login: async (username: string): Promise<any> => {
      await delay(500);
      const users = load<any[]>(DB_USERS);
      const user = users.find(u => u.username === username || u.email === username);
      if (!user) throw new Error("User not found");
      if (user.isBanned) throw new Error("Account has been suspended.");
      
      if (user.subscription.expiryDate < Date.now()) {
        user.subscription.status = 'expired';
      }

      user.lastLogin = Date.now();
      save(DB_USERS, users);
      return user;
    },
    updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
       const users = load<User[]>(DB_USERS);
       const idx = users.findIndex(u => u.id === userId);
       if (idx === -1) throw new Error("User not found");
       
       const updated = { ...users[idx], ...data };
       users[idx] = updated;
       save(DB_USERS, users);
       return updated;
    },
    toggle2FA: async (userId: string, enable: boolean): Promise<User> => {
       const users = load<User[]>(DB_USERS);
       const idx = users.findIndex(u => u.id === userId);
       if (idx === -1) throw new Error("User not found");
       
       users[idx].twoFactorEnabled = enable;
       save(DB_USERS, users);
       return users[idx];
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
    },
    adminBanUser: async (userId: string, isBanned: boolean) => {
       const users = load<User[]>(DB_USERS);
       const user = users.find(u => u.id === userId);
       if(user) {
         user.isBanned = isBanned;
         save(DB_USERS, users);
       }
    },
    adminAdjustBalance: async (userId: string, amount: number) => {
       const users = load<User[]>(DB_USERS);
       const user = users.find(u => u.id === userId);
       if(user) {
         user.walletBalance = amount;
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

  market: {
    getAll: async (): Promise<MarketStrategy[]> => {
      await delay(300);
      return load<MarketStrategy[]>(DB_MARKET);
    },
    create: async (strategy: MarketStrategy): Promise<void> => {
      const all = load<MarketStrategy[]>(DB_MARKET);
      all.push(strategy);
      save(DB_MARKET, all);
    },
    delete: async (id: string): Promise<void> => {
      let all = load<MarketStrategy[]>(DB_MARKET);
      all = all.filter(s => s.id !== id);
      save(DB_MARKET, all);
    }
  },

  settings: {
    get: async (userId: string): Promise<ApiSettings> => {
      await delay(100);
      const all = load<ApiSettings[]>(DB_SETTINGS);
      const found = all.find(s => s.userId === userId);
      return found || { 
        userId, 
        apiKey: '', 
        sportMonksApiKey: '',
        oddsApiKey: '',
        primaryProvider: 'api-football', 
        refreshRate: 60, 
        useDemoData: true 
      };
    },
    save: async (settings: ApiSettings): Promise<void> => {
      let all = load<ApiSettings[]>(DB_SETTINGS);
      const idx = all.findIndex(s => s.userId === settings.userId);
      if (idx !== -1) all[idx] = settings;
      else all.push(settings);
      save(DB_SETTINGS, all);
    }
  },

  globalSettings: {
    get: async (): Promise<GlobalSettings> => {
      await delay(100);
      const stored = load<GlobalSettings>(DB_GLOBAL_SETTINGS);
      return stored && Object.keys(stored).length > 0 ? stored : DEFAULT_GLOBAL_SETTINGS;
    },
    save: async (settings: GlobalSettings): Promise<void> => {
      await delay(500);
      save(DB_GLOBAL_SETTINGS, settings);
    }
  },

  transactions: {
    getAll: async (userId: string): Promise<Transaction[]> => {
      await delay(200);
      const all = load<Transaction[]>(DB_TRANSACTIONS);
      return all.filter(t => t.userId === userId).sort((a,b) => b.date - a.date);
    },
    create: async (userId: string, amount: number, type: Transaction['type'], description: string) => {
       const users = load<User[]>(DB_USERS);
       const user = users.find(u => u.id === userId);
       if(!user) throw new Error("User not found");
       
       if (type === 'deposit' || type === 'sale') user.walletBalance += amount;
       if (type === 'withdrawal' || type === 'purchase' || type === 'subscription') user.walletBalance -= amount;
       
       save(DB_USERS, users);

       const tx: Transaction = {
         id: uuidv4(),
         userId,
         type,
         amount,
         description,
         date: Date.now()
       };
       
       const allTx = load<Transaction[]>(DB_TRANSACTIONS);
       allTx.push(tx);
       save(DB_TRANSACTIONS, allTx);
       return tx;
    },
    processPurchase: async (buyerId: string, authorId: string, strategyName: string, amount: number) => {
      const users = load<User[]>(DB_USERS);
      const buyer = users.find(u => u.id === buyerId);
      const author = users.find(u => u.id === authorId);

      if (!buyer) throw new Error("Buyer not found");
      
      buyer.walletBalance -= amount;
      
      const txBuyer: Transaction = {
        id: uuidv4(), userId: buyerId, type: 'purchase', amount,
        description: `Bought strategy: ${strategyName}`, date: Date.now()
      };
      
      if (author) {
        const netEarnings = amount * 0.85; // 15% Platform Fee
        author.walletBalance += netEarnings;
        
        const txSeller: Transaction = {
          id: uuidv4(), userId: authorId, type: 'sale', amount: netEarnings,
          description: `Sold strategy: ${strategyName}`, date: Date.now()
        };
        const allTx = load<Transaction[]>(DB_TRANSACTIONS);
        allTx.push(txBuyer);
        allTx.push(txSeller);
        save(DB_TRANSACTIONS, allTx);
      } else {
        const allTx = load<Transaction[]>(DB_TRANSACTIONS);
        allTx.push(txBuyer);
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
  },

  audit: {
    getAll: async (): Promise<AuditLog[]> => {
      await delay(100);
      return load<AuditLog[]>(DB_AUDIT).sort((a,b) => b.timestamp - a.timestamp);
    },
    log: async (adminId: string, action: string, details: string, targetId?: string) => {
      const logs = load<AuditLog[]>(DB_AUDIT);
      logs.push({
        id: uuidv4(),
        adminId,
        action,
        details,
        targetId,
        timestamp: Date.now(),
        ip: '127.0.0.1' // Mock IP
      });
      save(DB_AUDIT, logs);
    }
  }
};
