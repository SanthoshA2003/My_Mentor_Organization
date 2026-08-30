import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get currently logged-in admin
  const loadMe = useCallback(async () => {
    const token =
      localStorage.getItem("mm_token") ||
      sessionStorage.getItem("mm_token");

    console.log("Token exists:", !!token);

    if (!token) {
      setUser(null);
      setOrg(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");

      console.log("AUTH ME RESPONSE:", response.data);

      const data = response.data;

      // Support API response
      // { user: {...}, organization: {...} }
      const currentUser = data.user || data;
      const organization = data.organization || null;

      console.log("CURRENT USER:", currentUser);
      console.log("ORGANIZATION:", organization);

      setUser(currentUser);
      setOrg(organization);
    } catch (error) {
      console.error("AUTH ME ERROR:", error);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);

      localStorage.removeItem("mm_token");
      sessionStorage.removeItem("mm_token");

      setUser(null);
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  // Admin Login
  const login = async (email, password, remember = true) => {
    try {
      console.log("ADMIN LOGIN START");

      const response = await api.post("/auth/admin/login", {
        email,
        password,
      });

      const data = response.data;

      console.log("ADMIN LOGIN RESPONSE:", data);

      if (!data.token) {
        throw new Error(
          "Login successful but token was not returned."
        );
      }

      // Remove old tokens
      localStorage.removeItem("mm_token");
      sessionStorage.removeItem("mm_token");

      // Save token
      if (remember) {
        localStorage.setItem("mm_token", data.token);
      } else {
        sessionStorage.setItem("mm_token", data.token);
      }

      console.log("TOKEN SAVED");

      // Get current logged-in user
      const meResponse = await api.get("/auth/me");

      console.log(
        "AUTH ME AFTER LOGIN:",
        meResponse.data
      );

      const meData = meResponse.data;

      const currentUser = meData.user || meData;
      const organization = meData.organization || null;

      console.log("SETTING USER:", currentUser);
      console.log("SETTING ORGANIZATION:", organization);

      setUser(currentUser);
      setOrg(organization);

      return {
        ...data,
        user: currentUser,
        organization,
      };
    } catch (error) {
      console.error("ADMIN LOGIN ERROR:", error);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);

      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    }

    localStorage.removeItem("mm_token");
    sessionStorage.removeItem("mm_token");

    setUser(null);
    setOrg(null);
  };

  const can = (perm) =>
    (user?.permissions || []).includes(perm);

  return (
    <AuthContext.Provider
      value={{
        user,
        org,
        setOrg,
        setUser,
        loading,
        login,
        logout,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);