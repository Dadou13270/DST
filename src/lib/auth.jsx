import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profil, setProfil] = useState(null); // users/{uid}
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(auth));

  const charge = async (u) => {
    if (!u) {
      setProfil(null);
      setIsAdmin(false);
      return;
    }
    try {
      setIsAdmin((await getDoc(doc(db, "admins", u.uid))).exists());
    } catch {
      setIsAdmin(false);
    }
    try {
      const ref = doc(db, "users", u.uid);
      const s = await getDoc(ref);
      if (s.exists()) {
        setProfil({ id: u.uid, ...s.data(), email: u.email });
        if (s.data().email !== u.email) updateDoc(ref, { email: u.email }).catch(() => {}); // e-mail modifié dans le profil
        updateDoc(ref, { derniereConnexion: serverTimestamp() }).catch(() => {});
      } else {
        // compte antérieur à la page d'inscription (ex. admin créé à la main)
        const p = { email: u.email, nom: u.displayName || u.email, statut: "actif", creeLe: serverTimestamp() };
        await setDoc(ref, p).catch(() => {});
        setProfil({ id: u.uid, ...p, statut: "actif" });
      }
    } catch {
      setProfil({ id: u.uid, email: u.email, nom: u.email, statut: "actif" });
    }
  };

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await charge(u);
      setLoading(false);
    });
  }, []);

  const refreshProfil = () => charge(auth.currentUser);
  const login = (email, pwd) => signInWithEmailAndPassword(auth, email, pwd);

  const register = async (nom, email, pwd) => {
    const c = await createUserWithEmailAndPassword(auth, email, pwd);
    await updateProfile(c.user, { displayName: nom });
    await setDoc(doc(db, "users", c.user.uid), {
      email,
      nom,
      statut: "actif",
      creeLe: serverTimestamp(),
      derniereConnexion: serverTimestamp(),
    });
    await charge(c.user);
    return c.user;
  };

  // Connexion / inscription avec Google : le profil users/{uid} est créé au premier passage (voir charge).
  const loginGoogle = async () => (await signInWithPopup(auth, new GoogleAuthProvider())).user;
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const logout = () => (auth ? signOut(auth) : Promise.resolve());

  return (
    <Ctx.Provider value={{ user, profil, isAdmin, loading, refreshProfil, login, loginGoogle, register, resetPassword, logout }}>
      {children}
    </Ctx.Provider>
  );
}
