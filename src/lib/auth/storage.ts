const TOKEN_KEYS = ["token", "auth_token", "authToken", "smart_school_token"] as const;
const USER_KEYS = ["user", "smart_school_user"] as const;

const readFromStorages = (key: string) =>
  sessionStorage.getItem(key) || localStorage.getItem(key);

export const getStoredToken = (): string | null => {
  for (const key of TOKEN_KEYS) {
    const value = readFromStorages(key);
    if (value) {
      return value;
    }
  }

  return null;
};

export const getStoredUser = (): string | null => {
  for (const key of USER_KEYS) {
    const value = readFromStorages(key);
    if (value) {
      return value;
    }
  }

  return null;
};

export const setStoredAuth = (token: string, user: string) => {
  for (const key of TOKEN_KEYS) {
    sessionStorage.setItem(key, token);
    localStorage.setItem(key, token);
  }

  for (const key of USER_KEYS) {
    sessionStorage.setItem(key, user);
    localStorage.setItem(key, user);
  }
};

export const clearStoredAuth = () => {
  for (const key of TOKEN_KEYS) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }

  for (const key of USER_KEYS) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
};
