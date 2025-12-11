

import { db } from './db';
import { User, AlertStrategy, MarketStrategy } from '../types';

export const processSubscription = async (user: User, planId: 'weekly' | 'monthly'): Promise<User> => {
  // Simulate Stripe API Latency
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const updatedUser = await db.users.updateSubscription(user.id, planId);
  if (!updatedUser) throw new Error("User update failed");
  
  return updatedUser;
};

export const buyStrategy = async (user: User, strategy: MarketStrategy): Promise<void> => {
  // Simulate Payment Processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (strategy.price > 0) {
    // Process Transaction (Deduct from buyer via card, Add to seller wallet)
    // We assume 'system' user implies no payout needed, otherwise payout to author
    if (strategy.userId !== 'system') {
      await db.transactions.processPurchase(user.id, strategy.userId, strategy.name, strategy.price);
    }
  }
};
