import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from "firebase/auth";
import firebaseConfig from "../../../firebase-applet-config.json";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with all requested Gmail scopes
export const googleProvider = new GoogleAuthProvider();

export const GMAIL_SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.metadata",
];

// Attach Gmail scopes to provider
GMAIL_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// Prompt consent to ensure refresh/access tokens are provided
googleProvider.setCustomParameters({
  prompt: "consent",
  access_type: "offline",
});

let cachedAccessToken: string | null = localStorage.getItem("nutrisync_gmail_token");

export const getStoredGmailAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = localStorage.getItem("nutrisync_gmail_token");
  }
  return cachedAccessToken;
};

export const setStoredGmailAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem("nutrisync_gmail_token", token);
  } else {
    localStorage.removeItem("nutrisync_gmail_token");
  }
};

export async function signInWithGoogleForGmail(): Promise<{
  user: User;
  accessToken: string | null;
}> {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    if (accessToken) {
      setStoredGmailAccessToken(accessToken);
    }

    return {
      user: result.user,
      accessToken,
    };
  } catch (error: any) {
    console.error("Firebase Google Auth Error:", error);
    throw error;
  }
}

export async function signOutGoogle(): Promise<void> {
  setStoredGmailAccessToken(null);
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
