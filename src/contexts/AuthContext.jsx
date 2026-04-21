import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);

// --- MODO LOCAL (sem Firebase configurado) ---
const FIREBASE_READY = !!import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.startsWith("sua-");

const LOCAL_USERS_KEY = "smartslit-local-users";
const LOCAL_SESSION_KEY = "smartslit-local-session";

const LOCAL_SEED_USERS = [];

const getLocalUsers = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    const emails = new Set(stored.map((u) => u.email));
    const merged = [...stored];
    LOCAL_SEED_USERS.forEach((u) => { if (!emails.has(u.email)) merged.push(u); });
    return merged;
  } catch {
    return [...LOCAL_SEED_USERS];
  }
};

const saveLocalUsers = (users) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const localLogin = (email, password) => {
  const users = getLocalUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("E-mail ou senha incorretos.");
  const session = { uid: user.uid, email: user.email };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  return user;
};

const localRegister = (email, password, companyName, displayName) => {
  const users = getLocalUsers();
  if (users.find((u) => u.email === email)) throw new Error("Este e-mail já está cadastrado.");
  const newUser = {
    uid: `local-${Date.now()}`,
    email,
    password,
    displayName,
    companyName,
    companyId: `local-${Date.now()}`,
    plan: "free",
  };
  saveLocalUsers([...users, newUser]);
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ uid: newUser.uid, email: newUser.email }));
  return newUser;
};

const localLogout = () => localStorage.removeItem(LOCAL_SESSION_KEY);

const getLocalSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || "null");
    if (!session) return null;
    const users = getLocalUsers();
    return users.find((u) => u.uid === session.uid) || null;
  } catch {
    return null;
  }
};

const toProfile = (u) => ({
  email: u.email,
  displayName: u.displayName,
  companyName: u.companyName,
  companyId: u.companyId,
  plan: u.plan,
});
// --- FIM MODO LOCAL ---

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (!FIREBASE_READY) {
      // Modo local: checar sessão salva
      const saved = getLocalSession();
      if (saved) {
        setUser({ uid: saved.uid, email: saved.email });
        setUserProfile(toProfile(saved));
      } else {
        setUser(null);
      }
      return;
    }

    // Modo Firebase
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        setUserProfile(docSnap.exists() ? docSnap.data() : null);
        setUser(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    if (!FIREBASE_READY) {
      const u = localLogin(email, password);
      setUser({ uid: u.uid, email: u.email });
      setUserProfile(toProfile(u));
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password, companyName, displayName) => {
    if (!FIREBASE_READY) {
      const u = localRegister(email, password, companyName, displayName);
      setUser({ uid: u.uid, email: u.email });
      setUserProfile(toProfile(u));
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile = { email, displayName, companyName, companyId: cred.user.uid, plan: "free", createdAt: serverTimestamp() };
    await setDoc(doc(db, "users", cred.user.uid), profile);
    setUserProfile(profile);
  };

  const loginWithGoogle = async () => {
    if (!FIREBASE_READY) {
      throw new Error("Login com Google disponível após configurar o Firebase.");
    }
    let cred;
    try {
      cred = await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === "auth/popup-blocked") { await signInWithRedirect(auth, googleProvider); return; }
      throw err;
    }
    const ref = doc(db, "users", cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { email: cred.user.email, displayName: cred.user.displayName, companyName: cred.user.displayName || cred.user.email, companyId: cred.user.uid, plan: "free", createdAt: serverTimestamp() });
    }
  };

  const logout = () => {
    if (!FIREBASE_READY) { localLogout(); setUser(null); setUserProfile(null); return; }
    return signOut(auth);
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, register, login, loginWithGoogle, logout, firebaseReady: FIREBASE_READY }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
