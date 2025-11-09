import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { Trash2, ArrowLeft, AlertCircle, ShoppingCart as CartIcon, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useSystemConfig } from "@/_core/hooks/useSystemConfig";
import { getErrorMessage } from "@/lib/errorUtils";

export default function Cart() {
  const [, setLocation] = useLocation();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  
  // Función para agregar timestamp a la URL de la imagen para evitar caché
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return "";
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${Date.now()}`;
  };

  const { data: cartItems, isLoading, refetch } = trpc.cart.list.useQuery();
  const { config, formatPrice, calculateTax } = useSystemConfig();
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();
  const checkoutMutation = trpc.orders.checkout.useMutation();

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await removeItemMutation.mutateAsync({ cartItemId });
      await refetch();
      toast.success("Producto removido del carrito");
    } catch (error: any) {
      toast.error(getErrorMessage(error) || "Error al remover producto");
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Si la cantidad es menor a 1, remover el item
      await handleRemoveItem(cartItemId);
      return;
    }
    
    try {
      await updateQuantityMutation.mutateAsync({ cartItemId, quantity: newQuantity });
      await refetch();
    } catch (error: any) {
      toast.error(getErrorMessage(error) || "Error al actualizar cantidad");
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      // Get selected client from localStorage (for vendors)
      const selectedClientId = localStorage.getItem('selectedClientId') || undefined;
      const result = await checkoutMutation.mutateAsync({ 
        customerNote,
        selectedClientId 
      });
      toast.success("Pedido creado exitosamente");
      // Clear selected client after successful order
      localStorage.removeItem('selectedClientId');
      setLocation(`/orders/${result.orderId}`);
    } catch (error: any) {
      toast.error(getErrorMessage(error) || "Error al crear el pedido");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Catálogo
          </Link>
        </Button>

        <div className="text-center space-y-6 py-12">
          <CartIcon className="h-16 w-16 mx-auto text-gray-400" />
          <div>
            <h2 className="text-2xl font-semibold">Tu carrito está vacío</h2>
            <p className="text-gray-600 mt-2">Agrega productos para comenzar a comprar</p>
          </div>
          <Button asChild size="lg">
            <Link href="/products">Explorar Productos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.pricePerUnit) * item.quantity,
    0
  );
  
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return (
    <div className="container mx-auto px-4 py-12">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Catálogo
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-2">
          <h1 className="text-3xl font-bold">Mi Carrito</h1>

          {cartItems.map((item) => (
            <Card key={item.id} className="py-2">
              <CardContent className="p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  {item.product?.image && (
<div className="flex-shrink-0">
	                      <img
	                        src={getImageUrl(item.product.image)}
	                        alt={item.product.name}
	                        className="w-20 h-20 object-cover rounded"
	                      />
	                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
<div className="flex-1 min-w-0 flex flex-col justify-between">
	                    {/* Fila 1: Nombre/Descripción */}
	                    <div className="flex justify-between items-start">
	                      <div className="flex-1 min-w-0">
	                        <h3 className="font-semibold text-sm">{item.product?.name}</h3>
	                        <p className="text-xs text-gray-600">SKU: {item.product?.sku}</p>
	                      </div>
	                      {/* Botón de eliminar visible en móvil (aquí) y desktop (abajo) */}
	                      <Button
	                        variant="ghost"
	                        size="sm"
	                        onClick={() => handleRemoveItem(item.id)}
	                        disabled={removeItemMutation.isPending}
	                        className="h-8 w-8 p-0 flex-shrink-0 sm:hidden"
	                      >
	                        <Trash2 className="h-3 w-3 text-red-600" />
	                      </Button>
	                    </div>
	
	                    {/* Fila 2: Precio, Cantidad, Total y Botón de eliminar (Desktop) */}
	                    <div className="flex justify-between items-center gap-2 text-xs pt-2">
	                      {/* Precio */}
	                      <div className="text-left">
	                        <p className="text-gray-600">Precio</p>
	                        <p className="font-semibold">{formatPrice(item.pricePerUnit)}</p>
	                      </div>
	
	                      {/* Cantidad (Solo Input) */}
	                      <div className="flex flex-col items-center gap-1">
	                        <p className="text-gray-600 text-xs">Cant.</p>
	                        <input
	                          type="number"
	                          min="1"
	                          value={item.quantity}
	                          onClick={(e) => e.currentTarget.select()}
	                          onFocus={(e) => e.target.select()}
	                          onChange={(e) => {
	                            const newQty = parseInt(e.target.value);
	                            if (!isNaN(newQty) && newQty >= 0) {
	                              handleUpdateQuantity(item.id, newQty);
	                            }
	                          }}
	                          onBlur={(e) => {
	                            // Si el campo está vacío o es 0, restaurar a 1
	                            if (!e.target.value || parseInt(e.target.value) === 0) {
	                              handleUpdateQuantity(item.id, 1);
	                            }
	                          }}
	                          disabled={updateQuantityMutation.isPending}
	                          className="font-semibold text-sm w-12 text-center border border-gray-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
	                        />
	                      </div>
	
	                      {/* Total */}
	                      <div className="text-right min-w-[60px]">
	                        <p className="text-gray-600">Total</p>
	                        <p className="font-semibold">{formatPrice(parseFloat(item.pricePerUnit) * item.quantity)}</p>
	                      </div>
	                      <Button
	                        variant="ghost"
	                        size="sm"
	                        onClick={() => handleRemoveItem(item.id)}
	                        disabled={removeItemMutation.isPending}
	                        className="h-8 w-8 p-0 flex-shrink-0 hidden sm:block"
	                      >
	                        <Trash2 className="h-3 w-3 text-red-600" />
	                      </Button>
	                    </div>
	                  </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
              <CardDescription>{cartItems.length} producto(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 border-b pb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Impuesto ({config.taxRate}%):</span>
                  <span className="font-semibold">{formatPrice(tax)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">{formatPrice(total)}</span>
              </div>

              {/* Customer Note */}
              <div className="space-y-2">
                <label htmlFor="customerNote" className="text-sm font-medium text-gray-700">
                  Mensaje o nota (opcional)
                </label>
                <textarea
                  id="customerNote"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Ej: Por favor entregar antes de las 3pm, dejar en recepción, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 text-right">
                  {customerNote.length}/500 caracteres
                </p>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut || checkoutMutation.isPending}
                size="lg"
                className="w-full"
              >
                {isCheckingOut ? "Enviando..." : "ENVIAR PEDIDO"}
              </Button>

<Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white uppercase font-semibold">
	                <Link href="/products">SEGUIR COMPRANDO</Link>
	              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

