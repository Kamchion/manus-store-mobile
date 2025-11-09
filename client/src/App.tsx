import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import ProductVariants from "./pages/ProductVariants";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import AdminPanel from "./pages/AdminPanel";
import VendedorDashboard from "./pages/VendedorDashboard";
import DevLogin from "./pages/DevLogin";
import Login from "./pages/Login";
import Header from "./components/Header";
import AnnouncementPopup from "./components/AnnouncementPopup";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Show loading screen during authentication check
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirect to home (login) if not authenticated and not on public routes
  useEffect(() => {
    if (!isAuthenticated && location !== "/" && location !== "/login" && location !== "/dev-login") {
      setLocation("/");
    }
  }, [isAuthenticated, location, setLocation]);

  return (
    <>
      {/* Announcement popup - shows after login */}
      {isAuthenticated && <AnnouncementPopup />}
      
      <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/dev-login"} component={DevLogin} />
      
      {/* Protected routes - require authentication */}
      {isAuthenticated && (
        <>
          <Route path={"/products"} component={Products} />
          <Route path={"/product-variants"} component={ProductVariants} />
          <Route path={"/products/:id"} component={ProductDetail} />
          <Route path={"/cart"} component={Cart} />
          <Route path={"/orders"} component={Orders} />
          <Route path={"/orders/:id"} component={OrderDetail} />
          <Route path={"/admin"} component={AdminPanel} />
          <Route path={"/vendedor"} component={VendedorDashboard} />
        </>
      )}

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading screen during logout
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="flex flex-col min-h-screen">
            {isAuthenticated && <Header />}
            <main className="flex-1">
              <Router />
            </main>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

