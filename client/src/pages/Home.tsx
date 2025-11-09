import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Login from "./Login";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to products
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/products");
    }
  }, [isAuthenticated, setLocation]);

  // Show login page for non-authenticated users
  if (!isAuthenticated) {
    return <Login />;
  }

  return null;
}

