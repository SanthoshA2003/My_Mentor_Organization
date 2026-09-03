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
     GET ORGANIZATION MEMBER
  ============================================================ */

  const getOrganizationMember = async (currentUser) => {
    try {
      if (!currentUser?.email) {
        console.error("❌ Current user email is missing");
        return null;
      }

      console.log(
        "Finding organization member for:",
        currentUser.email
      );

      const response = await api.get(
        "/organizations/me/members"
      );

      console.log(
        "ORGANIZATION MEMBERS RESPONSE:",
        response.data
      );

      const data = response.data;

      // Handle different possible API response formats
      const members = Array.isArray(data)
        ? data
        : data?.members ||
          data?.items ||
          data?.data ||
          [];

      console.log(
        "ORGANIZATION MEMBERS ARRAY:",
        members
      );

      const member = members.find(
        (item) =>
          item.email?.trim().toLowerCase() ===
          currentUser.email.trim().toLowerCase()
      );

      console.log(
        "MATCHED ORGANIZATION MEMBER:",
        member
      );

      if (!member) {
        console.error(
          "❌ Organization member not found"
        );

        console.error(
          "Auth email:",
          currentUser.email
        );

        console.error(
          "Available emails:",
          members.map((item) => item.email)
        );

        return null;
      }

      console.log(
        "✅ ORGANIZATION MEMBER ID:",
        member.id
      );

      return member;

    } catch (error) {
      console.error(
        "❌ GET ORGANIZATION MEMBER ERROR:",
        error
      );

      console.error(
        "STATUS:",
        error.response?.status
      );

      console.error(
        "RESPONSE:",
        error.response?.data
      );

      return null;
    }
  };


  /* ============================================================
     LOAD CURRENT USER
  ============================================================ */

  const loadMe = useCallback(async () => {
    const token =
      localStorage.getItem("mm_token") ||
      sessionStorage.getItem("mm_token");

    console.log(
      "LOAD ME - TOKEN EXISTS:",
      !!token
    );

    if (!token) {
      setUser(null);
      setOrg(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");

      console.log(
        "AUTH ME RESPONSE:",
        response.data
      );

      const data = response.data;

      const currentUser =
        data?.user || data;

      const organization =
        data?.organization || null;

      console.log(
        "CURRENT AUTH USER:",
        currentUser
      );

      console.log(
        "AUTH USER ID:",
        currentUser?.id
      );

      console.log(
        "AUTH USER EMAIL:",
        currentUser?.email
      );

      // Get actual organization member
      const member =
        await getOrganizationMember(
          currentUser
        );

      // Merge member information into user
      const finalUser = {
        ...currentUser,

        // IMPORTANT
        member_id: member?.id || null,

        // Member fields
        name:
          member?.name ||
          currentUser?.name ||
          "",

        email:
          member?.email ||
          currentUser?.email ||
          "",

        phone:
          member?.phone ||
          currentUser?.phone ||
          "",

        department:
          member?.department ||
          currentUser?.department ||
          "",

        designation:
          member?.designation ||
          currentUser?.designation ||
          "",

        role:
          member?.role ||
          currentUser?.role ||
          "",
      };

      console.log(
        "========== FINAL USER =========="
      );

      console.log(
        "USER ID:",
        finalUser.id
      );

      console.log(
        "MEMBER ID:",
        finalUser.member_id
      );

      console.log(
        "NAME:",
        finalUser.name
      );

      console.log(
        "EMAIL:",
        finalUser.email
      );

      console.log(
        "PHONE:",
        finalUser.phone
      );

      console.log(
        "ROLE:",
        finalUser.role
      );

      console.log(
        "==============================="
      );

      setUser(finalUser);
      setOrg(organization);

    } catch (error) {
      console.error(
        "AUTH ME ERROR:",
        error
      );

      console.error(
        "STATUS:",
        error.response?.status
      );

      console.error(
        "RESPONSE:",
        error.response?.data
      );

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

  const login = async (
    email,
    password,
    remember = true
  ) => {
    try {
      console.log(
        "================================="
      );

      console.log(
        "ADMIN LOGIN START"
      );

      console.log(
        "EMAIL:",
        email
      );

      console.log(
        "================================="
      );


      // ==========================================
      // 1. LOGIN
      // ==========================================

      const response = await api.post(
        "/auth/admin/login",
        {
          email,
          password,
        }
      );

      const data = response.data;

      console.log(
        "ADMIN LOGIN RESPONSE:",
        data
      );

      console.log(
        "LOGIN STATUS:",
        response.status
      );


      // ==========================================
      // 2. TOKEN
      // ==========================================

      const token =
        data?.token ||
        data?.access_token;

      console.log(
        "TOKEN RECEIVED:",
        !!token
      );

      if (!token) {
        throw new Error(
          "Login successful but token was not returned by the API."
        );
      }


      // ==========================================
      // 3. REMOVE OLD TOKENS
      // ==========================================

      localStorage.removeItem(
        "mm_token"
      );

      sessionStorage.removeItem(
        "mm_token"
      );


      // ==========================================
      // 4. SAVE TOKEN
      // ==========================================

      if (remember) {
        localStorage.setItem(
          "mm_token",
          token
        );

        console.log(
          "TOKEN SAVED TO LOCAL STORAGE"
        );
      } else {
        sessionStorage.setItem(
          "mm_token",
          token
        );

        console.log(
          "TOKEN SAVED TO SESSION STORAGE"
        );
      }


      // ==========================================
      // 5. GET AUTH USER
      // ==========================================

      console.log(
        "CALLING /auth/me..."
      );

      const meResponse =
        await api.get("/auth/me");

      console.log(
        "AUTH ME AFTER LOGIN:",
        meResponse.data
      );

      const meData =
        meResponse.data;

      const currentUser =
        meData?.user ||
        meData;

      const organization =
        meData?.organization ||
        null;


      // ==========================================
      // 6. GET ACTUAL ORGANIZATION MEMBER
      // ==========================================

      const member =
        await getOrganizationMember(
          currentUser
        );


      // ==========================================
      // 7. CREATE FINAL USER
      // ==========================================

      const finalUser = {
        ...currentUser,

        // THIS IS THE IMPORTANT ID
        member_id:
          member?.id || null,

        name:
          member?.name ||
          currentUser?.name ||
          "",

        email:
          member?.email ||
          currentUser?.email ||
          "",

        phone:
          member?.phone ||
          currentUser?.phone ||
          "",

        department:
          member?.department ||
          currentUser?.department ||
          "",

        designation:
          member?.designation ||
          currentUser?.designation ||
          "",

        role:
          member?.role ||
          currentUser?.role ||
          "",
      };


      console.log(
        "========== LOGIN USER =========="
      );

      console.log(
        "AUTH USER ID:",
        finalUser.id
      );

      console.log(
        "ORGANIZATION MEMBER ID:",
        finalUser.member_id
      );

      console.log(
        "NAME:",
        finalUser.name
      );

      console.log(
        "EMAIL:",
        finalUser.email
      );

      console.log(
        "ROLE:",
        finalUser.role
      );

      console.log(
        "================================"
      );


      // ==========================================
      // 8. SAVE USER
      // ==========================================

      setUser(finalUser);
      setOrg(organization);

      console.log(
        "USER STATE UPDATED"
      );

      console.log(
        "LOGIN COMPLETE"
      );


      return {
        ...data,
        token,
        user: finalUser,
        organization,
      };

    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "ADMIN LOGIN ERROR"
      );

      console.error(
        "================================="
      );

      console.error(
        "ERROR:",
        error
      );

      console.error(
        "STATUS:",
        error.response?.status
      );

      console.error(
        "RESPONSE:",
        error.response?.data
      );

      console.error(
        "MESSAGE:",
        error.message
      );

      throw error;
    }
  };


  /* ============================================================
     LOGOUT
  ============================================================ */

  const logout = async () => {
    try {
      await api.post(
        "/auth/logout"
      );
    } catch (error) {
      console.error(
        "Logout API error:",
        error
      );
    }

    localStorage.removeItem(
      "mm_token"
    );

    sessionStorage.removeItem(
      "mm_token"
    );

    setUser(null);
    setOrg(null);
  };


  /* ============================================================
     PERMISSIONS
  ============================================================ */

  const can = (perm) =>
    (user?.permissions || [])
      .includes(perm);


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

export const useAuth = () =>
  useContext(AuthContext);