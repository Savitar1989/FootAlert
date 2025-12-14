
import { User, AlertStrategy, ApiSettings, SystemStats, TargetOutcome, CriteriaMetric, Operator, Transaction, MarketStrategy, AuditLog, GlobalSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { MOCK_MARKET_STRATEGIES } from '../constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const CLOUD_CONFIG_KEY = 'footalert_cloud_config';

interface CloudConfig {
  enabled: boolean;
  url: string;
  key: string;
}

const getCloudConfig = (): CloudConfig | null => {
  const stored = localStorage.getItem(CLOUD_CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
};

// --- INITIALIZE SUPABASE ---
let supabase: SupabaseClient | null = null;
const cloudConfig = getCloudConfig();

if (cloudConfig && cloudConfig.enabled && cloudConfig.url && cloudConfig.key) {
  try {
    supabase = createClient(cloudConfig.url, cloudConfig.key);
    console.log("🔌 Connected to Supabase Cloud DB");
  } catch (e) {
    console.error("Failed to initialize Supabase", e);
  }
}

// --- LOCAL STORAGE KEYS ---
const DB_USERS = 'footalert_db_users';
const DB_STRATEGIES = 'footalert_db_strategies';
const DB_MARKET = 'footalert_db_market'; 
const DB_SETTINGS = 'footalert_db_settings';
const DB_GLOBAL_SETTINGS = 'footalert_db_global_settings';
const DB_STATS = 'footalert_db_stats';
const DB_TRANSACTIONS = 'footalert_db_transactions';
const DB_AUDIT = 'footalert_db_audit';

// --- DEFAULTS ---
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

// --- HELPERS ---
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const load = <T>(key: string): T => JSON.parse(localStorage.getItem(key) || '[]');
const save = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// --- INIT LOCAL DATA ---
const initLocalDB = () => {
  if (!localStorage.getItem(DB_USERS)) {
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
      passwordHash: adminHash
    } as any;
    localStorage.setItem(DB_USERS, JSON.stringify([admin]));
  }
  if (!localStorage.getItem(DB_STRATEGIES)) localStorage.setItem(DB_STRATEGIES, JSON.stringify([]));
  if (!localStorage.getItem(DB_MARKET)) localStorage.setItem(DB_MARKET, JSON.stringify(MOCK_MARKET_STRATEGIES));
  if (!localStorage.getItem(DB_SETTINGS)) localStorage.setItem(DB_SETTINGS, JSON.stringify([]));
  if (!localStorage.getItem(DB_GLOBAL_SETTINGS)) localStorage.setItem(DB_GLOBAL_SETTINGS, JSON.stringify(DEFAULT_GLOBAL_SETTINGS));
  if (!localStorage.getItem(DB_TRANSACTIONS)) localStorage.setItem(DB_TRANSACTIONS, JSON.stringify([]));
  if (!localStorage.getItem(DB_AUDIT)) localStorage.setItem(DB_AUDIT, JSON.stringify([]));
  if (!localStorage.getItem(DB_STATS)) {
    localStorage.setItem(DB_STATS, JSON.stringify({
      totalUsers: 1, totalStrategies: 0, totalAlertsSent: 14502, serverLoad: 12, globalRoi: 5.4, traffic: Array(7).fill(0).map(()=>Math.random()*500)
    }));
  }
};

initLocalDB();

// --- DATABASE SERVICE ---
export const db = {
  get isCloud() { return !!supabase; },

  users: {
    getAll: async (): Promise<User[]> => {
      if (supabase) {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) return data as unknown as User[];
      }
      await delay(200);
      return load<User[]>(DB_USERS);
    },
    getById: async (id: string): Promise<User | undefined> => {
      if (supabase) {
        const { data } = await supabase.from('users').select('*').eq('id', id).single();
        if (data) return data as unknown as User;
      }
      const users = load<User[]>(DB_USERS);
      return users.find(u => u.id === id);
    },
    create: async (username: string, email: string, passwordHash?: string): Promise<User> => {
      const newUser: any = {
        id: uuidv4(),
        username,
        email,
        passwordHash,
        role: 'user',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        walletBalance: 0,
        twoFactorEnabled: false,
        preferences: { email: true, push: true, sound: true, telegram: false },
        subscription: { plan: 'trial', status: 'active', expiryDate: Date.now() + (86400000) }
      };

      if (supabase) {
        const { error } = await supabase.from('users').insert(newUser);
        if (error) throw new Error(error.message);
        
        // Create Default Strategy for Cloud User
        await db.strategies.create({ ...DEFAULT_STRATEGY_TEMPLATE, userId: newUser.id, id: uuidv4() } as AlertStrategy);
        return newUser;
      }

      // Local Fallback
      await delay(500);
      const users = load<any[]>(DB_USERS);
      if (users.find(u => u.username === username)) throw new Error("Username taken");
      users.push(newUser);
      save(DB_USERS, users);
      
      await db.strategies.create({ ...DEFAULT_STRATEGY_TEMPLATE, userId: newUser.id, id: uuidv4() } as AlertStrategy);
      const stats = load<SystemStats>(DB_STATS);
      stats.totalUsers++;
      save(DB_STATS, stats);

      return newUser;
    },
    login: async (username: string): Promise<any> => {
      if (supabase) {
        // Simple select for demo (In real app, use supabase.auth.signIn)
        const { data, error } = await supabase.from('users').select('*').or(`username.eq.${username},email.eq.${username}`).single();
        if (error || !data) throw new Error("User not found in Cloud DB");
        return data;
      }

      await delay(500);
      const users = load<any[]>(DB_USERS);
      const user = users.find(u => u.username === username || u.email === username);
      if (!user) throw new Error("User not found");
      if (user.isBanned) throw new Error("Account suspended");
      return user;
    },
    updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
      if (supabase) {
        const { data: updated, error } = await supabase.from('users').update(data).eq('id', userId).select().single();
        if (error) throw new Error(error.message);
        return updated as unknown as User;
      }

      const users = load<User[]>(DB_USERS);
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) throw new Error("User not found");
      users[idx] = { ...users[idx], ...data };
      save(DB_USERS, users);
      return users[idx];
    },
    toggle2FA: async (userId: string, enable: boolean): Promise<User> => {
      return db.users.updateProfile(userId, { twoFactorEnabled: enable });
    },
    updateSubscription: async (userId: string, plan: 'weekly' | 'monthly') => {
      const duration = plan === 'weekly' ? 7 : 30;
      const subData = {
        subscription: {
          plan,
          status: 'active',
          expiryDate: Date.now() + (duration * 24 * 60 * 60 * 1000)
        }
      };
      if (supabase) {
         await supabase.from('users').update(subData).eq('id', userId);
         const { data } = await supabase.from('users').select('*').eq('id', userId).single();
         return data as unknown as User;
      }
      
      const users = load<User[]>(DB_USERS);
      const user = users.find(u => u.id === userId);
      if (user) {
        user.subscription = subData.subscription as any;
        save(DB_USERS, users);
        return user;
      }
    },
    updateWallet: async (userId: string, amount: number) => {
       // Note: This needs atomic increment in real DB
       const user = await db.users.getById(userId);
       if (user) {
         const newBalance = user.walletBalance + amount;
         await db.users.updateProfile(userId, { walletBalance: newBalance });
       }
    },
    adminBanUser: async (userId: string, isBanned: boolean) => {
       await db.users.updateProfile(userId, { isBanned });
    },
    adminAdjustBalance: async (userId: string, amount: number) => {
       await db.users.updateProfile(userId, { walletBalance: amount });
    }
  },

  strategies: {
    getAll: async (): Promise<AlertStrategy[]> => {
      if (supabase) {
        const { data } = await supabase.from('strategies').select('*');
        return (data || []) as unknown as AlertStrategy[];
      }
      await delay(200);
      return load<AlertStrategy[]>(DB_STRATEGIES);
    },
    getByUser: async (userId: string): Promise<AlertStrategy[]> => {
      if (supabase) {
        const { data } = await supabase.from('strategies').select('*').eq('userId', userId);
        return (data || []) as unknown as AlertStrategy[];
      }
      await delay(200);
      const all = load<AlertStrategy[]>(DB_STRATEGIES);
      return all.filter(s => s.userId === userId);
    },
    create: async (strategy: AlertStrategy): Promise<AlertStrategy> => {
      if (supabase) {
        await supabase.from('strategies').insert(strategy);
        return strategy;
      }
      const all = load<AlertStrategy[]>(DB_STRATEGIES);
      all.push(strategy);
      save(DB_STRATEGIES, all);
      
      const stats = load<SystemStats>(DB_STATS);
      stats.totalStrategies++;
      save(DB_STATS, stats);
      return strategy;
    },
    update: async (strategy: AlertStrategy): Promise<void> => {
      if (supabase) {
        await supabase.from('strategies').update(strategy).eq('id', strategy.id);
        return;
      }
      const all = load<AlertStrategy[]>(DB_STRATEGIES);
      const idx = all.findIndex(s => s.id === strategy.id);
      if (idx !== -1) {
        all[idx] = strategy;
        save(DB_STRATEGIES, all);
      }
    },
    delete: async (id: string): Promise<void> => {
      if (supabase) {
        await supabase.from('strategies').delete().eq('id', id);
        return;
      }
      let all = load<AlertStrategy[]>(DB_STRATEGIES);
      all = all.filter(s => s.id !== id);
      save(DB_STRATEGIES, all);
    },
    logAlert: async () => {
       // In cloud, we might increment a counter table
       if(!supabase) {
         const stats = load<SystemStats>(DB_STATS);
         stats.totalAlertsSent++;
         save(DB_STATS, stats);
       }
    }
  },

  market: {
    getAll: async (): Promise<MarketStrategy[]> => {
      if (supabase) {
        const { data } = await supabase.from('market_strategies').select('*');
        return (data || []) as unknown as MarketStrategy[];
      }
      await delay(300);
      return load<MarketStrategy[]>(DB_MARKET);
    },
    create: async (strategy: MarketStrategy): Promise<void> => {
      if (supabase) {
        await supabase.from('market_strategies').insert(strategy);
        return;
      }
      const all = load<MarketStrategy[]>(DB_MARKET);
      all.push(strategy);
      save(DB_MARKET, all);
    },
    delete: async (id: string): Promise<void> => {
      if (supabase) {
        await supabase.from('market_strategies').delete().eq('id', id);
        return;
      }
      let all = load<MarketStrategy[]>(DB_MARKET);
      all = all.filter(s => s.id !== id);
      save(DB_MARKET, all);
    }
  },

  settings: {
    get: async (userId: string): Promise<ApiSettings> => {
      if (supabase) {
        const { data } = await supabase.from('settings').select('*').eq('userId', userId).single();
        return (data as unknown as ApiSettings) || { 
          userId, apiKey: '', primaryProvider: 'api-football', refreshRate: 60, useDemoData: true 
        };
      }
      await delay(100);
      const all = load<ApiSettings[]>(DB_SETTINGS);
      const found = all.find(s => s.userId === userId);
      return found || { 
        userId, apiKey: '', sportMonksApiKey: '', oddsApiKey: '', primaryProvider: 'api-football', refreshRate: 60, useDemoData: true 
      };
    },
    save: async (settings: ApiSettings): Promise<void> => {
      if (supabase) {
        const { error } = await supabase.from('settings').upsert(settings, { onConflict: 'userId' });
        if (error) console.error("Settings save failed", error);
        return;
      }
      let all = load<ApiSettings[]>(DB_SETTINGS);
      const idx = all.findIndex(s => s.userId === settings.userId);
      if (idx !== -1) all[idx] = settings;
      else all.push(settings);
      save(DB_SETTINGS, all);
    }
  },

  globalSettings: {
    get: async (): Promise<GlobalSettings> => {
      // Typically global settings are env vars or a single row in DB
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
      if (supabase) {
        const { data } = await supabase.from('transactions').select('*').eq('userId', userId).order('date', { ascending: false });
        return (data || []) as unknown as Transaction[];
      }
      await delay(200);
      const all = load<Transaction[]>(DB_TRANSACTIONS);
      return all.filter(t => t.userId === userId).sort((a,b) => b.date - a.date);
    },
    create: async (userId: string, amount: number, type: Transaction['type'], description: string) => {
       // Update User Balance
       await db.users.updateWallet(userId, type === 'deposit' || type === 'sale' ? amount : -amount);

       const tx: Transaction = {
         id: uuidv4(), userId, type, amount, description, date: Date.now()
       };
       
       if (supabase) {
         await supabase.from('transactions').insert(tx);
         return tx;
       }

       const allTx = load<Transaction[]>(DB_TRANSACTIONS);
       allTx.push(tx);
       save(DB_TRANSACTIONS, allTx);
       return tx;
    },
    processPurchase: async (buyerId: string, authorId: string, strategyName: string, amount: number) => {
      // Deduction
      await db.transactions.create(buyerId, amount, 'purchase', `Bought strategy: ${strategyName}`);
      
      // Credit Author (if not system)
      if (authorId && authorId !== 'system') {
        const netEarnings = amount * 0.85; 
        await db.transactions.create(authorId, netEarnings, 'sale', `Sold strategy: ${strategyName}`);
      }
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
      if (supabase) {
        const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
        return (data || []) as unknown as AuditLog[];
      }
      await delay(100);
      return load<AuditLog[]>(DB_AUDIT).sort((a,b) => b.timestamp - a.timestamp);
    },
    log: async (adminId: string, action: string, details: string, targetId?: string) => {
      const entry = {
        id: uuidv4(), adminId, action, details, targetId, timestamp: Date.now(), ip: '127.0.0.1'
      };
      if (supabase) {
        await supabase.from('audit_logs').insert(entry);
        return;
      }
      const logs = load<AuditLog[]>(DB_AUDIT);
      logs.push(entry);
      save(DB_AUDIT, logs);
    }
  }
};
