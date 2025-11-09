import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";

export default function ProductVariants() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  
  // Función para agregar timestamp a la URL de la imagen para evitar caché
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return "";
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${Date.now()}`;
  };

  const { data: product, isLoading: productLoading } = trpc.products.getById.useQuery(
    { id: productId || "" },
    { enabled: !!productId }
  );
  const { data: variants = [] } = trpc.products.getVariants.useQuery(
    { productId: productId || "" },
    { enabled: !!productId }
  );
  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.addItem.useMutation({
    onSuccess: () => {
      utils.cart.list.invalidate();
    },
  });

  // State for quantities per variant
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});

  // Group variants by type
  const variantsByType = useMemo(() => {
    const grouped: Record<string, typeof variants> = {};
    variants.forEach((variant) => {
      if (!grouped[variant.variantType]) {
        grouped[variant.variantType] = [];
      }
      grouped[variant.variantType].push(variant);
    });
    return grouped;
  }, [variants]);

  const handleQuantityChange = (variantId: string, quantity: number) => {
    setVariantQuantities((prev) => ({
      ...prev,
      [variantId]: Math.max(0, quantity),
    }));
  };

  const handleAddToCart = async (variantId: string) => {
    const quantity = variantQuantities[variantId] || 0;

    if (quantity === 0) {
      toast.error("Por favor selecciona una cantidad");
      return;
    }

    try {
      const variant = variants.find((v) => v.id === variantId);
      if (!variant) return;

      await addToCartMutation.mutateAsync({
        productId: productId || "",
        quantity,
        variantSelections: {
          [variant.variantType]: variant.variantValue,
        },
      });

      toast.success(`${quantity} unidad(es) agregada(s) al carrito`);
      setVariantQuantities((prev) => ({
        ...prev,
        [variantId]: 0,
      }));
    } catch (error: any) {
      toast.error(error.message || "Error al agregar al carrito");
    }
  };

  const handleAddAllToCart = async () => {
    const itemsToAdd = Object.entries(variantQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([variantId, qty]) => {
        const variant = variants.find((v) => v.id === variantId);
        return { variantId, quantity: qty, variant };
      });

    if (itemsToAdd.length === 0) {
      toast.error("Por favor selecciona al menos una variante con cantidad");
      return;
    }

    try {
      for (const item of itemsToAdd) {
        if (!item.variant) continue;
        await addToCartMutation.mutateAsync({
          productId: productId || "",
          quantity: item.quantity,
          variantSelections: {
            [item.variant.variantType]: item.variant.variantValue,
          },
        });
      }

      toast.success("Todos los productos agregados al carrito");
      setVariantQuantities({});
    } catch (error: any) {
      toast.error(error.message || "Error al agregar productos");
    }
  };

  if (productLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => setLocation("/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Catálogo
        </Button>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Producto no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => setLocation("/products")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al Catálogo
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Product Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="pt-6">
              {product.image && (
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-4">SKU: {product.sku}</p>
              <p className="text-3xl font-bold text-blue-600 mb-4">
                ${parseFloat(product.basePrice || "0").toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mb-4">{product.description}</p>
              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                {product.stock} unidades disponibles
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variants Selection */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Selecciona tus opciones</h2>

          {Object.entries(variantsByType).map(([variantType, typeVariants]) => (
            <div key={variantType} className="mb-8">
              <h3 className="text-lg font-semibold mb-4">{variantType}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeVariants.map((variant) => {
                  const quantity = variantQuantities[variant.id] || 0;
                  return (
                    <Card key={variant.id} className="overflow-hidden">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-semibold text-lg">{variant.variantValue}</p>
                            <p className="text-sm text-gray-600">SKU: {variant.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Stock</p>
                            <p className="font-semibold text-green-600">{variant.stock}</p>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Cantidad</label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(variant.id, quantity - 1)}
                              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) =>
                                handleQuantityChange(variant.id, parseInt(e.target.value) || 0)
                              }
                              className="flex-1 text-center border border-gray-300 rounded px-2 py-2"
                            />
                            <button
                              onClick={() => handleQuantityChange(variant.id, quantity + 1)}
                              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                          onClick={() => handleAddToCart(variant.id)}
                          disabled={quantity === 0 || addToCartMutation.isPending}
                          className="w-full"
                          size="sm"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Agregar {quantity > 0 ? `(${quantity})` : ""}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add All Button */}
          {Object.keys(variantsByType).length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <Button
                onClick={handleAddAllToCart}
                size="lg"
                className="w-full"
                disabled={Object.values(variantQuantities).every((q) => q === 0)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Agregar Todo al Carrito
              </Button>
            </div>
          )}

          {/* No Variants Message */}
          {Object.keys(variantsByType).length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">Este producto no tiene variantes disponibles</p>
                <Button
                  onClick={() => setLocation("/products")}
                  variant="outline"
                  className="mt-4"
                >
                  Volver al Catálogo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

