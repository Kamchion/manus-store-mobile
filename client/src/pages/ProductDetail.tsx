import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRoute, Link } from "wouter";
import { ArrowLeft, ShoppingCart, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getErrorMessage } from "@/lib/errorUtils";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const { user } = useAuth();
  const productId = params?.id || "";
  const [quantity, setQuantity] = useState<number>(1);
  
  // Función para agregar timestamp a la URL de la imagen para evitar caché
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return "";
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${Date.now()}`;
  };

  const { data: product, isLoading } = trpc.products.getWithPricing.useQuery(
    { id: productId },
    { enabled: !!productId }
  );
  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.addItem.useMutation({
    onSuccess: () => {
      utils.cart.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
          <h2 className="text-2xl font-semibold">Producto no encontrado</h2>
          <Button asChild variant="outline">
            <Link href="/products">Volver al Catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (quantity < product.minQuantity) {
      toast.error(`La cantidad mínima es ${product.minQuantity} unidades`);
      return;
    }

    if (quantity > product.stock) {
      toast.error("No hay suficiente stock disponible");
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity,
      });

      toast.success(`${quantity} unidad(es) agregada(s) al carrito`);
      setQuantity(1);
    } catch (error: any) {
      toast.error(getErrorMessage(error) || "Error al agregar al carrito");
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, value));
  };

  const isOutOfStock = product.stock <= 0;
  const isQuantityValid = quantity >= product.minQuantity && quantity <= product.stock;

  return (
    <div className="container mx-auto px-4 py-12">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Catálogo
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div>
          {product.image && (
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          )}
          {!product.image && (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Sin imagen disponible</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600 mt-2">SKU: {product.sku}</p>
            {product.category && (
              <p className="text-sm text-gray-500 mt-1">Categoría: {product.category}</p>
            )}
          </div>

          <p className="text-gray-700 text-lg">{product.description}</p>

          {/* Pricing Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Información de Precios</CardTitle>
              <CardDescription>Para tu rol: <span className="font-semibold capitalize text-gray-900">{user?.role}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Precio Unitario:</span>
                <span className="text-3xl font-bold text-blue-600">
                  ${parseFloat(product.rolePrice).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cantidad Mínima:</span>
                <span className="text-lg font-semibold text-orange-600">
                  {product.minQuantity} unidades
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Stock Disponible:</span>
                <span className={`text-lg font-semibold ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
                  {product.stock} unidades
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Add to Cart Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agregar al Carrito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Cantidad</label>
                <Input
                  type="number"
                  min={product.minQuantity}
                  max={product.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  disabled={isOutOfStock}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">
                  Mínimo: {product.minQuantity} | Máximo: {product.stock}
                </p>
              </div>

              {quantity >= product.minQuantity && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">
                    <strong>Subtotal:</strong> ${(parseFloat(product.rolePrice) * quantity).toFixed(2)}
                  </p>
                </div>
              )}

              {quantity < product.minQuantity && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    Necesitas al menos {product.minQuantity} unidades para este producto
                  </p>
                </div>
              )}

              <Button
                onClick={handleAddToCart}
                disabled={!isQuantityValid || isOutOfStock || addToCartMutation.isPending}
                size="lg"
                className="w-full"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isOutOfStock ? "Sin Stock" : "Agregar al Carrito"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

