import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { ShoppingCart, LogOut, Menu, X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: logoConfig } = trpc.config.getLogoConfig.useQuery();
  
  // Get cart items count
  const { data: cartItems } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const cartItemsCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setMobileMenuOpen(false);
    await logout();
  };

  // Hide header on login page or when logging out
  if (isLoggingOut || location === '/login' || location === getLoginUrl()) {
    return null;
  }

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Text */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition">
            {logoConfig?.url && logoConfig.url !== "" && logoConfig.url !== "/logo.png" ? (
              <img 
                src={logoConfig.url} 
                alt="Logo" 
                style={{ height: `${logoConfig.sizeNavbar || 40}px` }}
                className="object-contain"
              />
            ) : (
              <img src="/assets/imporkam-logo.png" alt="IMPORKAM" className="h-8 w-8 sm:h-10 sm:w-10" />
            )}
            {logoConfig?.loginText && (
              <span
                className="font-semibold truncate max-w-[200px] md:max-w-[300px]"
                style={{
                  color: logoConfig.loginTextColor || "#374151",
                  fontSize: `${(logoConfig.loginTextSize || 18) * 0.85}px`,
                  fontWeight: logoConfig.loginTextWeight || "600",
                }}
              >
                {logoConfig.loginText}
              </span>
            )}
          </Link>

          {/* Mobile Cart Icon - Only visible on mobile */}
          {isAuthenticated && (
            <Link href="/cart" className="md:hidden relative">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {user?.role === "vendedor" ? (
                  // Vendedor: Botón de volver al menú principal + información del pedido
                  <div className="flex items-center gap-4">
                    <Link href="/vendedor?reset=true">
                      <Button variant="outline" size="icon" className="text-green-600 border-green-600 hover:bg-green-50" title="Volver al Menú Principal">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    </Link>
                    <div className="flex items-center gap-4 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                      <div className="text-sm">
                        <p className="text-xs text-gray-600">Líneas de pedido</p>
                        <p className="font-bold text-green-700">{cartItemsCount}</p>
                      </div>
                      <div className="h-8 w-px bg-green-300"></div>
                      <div className="text-sm">
                        <p className="text-xs text-gray-600">Monto total</p>
                        <p className="font-bold text-green-700">
                          ${(cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Link href="/cart">
                      <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" title="Ver Carrito y Enviar Pedido">
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Ver Carrito
                      </Button>
                    </Link>
                  </div>
                ) : (
                  // Otros roles: Navegación normal
                  <>
                    <Link href="/products" className="text-sm hover:text-primary transition">
                      Productos
                    </Link>
                    <Link href="/orders" className="text-sm hover:text-primary transition">
                      Mis Pedidos
                    </Link>
                    {(user?.role === "administrador" || user?.role === "operador") && (
                      <Link href="/admin" className="text-sm hover:text-primary transition font-medium text-blue-600">
                        Panel Admin
                      </Link>
                    )}
                  </>
                )}
                {user?.role !== "vendedor" && (
                  // Otros roles: Mostrar carrito, nombre y cerrar sesión
                  <div className="flex items-center gap-2">
                    <Link href="/cart" className="relative">
                      <Button variant="ghost" size="icon">
                        <ShoppingCart className="h-5 w-5" />
                        {cartItemsCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {cartItemsCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                    <div className="text-sm">
                      <p className="font-medium">{user?.name || "Usuario"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="ml-2"
                      title="Cerrar Sesión"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Button asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-border pt-4 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition block py-2">
                  Productos
                </Link>
                <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition block py-2">
                  Mis Pedidos
                </Link>
                <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition block py-2 flex items-center justify-between">
                  <span>Carrito de Compras</span>
                  {cartItemsCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
                {user?.role === "vendedor" && (
                  <Link href="/vendedor" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition block py-2 font-medium text-green-600">
                    Mi Dashboard
                  </Link>
                )}
                {(user?.role === "administrador" || user?.role === "operador") && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition block py-2 font-medium text-blue-600">
                    Panel Admin
                  </Link>
                )}
                <div className="text-sm py-2">
                  <p className="font-medium">{user?.name || "Usuario"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>Iniciar Sesión</a>
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

