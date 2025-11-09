import { useState } from "react";
import { trpc } from "@/lib/trpc";
import UsersAdmin from "./admin/Users";
import ProductImportNew from "@/components/ProductImportNew";
import ClientImport from "@/components/ClientImport";
import ConfigurationTab from "./admin/ConfigurationTab";
import { OrderDetailModal } from "@/components/OrderDetailModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Download, Settings, Tag, Upload, ShoppingCart, FileText, Trash2, 
  FileSpreadsheet, Edit, Plus, Image as ImageIcon, Package, Search 
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"products" | "promotions" | "orders" | "users" | "config">("products");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  // Check if user has access to admin panel
  const hasAdminAccess = user?.role === "administrador" || user?.role === "operador" || user?.role === "vendedor";
  
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Solo los administradores pueden acceder a este panel.</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona productos, precios, promociones y pedidos</p>
        </div>

        {/* Tabs */}
        <div className="sticky top-16 z-10 bg-gradient-to-br from-blue-50 to-indigo-100 pb-4 mb-4 -mx-6 px-6">
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4">
          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => setActiveTab("products")}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Productos
          </Button>

          <Button
            variant={activeTab === "promotions" ? "default" : "outline"}
            onClick={() => setActiveTab("promotions")}
            className="flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            Promociones
          </Button>
          <Button
            variant={activeTab === "orders" ? "default" : "outline"}
            onClick={() => setActiveTab("orders")}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Pedidos
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Usuarios
          </Button>
          {user?.role === "administrador" && (
            <Button
              variant={activeTab === "config" ? "default" : "outline"}
              onClick={() => setActiveTab("config")}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Configuración
            </Button>
          )}
          </div>
        </div>

        {/* Content */}
        {activeTab === "products" && <ProductsTab />}

        {activeTab === "promotions" && <PromotionsTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "users" && <UsersAdmin />}
        {activeTab === "config" && <ConfigurationTab />}
      </div>
    </div>
  );
}

/**
 * Comprehensive Products Management Tab
 */
function ProductsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  
  // Función para agregar timestamp a la URL de la imagen para evitar caché
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return "";
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${Date.now()}`;
  };
  
  const productsQuery = trpc.admin.listAllProducts.useQuery();
  const deleteProductMutation = trpc.admin.deleteProduct.useMutation();
  const utils = trpc.useUtils();

  const products = productsQuery.data || [];
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Products sheet
    const productsData = products.map((p) => ({
      "ID Producto": p.id,
      SKU: p.sku,
      Nombre: p.name,
      Categoría: p.category || "",
      Descripción: p.description || "",
      "Precio Base": p.basePrice,
      Stock: p.stock,
      Activo: p.isActive ? "Sí" : "No",
    }));
    const wsProducts = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Productos");

    XLSX.writeFile(wb, `productos_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleImport = async (file: File) => {
    // Import logic here
    toast.info("Función de importación en desarrollo");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gestión de Productos</CardTitle>
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                </DialogHeader>
                <ProductForm 
                  onSuccess={() => {
                    setShowAddDialog(false);
                    utils.admin.listAllProducts.invalidate();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => cat && (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        {productsQuery.isLoading ? (
          <p className="text-gray-500">Cargando productos...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-gray-500">No hay productos que coincidan con los filtros</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="text-left p-3 font-semibold">Imagen</th>
                  <th className="text-left p-3 font-semibold">SKU</th>
                  <th className="text-left p-3 font-semibold">Nombre</th>
                  <th className="text-left p-3 font-semibold">Línea 1</th>
                  <th className="text-center p-3 font-semibold">Cant. Mín</th>
                  <th className="text-center p-3 font-semibold">Und/Caja</th>
                  <th className="text-right p-3 font-semibold">Precio Ciudad</th>
                  <th className="text-right p-3 font-semibold">Precio Interior</th>
                  <th className="text-right p-3 font-semibold">Precio Especial</th>
                  <th className="text-center p-3 font-semibold">Stock</th>
                  <th className="text-center p-3 font-semibold">Estado</th>
                  <th className="text-center p-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {product.image ? (
                        <img 
                          src={getImageUrl(product.image)} 
                          alt={product.name}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-sm">{product.sku}</td>
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3 text-sm">{product.line1Text || "-"}</td>
                    <td className="p-3 text-center">{product.minQuantity || "-"}</td>
                    <td className="p-3 text-center">{product.unitsPerBox || "-"}</td>
                    <td className="p-3 text-right font-semibold">${product.priceCity || product.basePrice}</td>
                    <td className="p-3 text-right font-semibold">${product.priceInterior || product.basePrice}</td>
                    <td className="p-3 text-right font-semibold">${product.priceSpecial || product.basePrice}</td>
                    <td className="p-3 text-center">{product.stock}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        product.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Producto</DialogTitle>
                            </DialogHeader>
                            <ProductForm 
                              product={editingProduct}
                              onSuccess={() => {
                                setEditingProduct(null);
                                setShowEditDialog(false);
                                utils.admin.listAllProducts.invalidate();
                              }}
                              onCancel={() => {
                                setEditingProduct(null);
                                setShowEditDialog(false);
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: "¿Eliminar producto?",
                              description: "Esta acción eliminará el producto y todas sus variantes, precios y promociones asociadas. Esta acción no se puede deshacer.",
                              onConfirm: async () => {
                                try {
                                  await deleteProductMutation.mutateAsync({ productId: product.id });
                                  utils.admin.listAllProducts.invalidate();
                                  toast.success("Producto eliminado correctamente");
                                } catch (error: any) {
                                  toast.error(`Error al eliminar: ${error.message}`);
                                }
                              }
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Card>
  );
}

/**
 * Product Form Component for Add/Edit
 */
function ProductForm({ product, onSuccess, onCancel }: { product?: any; onSuccess: () => void; onCancel?: () => void }) {
  const [formData, setFormData] = useState({
    sku: product?.sku || "",
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    image: product?.image || "",
    basePrice: product?.basePrice || "",
    stock: product?.stock || 0,
    isActive: product?.isActive ? Boolean(product.isActive) : true,
    parentProductId: product?.parentProductId || "",
    // Nuevos campos
    minQuantity: product?.minQuantity || 1,
    unitsPerBox: product?.unitsPerBox || 0,
    line1Text: product?.line1Text || "",
    line2Text: product?.line2Text || "",
    // Precios diferenciados
    precioCiudad: product?.priceCity || "",
    precioInterior: product?.priceInterior || "",
    precioEspecial: product?.priceSpecial || "",
  });

  const [variants, setVariants] = useState<Array<{type: string; value: string; sku: string; stock: number}>>([]);
  const [pricing, setPricing] = useState<Array<{role: string; price: string; minQty: number}>>([]);
  const [promotions, setPromotions] = useState<Array<{name: string; discountType: string; discountValue: string}>>([]);

  const productsQuery = trpc.admin.listAllProducts.useQuery();
  const upsertMutation = trpc.admin.upsertProduct.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await upsertMutation.mutateAsync({
        id: product?.id,
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        image: formData.image,
        basePrice: formData.basePrice,
        stock: formData.stock,
        isActive: Boolean(formData.isActive),
        minQuantity: formData.minQuantity,
        unitsPerBox: formData.unitsPerBox,
        line1Text: formData.line1Text,
        line2Text: formData.line2Text,
        precioCiudad: formData.precioCiudad,
        precioInterior: formData.precioInterior,
        precioEspecial: formData.precioEspecial,
        variants: variants.length > 0 ? variants : undefined,
        pricing: pricing.length > 0 ? pricing : undefined,
        promotions: promotions.length > 0 ? promotions : undefined,
      });

      utils.admin.listAllProducts.invalidate();
      toast.success(product ? "Producto actualizado correctamente" : "Producto creado correctamente");
      onSuccess();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Información Básica</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              value={formData.sku ?? ""}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name ?? ""}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description ?? ""}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            value={formData.category ?? ""}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          />
        </div>

        {/* Image Upload Section */}
        <div>
          <Label>Imagen del Producto</Label>
          <div className="mt-2 space-y-3">
            {/* Preview */}
            {formData.image && (
              <div className="relative inline-block">
                <img 
                  src={formData.image} 
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={() => setFormData({...formData, image: ""})}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {/* Upload Button */}
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Upload image
                  const formDataUpload = new FormData();
                  formDataUpload.append('image', file);
                  formDataUpload.append('sku', formData.sku || 'temp');
                  
                  try {
                    const response = await fetch('/api/upload/product-image', {
                      method: 'POST',
                      body: formDataUpload,
                    });
                    
                    if (!response.ok) throw new Error('Error al subir imagen');
                    
                    const data = await response.json();
                    setFormData({...formData, image: data.imagePath});
                  } catch (error) {
                    toast.error('Error al subir la imagen');
                  }
                }}
                className="max-w-xs"
              />
              <span className="text-sm text-gray-500 self-center">
                JPG, PNG, WebP (máx. 5MB)
              </span>
            </div>
            
            {/* URL Input (alternative) */}
            <div>
              <Label htmlFor="imageUrl" className="text-sm text-gray-600">O ingresa una URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.image ?? ""}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Precios Diferenciados */}
        <div>
          <h4 className="font-semibold text-md mb-3">Precios</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="precioCiudad">Precio Ciudad *</Label>
              <Input
                id="precioCiudad"
                type="number"
                step="0.01"
                value={formData.precioCiudad ?? ""}
                onChange={(e) => setFormData({...formData, precioCiudad: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="precioInterior">Precio Interior *</Label>
              <Input
                id="precioInterior"
                type="number"
                step="0.01"
                value={formData.precioInterior ?? ""}
                onChange={(e) => setFormData({...formData, precioInterior: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="precioEspecial">Precio Especial *</Label>
              <Input
                id="precioEspecial"
                type="number"
                step="0.01"
                value={formData.precioEspecial ?? ""}
                onChange={(e) => setFormData({...formData, precioEspecial: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        {/* Campos Adicionales */}
        <div>
          <h4 className="font-semibold text-md mb-3">Información Adicional</h4>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock ?? 0}
                onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="minQuantity">Cantidad Mínima</Label>
              <Input
                id="minQuantity"
                type="number"
                value={formData.minQuantity ?? 1}
                onChange={(e) => setFormData({...formData, minQuantity: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="unitsPerBox">Cantidad por Caja</Label>
              <Input
                id="unitsPerBox"
                type="number"
                value={formData.unitsPerBox ?? 0}
                onChange={(e) => setFormData({...formData, unitsPerBox: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="isActive">Estado</Label>
              <select
                id="isActive"
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) => setFormData({...formData, isActive: e.target.value === "active"})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Líneas de Texto */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="line1Text">Línea 1</Label>
            <Input
              id="line1Text"
              value={formData.line1Text ?? ""}
              onChange={(e) => setFormData({...formData, line1Text: e.target.value})}
              placeholder="Texto adicional línea 1"
            />
          </div>
          <div>
            <Label htmlFor="line2Text">Línea 2</Label>
            <Input
              id="line2Text"
              value={formData.line2Text ?? ""}
              onChange={(e) => setFormData({...formData, line2Text: e.target.value})}
              placeholder="Texto adicional línea 2"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="parentProduct">Producto Padre (Opcional)</Label>
          <select
            id="parentProduct"
            value={formData.parentProductId || ""}
            onChange={(e) => setFormData({...formData, parentProductId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Ninguno (Producto independiente)</option>
            {productsQuery.data?.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona un producto padre si este es una variante o producto relacionado
          </p>
        </div>
      </div>

      {/* Variants Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Variantes</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVariants([...variants, {type: "", value: "", sku: "", stock: 0}])}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Variante
          </Button>
        </div>
        {variants.map((variant, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-2 items-end">
            <Input
              placeholder="Tipo (ej: Color)"
              value={variant.type ?? ""}
              onChange={(e) => {
                const newVariants = [...variants];
                newVariants[idx].type = e.target.value;
                setVariants(newVariants);
              }}
            />
            <Input
              placeholder="Valor (ej: Rojo)"
              value={variant.value ?? ""}
              onChange={(e) => {
                const newVariants = [...variants];
                newVariants[idx].value = e.target.value;
                setVariants(newVariants);
              }}
            />
            <Input
              placeholder="SKU Variante"
              value={variant.sku ?? ""}
              onChange={(e) => {
                const newVariants = [...variants];
                newVariants[idx].sku = e.target.value;
                setVariants(newVariants);
              }}
            />
            <Input
              type="number"
              placeholder="Stock"
              value={variant.stock ?? 0}
              onChange={(e) => {
                const newVariants = [...variants];
                newVariants[idx].stock = Number(e.target.value);
                setVariants(newVariants);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Pricing Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Precios por Tipo</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPricing([...pricing, {role: "ciudad", price: "", minQty: 1}])}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Precio
          </Button>
        </div>
        {pricing.map((price, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-2 items-end">
            <select
              value={price.role ?? "ciudad"}
              onChange={(e) => {
                const newPricing = [...pricing];
                newPricing[idx].role = e.target.value;
                setPricing(newPricing);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ciudad">Ciudad</option>
              <option value="interior">Interior</option>
              <option value="especial">Especial</option>
            </select>
            <Input
              type="number"
              step="0.01"
              placeholder="Precio"
              value={price.price ?? ""}
              onChange={(e) => {
                const newPricing = [...pricing];
                newPricing[idx].price = e.target.value;
                setPricing(newPricing);
              }}
            />
            <Input
              type="number"
              placeholder="Cant. Mínima"
              value={price.minQty ?? 1}
              onChange={(e) => {
                const newPricing = [...pricing];
                newPricing[idx].minQty = Number(e.target.value);
                setPricing(newPricing);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPricing(pricing.filter((_, i) => i !== idx))}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Promotions Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Promociones</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPromotions([...promotions, {name: "", discountType: "percentage", discountValue: ""}])}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Promoción
          </Button>
        </div>
        {promotions.map((promo, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-2 items-end">
            <Input
              placeholder="Nombre promoción"
              value={promo.name ?? ""}
              onChange={(e) => {
                const newPromos = [...promotions];
                newPromos[idx].name = e.target.value;
                setPromotions(newPromos);
              }}
            />
            <select
              value={promo.discountType ?? "percentage"}
              onChange={(e) => {
                const newPromos = [...promotions];
                newPromos[idx].discountType = e.target.value;
                setPromotions(newPromos);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto Fijo ($)</option>
            </select>
            <Input
              type="number"
              step="0.01"
              placeholder="Valor descuento"
              value={promo.discountValue ?? ""}
              onChange={(e) => {
                const newPromos = [...promotions];
                newPromos[idx].discountValue = e.target.value;
                setPromotions(newPromos);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPromotions(promotions.filter((_, i) => i !== idx))}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel || onSuccess}>
          Cancelar
        </Button>
        <Button type="submit">
          {product ? "Actualizar Producto" : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Pricing Management Tab
 */
function PricingTab() {
  const productsQuery = trpc.admin.listAllProducts.useQuery();
  const updatePricingMutation = trpc.admin.updatePricing.useMutation();

  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [role, setRole] = useState<"ciudad" | "interior" | "especial">("ciudad");
  const [price, setPrice] = useState("");
  const [minQuantity, setMinQuantity] = useState(1);

  const handleUpdatePricing = async () => {
    if (!selectedProduct || !price) return;

    try {
      await updatePricingMutation.mutateAsync({
        productId: selectedProduct,
        role,
        price,
        minQuantity,
      });

      toast.success("Precio actualizado correctamente");
      setPrice("");
      setMinQuantity(1);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Precios por Rol</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-gray-600">
            Configura precios específicos para cada rol de usuario. Los precios pueden variar según el tipo de cliente.
          </p>

          <div>
            <Label>Producto</Label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
            >
              <option value="">Selecciona un producto</option>
              {productsQuery.data?.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} - {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Rol</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
            >
              <option value="ciudad">Ciudad</option>
              <option value="interior">Interior</option>
              <option value="especial">Especial</option>
            </select>
          </div>

          <div>
            <Label>Precio</Label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Cantidad Mínima</Label>
            <Input
              type="number"
              value={minQuantity}
              onChange={(e) => setMinQuantity(Number(e.target.value))}
              min="1"
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleUpdatePricing}
            disabled={!selectedProduct || !price || updatePricingMutation.isPending}
            className="w-full"
          >
            {updatePricingMutation.isPending ? "Actualizando..." : "Actualizar Precio"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Promotions Management Tab
 * Supports 3 types: quantity_discount, buy_x_get_y, simple_discount
 */
function PromotionsTab() {
  const productsQuery = trpc.admin.listAllProducts.useQuery();
  const createPromotionMutation = trpc.promotions.upsert.useMutation();
  const utils = trpc.useUtils();

  // Common fields
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [promotionName, setPromotionName] = useState("");
  const [description, setDescription] = useState("");
  const [promotionType, setPromotionType] = useState<"quantity_discount" | "buy_x_get_y" | "simple_discount">("simple_discount");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isInfiniteDate, setIsInfiniteDate] = useState(false);

  // For simple_discount
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minQuantity, setMinQuantity] = useState("1");

  // For buy_x_get_y
  const [buyQuantity, setBuyQuantity] = useState("");
  const [getQuantity, setGetQuantity] = useState("");

  // For quantity_discount
  const [tiers, setTiers] = useState<Array<{ minQuantity: number; discountType: "percentage" | "fixed"; discountValue: string }>>([]);

  const handleCreatePromotion = async () => {
    if (!selectedProduct || !promotionName || !startDate || (!endDate && !isInfiniteDate)) {
      toast.error("Por favor completa los campos obligatorios: Producto, Nombre, Fecha de Inicio" + (!isInfiniteDate ? " y Fecha de Fin" : ""));
      return;
    }

    // Validate based on promotion type
    if (promotionType === "simple_discount") {
      if (!discountValue) {
        toast.error("Por favor ingresa el valor del descuento");
        return;
      }
    } else if (promotionType === "buy_x_get_y") {
      if (!buyQuantity || !getQuantity) {
        toast.error("Por favor completa Cantidad a Comprar y Cantidad de Regalo");
        return;
      }
    } else if (promotionType === "quantity_discount") {
      if (tiers.length === 0) {
        toast.error("Por favor agrega al menos un tier de descuento");
        return;
      }
    }

    try {
      await createPromotionMutation.mutateAsync({
        productId: selectedProduct,
        name: promotionName,
        description: description || null,
        promotionType,
        
        // Simple discount fields
        discountType: promotionType === "simple_discount" ? discountType : undefined,
        discountValue: promotionType === "simple_discount" ? discountValue : undefined,
        minQuantity: promotionType === "simple_discount" ? parseInt(minQuantity) : undefined,
        
        // Buy X Get Y fields
        buyQuantity: promotionType === "buy_x_get_y" ? parseInt(buyQuantity) : undefined,
        getQuantity: promotionType === "buy_x_get_y" ? parseInt(getQuantity) : undefined,
        
        // Quantity discount tiers
        tiers: promotionType === "quantity_discount" ? tiers : undefined,
        
        startDate: new Date(startDate),
        endDate: isInfiniteDate ? null : new Date(endDate),
      });

      toast.success("Promoción creada correctamente");
      
      // Reset form
      setPromotionName("");
      setDescription("");
      setDiscountValue("");
      setMinQuantity("1");
      setBuyQuantity("");
      setGetQuantity("");
      setTiers([]);
      setStartDate("");
      setEndDate("");
      
      utils.promotions.getAll.invalidate();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const addTier = () => {
    setTiers([...tiers, { minQuantity: 0, discountType: "percentage", discountValue: "" }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: string, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Promociones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Tipos de Promociones</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Descuento Escalonado</strong>: Descuentos que aumentan según cantidad (ej: 50pcs=10%, 100pcs=20%)</li>
              <li>• <strong>Compra X, Lleva Y</strong>: Regalo de unidades adicionales (ej: Compra 10, lleva 12)</li>
              <li>• <strong>Descuento Simple</strong>: Descuento tradicional con cantidad mínima</li>
            </ul>
          </div>

          {/* Producto */}
          <div>
            <Label>Producto *</Label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"
            >
              <option value="">Selecciona un producto</option>
              {productsQuery.data?.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} - {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre */}
          <div>
            <Label>Nombre de la Promoción *</Label>
            <Input
              type="text"
              value={promotionName}
              onChange={(e) => setPromotionName(e.target.value)}
              placeholder="Ej: Descuento de Verano"
              className="mt-2"
            />
          </div>

          {/* Descripción */}
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la promoción (opcional)"
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Tipo de Promoción */}
          <div>
            <Label>Tipo de Promoción *</Label>
            <select
              value={promotionType}
              onChange={(e) => setPromotionType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"
            >
              <option value="simple_discount">Descuento Simple</option>
              <option value="quantity_discount">Descuento por Cantidad Escalonado</option>
              <option value="buy_x_get_y">Compra X, Lleva Y</option>
            </select>
          </div>

          {/* Campos según tipo de promoción */}
          {promotionType === "simple_discount" && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Configuración de Descuento Simple</h3>
              
              <div>
                <Label>Cantidad Mínima</Label>
                <Input
                  type="number"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  placeholder="1"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Descuento</Label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>

                <div>
                  <Label>Valor del Descuento</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0.00"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {promotionType === "buy_x_get_y" && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Configuración de Compra X, Lleva Y</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad a Comprar (X)</Label>
                  <Input
                    type="number"
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(e.target.value)}
                    placeholder="10"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Cantidad que Lleva (Y)</Label>
                  <Input
                    type="number"
                    value={getQuantity}
                    onChange={(e) => setGetQuantity(e.target.value)}
                    placeholder="12"
                    className="mt-2"
                  />
                </div>
              </div>

              {buyQuantity && getQuantity && (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                  <strong>Vista previa:</strong> El cliente compra {buyQuantity} unidades y recibe {getQuantity} unidades
                  ({parseInt(getQuantity) - parseInt(buyQuantity)} gratis)
                </div>
              )}
            </div>
          )}

          {promotionType === "quantity_discount" && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Tiers de Descuento Escalonado</h3>
                <Button type="button" onClick={addTier} size="sm" variant="outline">
                  + Agregar Tier
                </Button>
              </div>

              {tiers.length === 0 && (
                <p className="text-sm text-gray-500 italic">No hay tiers configurados. Agrega al menos uno.</p>
              )}

              {tiers.map((tier, index) => (
                <div key={index} className="border border-gray-300 rounded p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Tier {index + 1}</span>
                    <Button
                      type="button"
                      onClick={() => removeTier(index)}
                      size="sm"
                      variant="destructive"
                    >
                      Eliminar
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Cantidad Mínima</Label>
                      <Input
                        type="number"
                        value={tier.minQuantity}
                        onChange={(e) => updateTier(index, "minQuantity", parseInt(e.target.value))}
                        placeholder="50"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <select
                        value={tier.discountType}
                        onChange={(e) => updateTier(index, "discountType", e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg mt-1 text-sm"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">$</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs">Descuento</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.discountValue}
                        onChange={(e) => updateTier(index, "discountValue", e.target.value)}
                        placeholder="10"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    {tier.minQuantity > 0 && tier.discountValue && (
                      <span>
                        Al comprar {tier.minQuantity}+ unidades → {tier.discountValue}{tier.discountType === "percentage" ? "%" : "$"} de descuento
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fechas */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha Inicio *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Fecha Fin {!isInfiniteDate && "*"}</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-2"
                  disabled={isInfiniteDate}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="infiniteDate"
                checked={isInfiniteDate}
                onChange={(e) => {
                  setIsInfiniteDate(e.target.checked);
                  if (e.target.checked) {
                    setEndDate("");
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <Label htmlFor="infiniteDate" className="cursor-pointer">
                Fecha de vencimiento infinita (sin fecha de fin)
              </Label>
            </div>
          </div>

          <Button
            onClick={handleCreatePromotion}
            disabled={createPromotionMutation.isPending}
            className="w-full"
          >
            {createPromotionMutation.isPending ? "Creando..." : "Crear Promoción"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Orders Management Tab
 */
function OrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const ordersQuery = trpc.admin.getAllOrders.useQuery();
  const updateOrderMutation = trpc.admin.updateOrderStatus.useMutation();
  const deleteOrderMutation = trpc.admin.deleteOrder.useMutation();
  const utils = trpc.useUtils();

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderMutation.mutateAsync({ 
        orderId, 
        status: newStatus as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" 
      });
      utils.admin.getAllOrders.invalidate();
      toast.success("Estado del pedido actualizado");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleDelete = (orderId: string) => {
    setConfirmDialog({
      open: true,
      title: "¿Eliminar pedido?",
      description: "Esta acción eliminará el pedido permanentemente. Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          await deleteOrderMutation.mutateAsync({ orderId });
          utils.admin.getAllOrders.invalidate();
          toast.success("Pedido eliminado correctamente");
        } catch (error: any) {
          toast.error(`Error: ${error.message}`);
        }
      }
    });
  };

  const exportPDFMutation = trpc.orders.exportPDF.useMutation({
    onSuccess: (result) => {
      // Convertir base64 a blob y descargar
      const byteCharacters = atob(result.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF descargado exitosamente');
    },
    onError: (error: any) => {
      console.error('Error exporting PDF:', error);
      toast.error(getErrorMessage(error));
    },
  });

  const handleExportPDF = (order: any) => {
    exportPDFMutation.mutate({ orderId: order.id });
  };

  const exportExcelMutation = trpc.orders.exportExcel.useMutation({
    onSuccess: (result) => {
      // Convert base64 to blob
      const byteCharacters = atob(result.excel);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel descargado correctamente');
    },
    onError: (error: any) => {
      console.error('Error exporting Excel:', error);
      toast.error(getErrorMessage(error));
    },
  });

  const handleExportExcel = (order: any) => {
    exportExcelMutation.mutate({ orderId: order.id });
  };

  if (ordersQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Cargando pedidos...</p>
        </CardContent>
      </Card>
    );
  }

  const orders = ordersQuery.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-gray-500">No hay pedidos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="text-left p-3 font-semibold">Fecha</th>
                  <th className="text-left p-3 font-semibold">Cliente</th>
                  <th className="text-left p-3 font-semibold">Código Cliente</th>
                  <th className="text-left p-3 font-semibold">Agente</th>
                  <th className="text-center p-3 font-semibold"># Líneas</th>
                  <th className="text-right p-3 font-semibold">Monto Total</th>
                  <th className="text-center p-3 font-semibold">Estado</th>
                  <th className="text-center p-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">
                      {new Date(order.createdAt).toLocaleDateString("es-ES")}
                      <br />
                      <span className="text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="p-3">
                      {order.agent ? (
                        <div>
                          <div className="font-medium">{order.agent.companyName || order.agent.name || "N/A"}</div>
                          <div className="text-sm text-gray-600">{order.agent.contactPerson || order.agent.email || ""}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{order.user?.name || "N/A"}</div>
                          <div className="text-sm text-gray-600">{order.user?.email || "N/A"}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-sm font-mono">{order.agent?.clientNumber || "N/A"}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-sm">{order.user?.name || order.user?.username || "N/A"}</div>
                        <div className="text-xs text-gray-600">{order.user?.agentNumber || order.user?.email || ""}</div>
                      </div>
                    </td>
                    <td className="p-3 text-center font-semibold">{order.items.length}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsOrderDetailOpen(true);
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                      >
                        ${order.totalAmount?.toFixed(2) || "0.00"}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${
                          order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          order.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                          order.status === "shipped" ? "bg-purple-100 text-purple-800" :
                          order.status === "delivered" ? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">En Proceso</option>
                        <option value="shipped">Procesado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => handleExportPDF(order)}
                          variant="outline"
                          size="sm"
                          title="Descargar PDF"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                          </svg>
                        </Button>
                        <Button
                          onClick={() => handleExportExcel(order)}
                          variant="outline"
                          size="sm"
                          title="Descargar Excel"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                          </svg>
                        </Button>
                        <Button
                          onClick={() => handleDelete(order.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Modal de detalle del pedido */}
      <OrderDetailModal 
        order={selectedOrder}
        isOpen={isOrderDetailOpen}
        onClose={() => {
          setIsOrderDetailOpen(false);
          setSelectedOrder(null);
        }}
      />
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Card>
  );
}





