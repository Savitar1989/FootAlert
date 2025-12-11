
import { User } from '../types';
import { db } from './db';

const CURRENT_USER_KEY = 'footalert_session';

export const login = async (username: string, password: string): Promise<User> => {
  // In a real app, verify password hash here.
  // For demo, we trust the DB lookup if username exists.
  const user = await db.users.login(username);
  
  if (user.role === 'admin' && password !== 'admin') {
     throw new Error("Invalid admin credentials");
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const register = async (username: string, email: string, password: string): Promise<User> => {
  const user = await db.users.create(username, email);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Admin function
export const getAllUsers = async (): Promise<User[]> => {
  return await db.users.getAll();
};
