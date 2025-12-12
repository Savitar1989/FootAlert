
import { User } from '../types';
import { db } from './db';
import { hashPassword } from './crypto';

const CURRENT_USER_KEY = 'footalert_session';
// In a real app, this secret lives on the server. 
// Here we use it to sign local data to prevent basic tamper attempts.
const CLIENT_SECRET = "ft_alert_secure_sig_v1"; 

// Helper to "Sign" the session object
const signSession = (user: User): string => {
  const payload = JSON.stringify(user);
  const signature = btoa(payload + CLIENT_SECRET); // Simple mock signature
  return btoa(JSON.stringify({ payload, signature }));
};

// Helper to Verify and Decode
const verifySession = (token: string): User | null => {
  try {
    const decoded = JSON.parse(atob(token));
    const { payload, signature } = decoded;
    
    // Check integrity
    const expectedSig = btoa(payload + CLIENT_SECRET);
    if (signature !== expectedSig) {
      console.warn("Session tampering detected. Logging out.");
      return null;
    }
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
};

export const login = async (username: string, password: string): Promise<User> => {
  const user = await db.users.login(username);
  
  // Verify password using hash
  const inputHash = await hashPassword(password);
  const dbPass = (user as any).passwordHash || (user as any).password;
  
  if (dbPass !== inputHash) {
     throw new Error("Invalid credentials");
  }

  // Remove sensitivity before session store
  const safeUser = { ...user };
  delete (safeUser as any).passwordHash;
  delete (safeUser as any).password;

  const token = signSession(safeUser);
  localStorage.setItem(CURRENT_USER_KEY, token);
  return safeUser;
};

export const register = async (username: string, email: string, password: string): Promise<User> => {
  const hashed = await hashPassword(password);
  const user = await db.users.create(username, email, hashed);
  
  const safeUser = { ...user };
  delete (safeUser as any).passwordHash;
  
  const token = signSession(safeUser);
  localStorage.setItem(CURRENT_USER_KEY, token);
  return safeUser;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;
  
  // Backward compatibility for old plain JSON sessions (flush them for security)
  if (stored.trim().startsWith('{')) {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }

  return verifySession(stored);
};

// Admin function
export const getAllUsers = async (): Promise<User[]> => {
  return await db.users.getAll();
};

export const impersonate = async (userId: string): Promise<void> => {
  const user = await db.users.getById(userId);
  if (!user) throw new Error("User not found");
  
  const safeUser = { ...user };
  delete (safeUser as any).passwordHash;

  const token = signSession(safeUser);
  localStorage.setItem(CURRENT_USER_KEY, token);
  window.location.reload();
};
