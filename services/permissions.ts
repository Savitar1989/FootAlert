
import { User, MarketStrategy } from '../types';

// Role Definitions and Limits
export const ROLE_LIMITS = {
  admin: {
    maxStrategies: 1000,
    canModerateMarket: true,
    canBroadcast: true,
  },
  user: {
    maxStrategies: 3, // Free tier limit
    canModerateMarket: false,
    canBroadcast: false,
  }
};

// Subscription overrides for Standard Users
const SUBSCRIPTION_LIMITS = {
  trial: 3,
  weekly: 20,
  monthly: 50
};

export const getStrategyLimit = (user: User | null): number => {
  if (!user) return 0;
  if (user.role === 'admin') return ROLE_LIMITS.admin.maxStrategies;
  
  if (user.subscription.status === 'active') {
    return SUBSCRIPTION_LIMITS[user.subscription.plan] || ROLE_LIMITS.user.maxStrategies;
  }
  
  return ROLE_LIMITS.user.maxStrategies;
};

export const canDeleteMarketItem = (user: User | null, item: MarketStrategy): boolean => {
  if (!user) return false;
  // Admins can delete anything (Moderation)
  if (user.role === 'admin') return true;
  // Users can only delete their own items
  return user.id === item.userId;
};

export const canBroadcast = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const canAccessAdminPanel = (user: User | null): boolean => {
  return user?.role === 'admin';
};
