import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductVariantsModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

interface VariantQuantity {
  [variantId: string]: number;
}

interface VariantCustomFields {
  [variantId: string]: {
    customText?: string;
    customSelect?: string;
  };
}

export default function ProductVariantsModal({
  product,
  isOpen,
  onClose,
}: ProductVariantsModalProps) {
  const { user } = useAuth();
  const [quantities, setQuantities] = useState<VariantQuantity>({});
  const [customFields, setCustomFields] = useState<VariantCustomFields>({});
  const [isAdding, setIsAdding] = useState(false);
  
  // Función para agregar timestamp a la URL de la imagen para evitar caché
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return "";
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${Date.now()}`;
  };
  
  const isVendor = user?.role === "vendedor";

  // Function to get price based on user's price type
  const getVariantPrice = (variant: any) => {
    const priceType = user?.priceType || 'ciudad';
    
    // Use variant's specific prices if available
    if (priceType === 'interior' && variant.precioInterior) {
      return parseFloat(variant.precioInterior);
    }
    if (priceType === 'especial' && variant.precioEspecial) {
      return parseFloat(variant.precioEspecial);
    }
    if (priceType === 'ciudad' && variant.precioCiudad) {
      return parseFloat(variant.precioCiudad);
    }
    
    // Fallback to basePrice
    return parseFloat(variant.basePrice || product.basePrice);
  };

  // Fetch variants for this product
  const { data: variants, isLoading } = trpc.products.getVariants.useQuery(
    { productId: product.id },
    { enabled: isOpen }
  );

  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.addItem.useMutation({
    onSuccess: () => {
      utils.cart.list.invalidate();
    },
  });

  // Calculate summary
  const summary = useMemo(() => {
    if (!variants) return { items: [], totalItems: 0, subtotal: 0 };

    const items = variants
      .filter((v) => quantities[v.id] > 0)
      .map((v) => ({
        id: v.id,
        name: `${v.variantType}: ${v.variantValue}`,
        quantity: quantities[v.id],
        price: getVariantPrice(v),
      }));

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    return { items, totalItems, subtotal };
  }, [quantities, variants, product, user]);

  const handleIncrease = (variantId: string, maxStock: number) => {
    setQuantities((prev) => ({
      ...prev,
      [variantId]: Math.min((prev[variantId] || 0) + 1, maxStock),
    }));
  };

  const handleDecrease = (variantId: string) => {
    setQuantities((prev) => {
      const newQty = Math.max((prev[variantId] || 0) - 1, 0);
      if (newQty === 0) {
        const { [variantId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [variantId]: newQty,
      };
    });
  };

  const handleQuantityChange = (
    variantId: string,
    value: string,
    maxStock: number
  ) => {
    const numValue = parseInt(value) || 0;
    const validValue = Math.max(0, Math.min(numValue, maxStock));

    if (validValue === 0) {
      const { [variantId]: _, ...rest } = quantities;
      setQuantities(rest);
    } else {
      setQuantities((prev) => ({
        ...prev,
        [variantId]: validValue,
      }));
    }
  };

  const handleAddToCart = async () => {
    if (summary.totalItems === 0) {
      toast.error("Seleccione al menos una variante");
      return;
    }

    setIsAdding(true);
    try {
      // Add each variant to cart
      for (const item of summary.items) {
        const fields = customFields[item.id] || {};
        await addToCartMutation.mutateAsync({
          productId: item.id,
          quantity: item.quantity,
          customText: fields.customText,
          customSelect: fields.customSelect,
        });
      }

      // Invalidate cart query to refresh
      await utils.cart.list.invalidate();

      toast.success(
        `${summary.totalItems} producto(s) agregado(s) al carrito`
      );

      // Reset and close
      setQuantities({});
      onClose();
    } catch (error: any) {
      toast.error(getErrorMessage(error) || "Error al agregar al carrito");
    } finally {
      setIsAdding(false);
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-red-600";
    if (stock <= 10) return "text-yellow-600";
    return "text-green-600";
  };

  const getStockText = (stock: number) => {
    if (stock === 0) return "Agotado";
    return `${stock} disponibles`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl">{product.name}</DialogTitle>
          <div className="text-sm text-gray-600">
            <p>
              SKU: {product.sku} | Categoría: {product.category}
            </p>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            Cargando variantes...
          </div>
        ) : !variants || variants.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No hay variantes disponibles
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Scrollable Variants Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {/* Mobile: Compact Horizontal Rows */}
              <div className="space-y-2 md:hidden">
                {variants.map((variant) => {
                  const quantity = quantities[variant.id] || 0;
                  const isSelected = quantity > 0;
                  const isOutOfStock = variant.stock === 0;

                  return (
                    <div
                      key={variant.id}
                      className={`
                        flex items-center gap-2 p-2 border rounded
                        ${isSelected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"}
                        ${isOutOfStock ? "opacity-50" : ""}
                        transition-colors
                      `}
                    >
                      {/* Photo - Small */}
                      <img
                        src={getImageUrl(variant.image || product.image) || "/placeholder.png"}
                        alt={variant.variantValue}
                        className="w-12 h-12 object-cover rounded flex-shrink-0"
                      />

                      {/* Info Column */}
                      <div className="flex-1 min-w-0">
                        {/* Nombre/Tamaño */}
                        <p className="font-semibold text-gray-900 text-xs truncate">
                          {variant.variantValue}
                        </p>
                        
                        {/* Precio */}
                        <p className="font-bold text-blue-600 text-sm">
                          ${getVariantPrice(variant).toFixed(2)}
                        </p>
                        
                        {/* Stock */}
                        <p className={`text-[10px] font-medium ${getStockColor(variant.stock)}`}>
                          {getStockText(variant.stock)}
                        </p>
                      </div>

                      {/* Controls Column */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {/* Custom Fields for Vendors */}
                        {isVendor && (
                          <div className="flex gap-1">
                            <Input
                              type="text"
                              maxLength={8}
                              value={customFields[variant.id]?.customText || ""}
                              onChange={(e) => setCustomFields(prev => ({
                                ...prev,
                                [variant.id]: { ...prev[variant.id], customText: e.target.value }
                              }))}
                              placeholder="Texto"
                              className="h-6 text-[10px] w-16 px-1"
                            />
                            <Select
                              value={customFields[variant.id]?.customSelect || ""}
                              onValueChange={(value) => setCustomFields(prev => ({
                                ...prev,
                                [variant.id]: { ...prev[variant.id], customSelect: value }
                              }))}
                            >
                              <SelectTrigger className="h-6 text-[10px] w-16 px-1 [&>span]:w-full [&>span]:text-left">
                                <SelectValue placeholder="Sel" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Opción 1">Op 1</SelectItem>
                                <SelectItem value="Opción 2">Op 2</SelectItem>
                                <SelectItem value="Opción 3">Op 3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Cantidad - Compact */}
                        <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecrease(variant.id)}
                          disabled={isOutOfStock || quantity === 0}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <input
                          type="number"
                          min="0"
                          max={variant.stock}
                          value={quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              variant.id,
                              e.target.value,
                              variant.stock
                            )
                          }
                          onClick={(e) => e.currentTarget.select()}
                          onFocus={(e) => e.target.select()}
                          disabled={isOutOfStock}
                          className="w-10 h-7 text-center border rounded px-1 disabled:bg-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleIncrease(variant.id, variant.stock)
                          }
                          disabled={
                            isOutOfStock || quantity >= variant.stock
                          }
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Horizontal Rows View */}
              <div className="hidden md:block space-y-2">
                {variants.map((variant) => {
                  const quantity = quantities[variant.id] || 0;
                  const isSelected = quantity > 0;
                  const isOutOfStock = variant.stock === 0;

                  return (
                    <div
                      key={variant.id}
                      className={`
                        flex items-center gap-3 p-2 border rounded-lg
                        ${isSelected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"}
                        ${isOutOfStock ? "opacity-50" : ""}
                        transition-colors
                      `}
                    >
                      {/* Photo */}
                      <img
                        src={getImageUrl(variant.image || product.image) || "/placeholder.png"}
                        alt={variant.variantValue}
                        className="w-14 h-14 object-cover rounded flex-shrink-0"
                      />

                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {variant.variantValue}
                        </p>
                        <p className="text-xs text-gray-500">
                          {variant.sku}
                        </p>
                        <p
                          className={`text-xs font-medium ${getStockColor(
                            variant.stock
                          )}`}
                        >
                          {getStockText(variant.stock)}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-blue-600 text-base">
                          ${getVariantPrice(variant).toFixed(2)}
                        </p>
                      </div>

                      {/* Controls Column */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {/* Custom Fields for Vendors */}
                        {isVendor && (
                          <div className="flex gap-1.5">
                            <Input
                              type="text"
                              maxLength={8}
                              value={customFields[variant.id]?.customText || ""}
                              onChange={(e) => setCustomFields(prev => ({
                                ...prev,
                                [variant.id]: { ...prev[variant.id], customText: e.target.value }
                              }))}
                              placeholder="Texto"
                              className="h-7 text-xs w-20 px-1.5"
                            />
                            <Select
                              value={customFields[variant.id]?.customSelect || ""}
                              onValueChange={(value) => setCustomFields(prev => ({
                                ...prev,
                                [variant.id]: { ...prev[variant.id], customSelect: value }
                              }))}
                            >
                              <SelectTrigger className="h-7 text-xs w-20 px-1.5 [&>span]:w-full [&>span]:text-left">
                                <SelectValue placeholder="Opción" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Opción 1">Opción 1</SelectItem>
                                <SelectItem value="Opción 2">Opción 2</SelectItem>
                                <SelectItem value="Opción 3">Opción 3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecrease(variant.id)}
                          disabled={isOutOfStock || quantity === 0}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <input
                          type="number"
                          min="0"
                          max={variant.stock}
                          value={quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              variant.id,
                              e.target.value,
                              variant.stock
                            )
                          }
                          onClick={(e) => e.currentTarget.select()}
                          onFocus={(e) => e.target.select()}
                          disabled={isOutOfStock}
                          className="w-16 h-8 text-center border rounded px-2 disabled:bg-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleIncrease(variant.id, variant.stock)
                          }
                          disabled={
                            isOutOfStock || quantity >= variant.stock
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fixed Summary and Buttons */}
            <div className="flex-shrink-0 space-y-4 border-t pt-4">
              {/* Summary */}
              {summary.totalItems > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 space-y-1">
                  <h4 className="font-semibold text-green-900 text-xs">
                    Resumen de Selección:
                  </h4>
                  <ul className="space-y-0.5 text-xs text-green-800">
                    {summary.items.map((item) => (
                      <li key={item.id} className="leading-tight">
                        • {item.name}: {item.quantity} unidad(es) - $
                        {(item.quantity * item.price).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={summary.totalItems === 0 || isAdding}
                  className="flex-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isAdding
                    ? "Agregando..."
                    : `Agregar al Carrito ${
                        summary.totalItems > 0 ? `(${summary.totalItems})` : ""
                      }`}
                </Button>

                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isAdding}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

