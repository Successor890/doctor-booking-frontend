import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type AuthUser = {
  id: number;
  email: string;
  role: "PATIENT" | "ADMIN";
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { user: AuthUser; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        localStorage.removeItem("auth");
      }
    }
    setInitializing(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Login failed");
    }
    const data = await res.json(); // { token, user }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("auth", JSON.stringify({ token: data.token, user: data.user }));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth");
  }

  if (initializing) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
