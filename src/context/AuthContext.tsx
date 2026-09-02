
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  sustainabilityScore: number;
  totalCO2: number;
  avatar?: string;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (updates: {
    name?: string;
    avatar?: string;
    coverImage?: string;
  }) => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = localStorage.getItem(
        "carbontrack_token"
      );

      /*
       * No token means there is no session to restore.
       */
      if (!token) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }

        return;
      }




try {
  const response = await api.get("/auth/me");
  setUser(response.data.data.user);
} catch (error: any) {
  const status = error?.response?.status;

  if (status === 401) {
    localStorage.removeItem("carbontrack_token");
    setUser(null);
  } else {
    console.error(
      "Failed to restore CarbonTrack session:",
      error
    );
  }
} finally {
  setIsLoading(false);
}      
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ) => {
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    const { token, user } =
      response.data.data;

    localStorage.setItem(
      "carbontrack_token",
      token
    );

    setUser(user);
  };

  const googleLogin = async (
    credential: string
  ) => {
    const response = await api.post(
      "/auth/google",
      {
        credential,
      }
    );

    const { token, user } =
      response.data.data;

    localStorage.setItem(
      "carbontrack_token",
      token
    );

    setUser(user);
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    await api.post(
      "/auth/register",
      {
        name,
        email,
        password,
      }
    );
  };

  const updateUser = async (
    updates: {
      name?: string;
      avatar?: string;
      coverImage?: string;
    }
  ) => {
    const response = await api.patch(
      "/auth/profile",
      updates
    );

    const updatedUser =
      response.data.data.user;

    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem(
      "carbontrack_token"
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        googleLogin,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
