import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GripVertical, Save, Eye, Settings2, Palette } from "lucide-react";
import { getErrorMessage } from "@/lib/errorUtils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSystemConfig } from "@/_core/hooks/useSystemConfig";

interface FieldConfig {
  field: string;
  label: string;
  enabled: boolean;
  order: number;
  displayType: "text" | "badge" | "price" | "number" | "multiline";
  column: "full" | "left" | "right";
  textColor: string;
  fontSize: string;
  fontWeight: string;
  textAlign: string;
  maxLength?: number;
  options?: string[];
}

interface CardStyleConfig {
  margins: { top: number; bottom: number; left: number; right: number };
  imageSpacing: number;
  fieldSpacing: number;
}

interface SortableItemProps {
  id: string;
  field: FieldConfig;
  onToggle: (field: string) => void;
  onUpdate: (field: string, updates: Partial<FieldConfig>) => void;
  showStyles: boolean;
}

function SortableItem({ id, field, onToggle, onUpdate, showStyles }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg ${isDragging ? "shadow-lg" : "shadow-sm"}`}
    >
      <div className="flex items-center gap-3 p-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <p className="font-medium">{field.label}</p>
          <p className="text-sm text-gray-500">
            {field.field} • {field.displayType}
          </p>
        </div>

        <Switch
          checked={field.enabled}
          onCheckedChange={() => onToggle(field.field)}
        />
      </div>

      {showStyles && field.enabled && (
        <div className="border-t p-3 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            {/* Column Layout */}
            <div>
              <Label className="text-xs">Columna</Label>
              <Select
                value={field.column}
                onValueChange={(value) => onUpdate(field.field, { column: value as any })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Ancho completo</SelectItem>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Align */}
            <div>
              <Label className="text-xs">Alineación</Label>
              <Select
                value={field.textAlign}
                onValueChange={(value) => onUpdate(field.field, { textAlign: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Text Color */}
            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex gap-1">
                <input
                  type="color"
                  value={field.textColor}
                  onChange={(e) => onUpdate(field.field, { textColor: e.target.value })}
                  className="h-8 w-12 rounded border cursor-pointer"
                />
                <Input
                  type="text"
                  value={field.textColor}
                  onChange={(e) => onUpdate(field.field, { textColor: e.target.value })}
                  className="h-8 text-xs flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Font Size */}
            <div>
              <Label className="text-xs">Tamaño</Label>
              <Input
                type="number"
                min="8"
                max="32"
                value={field.fontSize}
                onChange={(e) => onUpdate(field.field, { fontSize: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            {/* Font Weight */}
            <div>
              <Label className="text-xs">Peso</Label>
              <Select
                value={field.fontWeight}
                onValueChange={(value) => onUpdate(field.field, { fontWeight: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Normal</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semibold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom field options */}
          {field.field === 'customSelect' && field.options && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Opciones del Desplegable</Label>
              {field.options.map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500 w-16">Opción {index + 1}:</span>
                  <Input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])];
                      newOptions[index] = e.target.value;
                      onUpdate(field.field, { options: newOptions });
                    }}
                    className="h-8 text-xs flex-1"
                    placeholder={`Opción ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProductFieldsConfig() {
  const [viewMode, setViewMode] = useState<'client' | 'vendor'>('client');
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [cardStyles, setCardStyles] = useState<CardStyleConfig>({
    margins: { top: 6, bottom: 8, left: 6, right: 6 },
    imageSpacing: 16,
    fieldSpacing: 4,
  });
  const [showStyleControls, setShowStyleControls] = useState(false);
  const { formatPrice } = useSystemConfig();

  const { data: configClient, isLoading: isLoadingClient, refetch: refetchClient } = trpc.config.getProductFields.useQuery();
  const { data: configVendor, isLoading: isLoadingVendor, refetch: refetchVendor } = trpc.config.getProductFieldsVendor.useQuery();
  const { data: stylesData } = trpc.config.getCardStyles.useQuery();
  const utils = trpc.useUtils();
  
  const config = viewMode === 'client' ? configClient : configVendor;
  const isLoading = viewMode === 'client' ? isLoadingClient : isLoadingVendor;
  const refetch = viewMode === 'client' ? refetchClient : refetchVendor;
  
  const updateClientMutation = trpc.config.updateProductFields.useMutation({
    onSuccess: () => {
      toast.success("Configuración de cliente actualizada");
      refetchClient();
      utils.config.getProductFields.invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
  
  const updateVendorMutation = trpc.config.updateProductFieldsVendor.useMutation({
    onSuccess: () => {
      toast.success("Configuración de vendedor actualizada");
      refetchVendor();
      utils.config.getProductFieldsVendor.invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
  
  const updateMutation = viewMode === 'client' ? updateClientMutation : updateVendorMutation;
  
  const updateStylesMutation = trpc.config.updateCardStyles.useMutation({
    onSuccess: () => {
      toast.success("Estilos de tarjeta actualizados");
      // Invalidate cache to force refetch
      utils.config.getCardStyles.invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (config) {
      setFields(config.sort((a: FieldConfig, b: FieldConfig) => a.order - b.order));
    }
  }, [config]);

  useEffect(() => {
    if (stylesData) {
      setCardStyles(stylesData);
    }
  }, [stylesData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.field === active.id);
        const newIndex = items.findIndex((item) => item.field === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
    }
  };

  const handleToggle = (fieldName: string) => {
    setFields((items) =>
      items.map((item) =>
        item.field === fieldName ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleFieldUpdate = (fieldName: string, updates: Partial<FieldConfig>) => {
    setFields((items) =>
      items.map((item) =>
        item.field === fieldName ? { ...item, ...updates } : item
      )
    );
  };

  const handleSave = () => {
    updateMutation.mutate(fields);
    updateStylesMutation.mutate(cardStyles);
  };

  const enabledFields = fields.filter((f) => f.enabled);
  const disabledFields = fields.filter((f) => !f.enabled);

  // Producto de ejemplo
  const exampleProduct = {
    name: "Producto de Ejemplo",
    sku: "PROD-001",
    description: "Descripción del producto",
    category: "Electrónica",
    rolePrice: "125.50",
    stock: 150,
    variantName: "Azul / Grande",
    dimension: "30x20x10 cm",
    line1Text: "Línea 1",
    line2Text: "Línea 2",
    minQuantity: 5,
    location: "A-12",
    unitsPerBox: 24,
    customText: "ABC12345",
    customSelect: "Opción A",
  };

  const renderFieldValue = (field: FieldConfig) => {
    const value = exampleProduct[field.field as keyof typeof exampleProduct];
    if (!value && value !== 0) return null;

    const style = {
      color: field.textColor,
      fontSize: `${field.fontSize}px`,
      fontWeight: field.fontWeight,
      textAlign: field.textAlign as any,
    };

    switch (field.displayType) {
      case "price":
        return <div style={style} className="font-bold">{formatPrice(value as string)}</div>;
      case "badge":
        return <span style={{...style, backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', display: 'inline-block'}}>{value}</span>;
      case "number":
        return <div style={style}>{field.label}: {value}</div>;
      case "multiline":
        return <div style={style} className="line-clamp-2">{value}</div>;
      default:
        return <div style={style}>{value}</div>;
    }
  };

  // Group fields by row (full width gets its own row, left/right share a row)
  const groupFieldsByRow = (fields: FieldConfig[]) => {
    const rows: FieldConfig[][] = [];
    let currentRow: FieldConfig[] = [];

    fields.forEach((field) => {
      if (field.column === "full") {
        if (currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [];
        }
        rows.push([field]);
      } else {
        currentRow.push(field);
        if (currentRow.length === 2) {
          rows.push(currentRow);
          currentRow = [];
        }
      }
    });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración de Campos de Producto</h1>
        <p className="text-gray-600 mt-2">
          Personaliza campos, colores, tamaños y layout de las tarjetas
        </p>
        
        {/* View Mode Tabs */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={viewMode === 'client' ? 'default' : 'outline'}
            onClick={() => setViewMode('client')}
            className="flex-1"
          >
            Vista Cliente
          </Button>
          <Button
            variant={viewMode === 'vendor' ? 'default' : 'outline'}
            onClick={() => setViewMode('vendor')}
            className="flex-1"
          >
            Vista Vendedor
          </Button>
        </div>
      </div>

      {/* Card Styles Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Estilos de Tarjeta
              </CardTitle>
              <CardDescription>
                Márgenes y espaciado de la tarjeta de producto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Margen Superior (px)</Label>
              <Input
                type="number"
                value={cardStyles.margins.top}
                onChange={(e) => setCardStyles({...cardStyles, margins: {...cardStyles.margins, top: parseInt(e.target.value) || 0}})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Margen Inferior (px)</Label>
              <Input
                type="number"
                value={cardStyles.margins.bottom}
                onChange={(e) => setCardStyles({...cardStyles, margins: {...cardStyles.margins, bottom: parseInt(e.target.value) || 0}})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Margen Lateral (px)</Label>
              <Input
                type="number"
                value={cardStyles.margins.left}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setCardStyles({...cardStyles, margins: {...cardStyles.margins, left: val, right: val}});
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Espacio Imagen-Contenido (px)</Label>
              <Input
                type="number"
                value={cardStyles.imageSpacing}
                onChange={(e) => setCardStyles({...cardStyles, imageSpacing: parseInt(e.target.value) || 0})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Espacio entre Campos (px)</Label>
              <Input
                type="number"
                value={cardStyles.fieldSpacing}
                onChange={(e) => setCardStyles({...cardStyles, fieldSpacing: parseInt(e.target.value) || 0})}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campos Activos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campos Activos</CardTitle>
                  <CardDescription>
                    Arrastra para reordenar • Desactiva con el switch
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStyleControls(!showStyleControls)}
                  className="gap-2"
                >
                  <Palette className="h-4 w-4" />
                  {showStyleControls ? "Ocultar" : "Mostrar"} Estilos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {enabledFields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay campos activos</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={enabledFields.map((f) => f.field)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {enabledFields.map((field) => (
                        <SortableItem
                          key={field.field}
                          id={field.field}
                          field={field}
                          onToggle={handleToggle}
                          onUpdate={handleFieldUpdate}
                          showStyles={showStyleControls}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Campos Desactivados */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Campos Disponibles</CardTitle>
              <CardDescription>
                Activa los campos que deseas mostrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disabledFields.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Todos los campos están activos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {disabledFields.map((field) => (
                    <div
                      key={field.field}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-700">{field.label}</p>
                        <p className="text-sm text-gray-500">
                          {field.field} • {field.displayType}
                        </p>
                      </div>
                      <Switch
                        checked={field.enabled}
                        onCheckedChange={() => handleToggle(field.field)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vista Previa */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <CardTitle>Vista Previa</CardTitle>
              </div>
              <CardDescription>
                Cómo se verá la tarjeta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Imagen */}
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                  
                  {/* Contenido */}
                  <div 
                    style={{
                      paddingTop: `${cardStyles.margins.top}px`,
                      paddingBottom: `${cardStyles.margins.bottom}px`,
                      paddingLeft: `${cardStyles.margins.left}px`,
                      paddingRight: `${cardStyles.margins.right}px`,
                      marginTop: `${cardStyles.imageSpacing}px`,
                    }}
                  >
                    {groupFieldsByRow(enabledFields).map((row, rowIndex) => (
                      <div 
                        key={rowIndex}
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: row.length === 1 ? '1fr' : '1fr 1fr',
                          marginBottom: rowIndex < groupFieldsByRow(enabledFields).length - 1 ? `${cardStyles.fieldSpacing}px` : 0,
                        }}
                      >
                        {row.map((field) => (
                          <div key={field.field}>
                            {renderFieldValue(field)}
                          </div>
                        ))}
                      </div>
                    ))}
                    
                    {enabledFields.length === 0 && (
                      <p className="text-center text-gray-400 py-4">
                        Sin campos activos
                      </p>
                    )}
                  </div>

                  {/* Botón */}
                  <div style={{padding: `0 ${cardStyles.margins.left}px ${cardStyles.margins.bottom}px`}}>
                    <Button className="w-full" size="sm" disabled>
                      Agregar al Carrito
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending || updateStylesMutation.isPending}
          size="lg"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending || updateStylesMutation.isPending ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </div>
    </div>
  );
}



export default ProductFieldsConfig;

