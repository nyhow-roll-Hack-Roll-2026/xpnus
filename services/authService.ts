import { User, UserProgress } from '../types';

/**
 * AUTH SERVICE
 * 
 * In a real application, these functions would call your backend API (MongoDB).
 * For this demo, we are mocking the backend using localStorage.
 */

const STORAGE_KEY_USER = 'nus_mc_user';
const STORAGE_KEY_DATA = 'nus_mc_data_';

// Mock DB Call: Login or Register
export const loginUser = async (username: string, avatarUrl: string): Promise<User> => {
  // SIMULATE API DELAY
  await new Promise(resolve => setTimeout(resolve, 800));

  // --- MONGODB IMPLEMENTATION PLAN ---
  // const response = await fetch('/api/login', {
  //   method: 'POST',
  //   body: JSON.stringify({ username, avatarUrl })
  // });
  // return await response.json();
  
  // --- LOCALSTORAGE IMPLEMENTATION ---
  const user: User = {
    username,
    avatarUrl,
    createdAt: Date.now()
  };
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  return user;
};

// Mock DB Call: Update Avatar
export const updateUserAvatar = async (username: string, avatarUrl: string): Promise<User> => {
    // --- MONGODB IMPLEMENTATION PLAN ---
    // const res = await fetch(`/api/users/${username}/avatar`, {
    //    method: 'PUT',
    //    body: JSON.stringify({ avatarUrl })
    // });
    // return await res.json();

    // --- LOCALSTORAGE IMPLEMENTATION ---
    const data = localStorage.getItem(STORAGE_KEY_USER);
    if (data) {
        const user = JSON.parse(data);
        // In a real app we'd verify the username matches the session token or similar
        // Here we just update the stored user if it matches
        if (user.username === username) {
            user.avatarUrl = avatarUrl;
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
            return user;
        }
    }
    throw new Error("User not found or session invalid");
};

// Mock DB Call: Save Progress
export const saveUserProgress = async (username: string, progress: UserProgress): Promise<boolean> => {
    // --- MONGODB IMPLEMENTATION PLAN ---
    // await fetch(`/api/users/${username}/progress`, {
    //   method: 'PUT',
    //   body: JSON.stringify(progress)
    // });
    
    // --- LOCALSTORAGE IMPLEMENTATION ---
    localStorage.setItem(STORAGE_KEY_DATA + username, JSON.stringify(progress));
    console.log(`[Database] Saved progress for ${username}`);
    return true;
};

// Mock DB Call: Load Progress
export const loadUserProgress = async (username: string): Promise<UserProgress | null> => {
    // --- MONGODB IMPLEMENTATION PLAN ---
    // const res = await fetch(`/api/users/${username}/progress`);
    // return await res.json();

    // --- LOCALSTORAGE IMPLEMENTATION ---
    const data = localStorage.getItem(STORAGE_KEY_DATA + username);
    if (data) {
        return JSON.parse(data);
    }
    return null;
};

export const logoutUser = () => {
    localStorage.removeItem(STORAGE_KEY_USER);
};

export const getStoredUser = (): User | null => {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    return data ? JSON.parse(data) : null;
};
