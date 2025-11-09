import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getErrorMessage } from "@/lib/errorUtils";
import ProductVariantsModal from "@/components/ProductVariantsModal";
import { useSystemConfig } from "@/_core/hooks/useSystemConfig";
import ProductCard from "@/components/ProductCard";

export default function Products() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const { formatPrice } = useSystemConfig();
  const [headerHeight, setHeaderHeight] = useState(64); // Default height

  // Calculate header height on mount and resize
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // State for infinite scroll
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get selected client ID from localStorage (for vendors)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.role === 'vendedor') {
      const clientId = localStorage.getItem('selectedClientId');
      setSelectedClientId(clientId);
    }
  }, [user]);
  
  // Reset products when selected client changes
  useEffect(() => {
    if (selectedClientId) {
      setAllProducts([]);
      setCursor(0);
      setHasMore(true);
    }
  }, [selectedClientId]);

  // Fetch products with role-based pricing (paginated)
  const { data, isLoading, isFetching, refetch } = trpc.products.listWithPricing.useQuery(
    { 
      cursor, 
      limit: 20,
      clientId: selectedClientId || undefined 
    },
    { enabled: hasMore }
  );

  // Update products when new data arrives
  useEffect(() => {
    if (data?.products) {
      setAllProducts((prev) => {
        // Avoid duplicates
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = data.products.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
      setHasMore(data.hasMore);
    }
  }, [data]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (isFetching || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          setCursor((prev) => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [isFetching, hasMore]);

  const products = allProducts;

  // Add to cart mutation
  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.addItem.useMutation({
    onSuccess: () => {
      // Invalidar cache del carrito para actualizar el contador en el header
      utils.cart.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
      console.error("Error adding to cart:", error);
    },
  });

  const handleAddToCart = (productId: string) => {
    const qty = quantities[productId] || 1;
    if (qty > 0) {
      addToCartMutation.mutate({
        productId,
        quantity: qty,
        variantSelections: {},
      });
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter((c) => c !== null));
    return Array.from(cats).sort() as string[];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = allProducts;

    // Filter by search and category
    products = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || product.category === selectedCategory || selectedCategory === "";

      return matchesSearch && matchesCategory;
    });

    // Sort by displayOrder (ascending), then by name
    products.sort((a: any, b: any) => {
      const orderA = a.displayOrder ?? 999999;
      const orderB = b.displayOrder ?? 999999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });

    return products;
  }, [allProducts, searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Search Bar and Mobile Category - Sticky */}
        <div 
          className="sticky z-40 bg-white border-b border-gray-200 -mx-2 sm:-mx-4 px-2 sm:px-4 shadow-sm"
          style={{ top: `${headerHeight}px`, margin: '2px', paddingTop: '8px', paddingBottom: '8px' }}
        >
          {/* Desktop: Solo búsqueda */}
          <div className="hidden lg:block relative">
            <Search className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Mobile: Búsqueda y categorías lado a lado */}
          <div className="lg:hidden flex gap-2">
            {/* Search field - 65% width */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            
            {/* Category dropdown - 35% width */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-32 px-2 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category} value={category || ""}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Sidebar - Categories - Sticky */}
          <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
            <div className="sticky top-32">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Categorías</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === ""
                      ? "bg-blue-500 text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Todas las categorías
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category || "")}
                    className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? "bg-blue-500 text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </CardContent>
            </Card>
            </div>
          </aside>



          {/* Main Content - Products Grid */}
          <main className="flex-1 w-full">
            {filteredProducts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500 text-lg">
                    No se encontraron productos que coincidan con tu búsqueda.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(productId, quantity, customText, customSelect) => {
                      addToCartMutation.mutate(
                        {
                          productId,
                          quantity,
                          variantSelections: {},
                          customText,
                          customSelect,
                        },
                        {
                          onSuccess: () => {
                            // Producto agregado exitosamente
                          },
                          onError: (error: any) => {
                            toast.error(getErrorMessage(error));
                            console.error("Error adding to cart:", error);
                          },
                        }
                      );
                    }}
                    onViewVariants={(product) => {
                      setSelectedProduct(product);
                      setIsModalOpen(true);
                    }}
                    isAddingToCart={addToCartMutation.isPending}
                  />
                ))}
              </div>
            )}
            
            {/* Loading indicator for infinite scroll */}
            {isFetching && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-500 mt-2">Cargando más productos...</p>
              </div>
            )}
            
            {/* Observer target for infinite scroll */}
            {hasMore && !isFetching && (
              <div ref={loadMoreRef} className="h-20" />
            )}
            
            {/* End of list message */}
            {!hasMore && products.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Has llegado al final del catálogo</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Product Variants Modal */}
      {selectedProduct && (
        <ProductVariantsModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

