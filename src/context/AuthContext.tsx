import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../types";
import { api, getAuthToken, setAuthSession, clearAuthSession, setActiveUserId } from "../lib/api";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  allDemoUsers: UserProfile[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUpCandidate: (
    fullName: string,
    email: string,
    password: string,
    confirmPassword?: string,
    phone?: string
  ) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  switchUser: (userId: string) => Promise<void>;
  registerUser: (email: string, fullName: string, role?: string, phone?: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  toastMessage: { text: string; type: "success" | "error" | "info" } | null;
  showToast: (text: string, type?: "success" | "error" | "info") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allDemoUsers, setAllDemoUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const refreshAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      // Fetch public list of demo users for testing helper if available
      try {
        const data = await api.getMe().catch(() => null);
        if (data?.allDemoUsers) {
          setAllDemoUsers(data.allDemoUsers);
        }
      } catch {
        // ignore
      }
      return;
    }

    try {
      setLoading(true);
      const data = await api.getMe();
      setUser(data.user);
      if (data.allDemoUsers) {
        setAllDemoUsers(data.allDemoUsers);
      }
    } catch (err: any) {
      // If token expired or invalid, clear session
      clearAuthSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();

    // Listen to Supabase auth events if client is available
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setAuthSession(session.access_token, session.user.id);
          try {
            const data = await api.getMe();
            setUser(data.user);
          } catch {
            // ignore
          }
        } else if (_event === "SIGNED_OUT") {
          clearAuthSession();
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<UserProfile> => {
    try {
      setLoading(true);
      const res = await api.login({ email, password });
      setAuthSession(res.token, res.user.id);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.fullName}!`, "success");
      return res.user;
    } catch (err: any) {
      showToast(err.message || "Failed to sign in. Please verify your credentials.", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpCandidate = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword?: string,
    phone?: string
  ): Promise<UserProfile> => {
    try {
      setLoading(true);

      let effectiveConfirmPassword = confirmPassword;
      let effectivePhone = phone;

      // Handle edge cases where a caller might have passed (fullName, email, password, phone) with 4 arguments
      if (phone === undefined && confirmPassword && confirmPassword !== password) {
        const looksLikePhone = /^[\d\s+\-()]{6,}$/.test(confirmPassword.trim());
        if (looksLikePhone) {
          effectivePhone = confirmPassword;
          effectiveConfirmPassword = undefined;
        }
      }

      if (effectiveConfirmPassword !== undefined && effectiveConfirmPassword !== "" && password !== effectiveConfirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const res = await api.registerCandidate({
        fullName,
        email,
        password,
        confirmPassword: effectiveConfirmPassword,
        phone: effectivePhone,
      });
      setAuthSession(res.token, res.user.id);
      setUser(res.user);
      showToast("Candidate account created successfully! Welcome to Nowshera Digital ATS.", "success");
      return res.user;
    } catch (err: any) {
      showToast(err.message || "Registration failed. Please check your details.", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      await api.logout().catch(() => {});
    } finally {
      clearAuthSession();
      setUser(null);
      showToast("You have been signed out.", "info");
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    try {
      const res = await api.forgotPassword({ email });
      showToast(res.message, "success");
      return res.message;
    } catch (err: any) {
      showToast(err.message || "Failed to submit password reset request.", "error");
      throw err;
    }
  };

  const switchUser = async (userId: string) => {
    try {
      setActiveUserId(userId);
      const res = await api.switchDemoUser(userId);
      setUser(res.user);
      showToast(`Switched active account to: ${res.user.fullName} (${res.user.role})`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to switch user", "error");
    }
  };

  const registerUser = async (email: string, fullName: string, role = "candidate", phone = "") => {
    try {
      const res = await api.register({ email, fullName, role, phone });
      setActiveUserId(res.user.id);
      setUser(res.user);
      setAllDemoUsers((prev) => [...prev, res.user]);
      showToast(`Account created successfully for ${res.user.fullName}!`, "success");
    } catch (err: any) {
      showToast(err.message || "Registration failed", "error");
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allDemoUsers,
        loading,
        signIn,
        signUpCandidate,
        signOut,
        forgotPassword,
        switchUser,
        registerUser,
        refreshAuth,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
