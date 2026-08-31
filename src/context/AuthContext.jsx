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

  /* ============================================================
     LOAD CURRENT USER
  ============================================================ */

  const loadMe = useCallback(async () => {
    const token =
      localStorage.getItem("mm_token") ||
      sessionStorage.getItem("mm_token");

    console.log("LOAD ME - TOKEN EXISTS:", !!token);

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

      /*
        Support both:

        {
          "user": {...},
          "organization": {...}
        }

        OR

        {
          "id": "...",
          "name": "...",
          ...
        }
      */

      const currentUser = data?.user || data;
      const organization = data?.organization || null;

      console.log("CURRENT USER:", currentUser);
      console.log("ORGANIZATION:", organization);

      setUser(currentUser);
      setOrg(organization);
    } catch (error) {
      console.error("AUTH ME ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("RESPONSE:", error.response?.data);

      localStorage.removeItem("mm_token");
      sessionStorage.removeItem("mm_token");

      setUser(null);
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     INITIAL AUTH CHECK
  ============================================================ */

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  /* ============================================================
     ADMIN LOGIN
  ============================================================ */

  const login = async (email, password, remember = true) => {
    try {
      console.log("=================================");
      console.log("ADMIN LOGIN START");
      console.log("EMAIL:", email);
      console.log("=================================");

      /* --------------------------------------------------------
         1. LOGIN API
      -------------------------------------------------------- */

      const response = await api.post("/auth/admin/login", {
        email,
        password,
      });

      const data = response.data;

      console.log("ADMIN LOGIN RESPONSE:", data);
      console.log("LOGIN STATUS:", response.status);

      /* --------------------------------------------------------
         2. GET TOKEN
      -------------------------------------------------------- */

      const token = data?.token || data?.access_token;

      console.log("TOKEN RECEIVED:", !!token);

      if (!token) {
        throw new Error(
          "Login successful but token was not returned by the API."
        );
      }

      /* --------------------------------------------------------
         3. REMOVE OLD TOKENS
      -------------------------------------------------------- */

      localStorage.removeItem("mm_token");
      sessionStorage.removeItem("mm_token");

      /* --------------------------------------------------------
         4. SAVE NEW TOKEN
      -------------------------------------------------------- */

      if (remember) {
        localStorage.setItem("mm_token", token);
        console.log("TOKEN SAVED TO LOCAL STORAGE");
      } else {
        sessionStorage.setItem("mm_token", token);
        console.log("TOKEN SAVED TO SESSION STORAGE");
      }

      /* --------------------------------------------------------
         5. GET CURRENT LOGGED-IN USER
         
         IMPORTANT:
         This is the missing part in your current code.
      -------------------------------------------------------- */

      console.log("CALLING /auth/me...");

      const meResponse = await api.get("/auth/me");

      console.log(
        "AUTH ME AFTER LOGIN:",
        meResponse.data
      );

      const meData = meResponse.data;

      /* --------------------------------------------------------
         6. EXTRACT USER
      -------------------------------------------------------- */

      const currentUser =
        meData?.user || meData;

      const organization =
        meData?.organization || null;

      console.log(
        "CURRENT USER AFTER LOGIN:",
        currentUser
      );

      console.log(
        "ORGANIZATION AFTER LOGIN:",
        organization
      );

      /* --------------------------------------------------------
         7. SAVE USER TO REACT STATE
      -------------------------------------------------------- */

      setUser(currentUser);
      setOrg(organization);

      console.log("USER STATE UPDATED");
      console.log("LOGIN COMPLETE");

      return {
        ...data,
        token,
        user: currentUser,
        organization,
      };
    } catch (error) {
      console.error("=================================");
      console.error("ADMIN LOGIN ERROR");
      console.error("=================================");

      console.error("ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("RESPONSE:", error.response?.data);
      console.error("MESSAGE:", error.message);

      throw error;
    }
  };

  /* ============================================================
     LOGOUT
  ============================================================ */

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

  /* ============================================================
     PERMISSIONS
  ============================================================ */

  const can = (perm) =>
    (user?.permissions || []).includes(perm);

  /* ============================================================
     PROVIDER
  ============================================================ */

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