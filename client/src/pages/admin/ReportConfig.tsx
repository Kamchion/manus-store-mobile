import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cleanErrorMessage } from "@/lib/errorUtils";

interface PDFConfig {
  // Columnas
  showImage: boolean;
  showSKU: boolean;
  showProduct: boolean;
  showQuantity: boolean;
  showPrice: boolean;
  showSubtotal: boolean;
  
  // Nombres de columnas personalizados
  columnNameImage?: string;
  columnNameLocation?: string;
  columnNameCode?: string;
  columnNameQuantity?: string;
  columnNameDescription?: string;
  columnNameInventory?: string;
  columnNameCustomText?: string;
  columnNameCustomSelect?: string;
  columnNamePrice?: string;
  
  // Anchos de columna
  columnWidthSKU: number;
  columnWidthProduct: number;
  columnWidthQuantity: number;
  columnWidthPrice: number;
  columnWidthSubtotal: number;
  
  // Configuración de página
  pageSize: 'A4' | 'LETTER' | 'LEGAL';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  
  // Tamaños
  imageWidth: number;
  imageHeight: number;
  fontSize: number;
  lineSpacing: number;
  
  // Información adicional
  showCustomerInfo: boolean;
  showClientId: boolean;
  showCompanyName: boolean;
  showContactPerson: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  
  // Totales
  showTotals: boolean;
  
  // Encabezado/Pie
  showHeader: boolean;
  showFooter: boolean;
  headerText: string;
  footerText: string;
}

interface ExcelConfig {
  // Columnas
  showImage: boolean;
  showSKU: boolean;
  showProduct: boolean;
  showQuantity: boolean;
  showPrice: boolean;
  showSubtotal: boolean;
  showStock: boolean;
  showCategory: boolean;
  
  // Información adicional
  showCustomerInfo: boolean;
  showTotals: boolean;
  
  // Formato
  headerColor: string;
  alternateRows: boolean;
}

export default function ReportConfig() {
  const [previewPDF, setPreviewPDF] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const hasUnsavedChanges = useRef(false);
  
  const [pdfConfig, setPdfConfig] = useState<PDFConfig>({
    showImage: false,
    showSKU: true,
    showProduct: true,
    showQuantity: true,
    showPrice: true,
    showSubtotal: true,
    columnNameImage: 'imagen',
    columnNameLocation: 'ubicación',
    columnNameCode: 'codigo',
    columnNameQuantity: 'cantidad',
    columnNameDescription: 'descripcion',
    columnNameInventory: 'inventario',
    columnNameCustomText: 'custom textbox',
    columnNameCustomSelect: 'customselect',
    columnNamePrice: 'precio unitario',
    columnWidthSKU: 80,
    columnWidthProduct: 200,
    columnWidthQuantity: 60,
    columnWidthPrice: 80,
    columnWidthSubtotal: 80,
    pageSize: 'A4',
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 50,
    marginRight: 50,
    imageWidth: 50,
    imageHeight: 50,
    fontSize: 10,
    lineSpacing: 25,
    showCustomerInfo: true,
    showClientId: true,
    showCompanyName: true,
    showContactPerson: true,
    showEmail: true,
    showPhone: true,
    showAddress: true,
    showTotals: true,
    showHeader: true,
    showFooter: true,
    headerText: 'PEDIDO',
    footerText: 'Gracias por su pedido',
  });

  const [excelConfig, setExcelConfig] = useState<ExcelConfig>({
    showImage: false,
    showSKU: true,
    showProduct: true,
    showQuantity: true,
    showPrice: true,
    showSubtotal: true,
    showStock: false,
    showCategory: false,
    showCustomerInfo: true,
    showTotals: true,
    headerColor: 'E0E0E0',
    alternateRows: true,
  });

  const configQuery = trpc.systemConfig.get.useQuery(
    { key: 'report_config' },
    { enabled: true, retry: false }
  );
  const saveConfigMutation = trpc.systemConfig.upsert.useMutation();
  const previewMutation = trpc.admin.previewPDF.useMutation();

  useEffect(() => {
    if (configQuery.data?.value && !hasUnsavedChanges.current) {
      try {
        const config = JSON.parse(configQuery.data.value);
        console.log('[ReportConfig] useEffect triggered, loading config from server');
        console.log('[ReportConfig] config.pdf.showTotals from server:', config.pdf?.showTotals);
        // Merge con valores por defecto para evitar undefined
        if (config.pdf) {
          setPdfConfig(prev => {
            console.log('[ReportConfig] Previous showTotals:', prev.showTotals);
            console.log('[ReportConfig] New showTotals:', config.pdf.showTotals);
            return { ...prev, ...config.pdf };
          });
        }
        if (config.excel) {
          setExcelConfig(prev => ({ ...prev, ...config.excel }));
        }
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configQuery.data]);

  const handleSave = async () => {
    try {
      const configToSave = {
        pdf: pdfConfig,
        excel: excelConfig,
      };
      console.log('[ReportConfig] Saving config:', JSON.stringify(configToSave, null, 2));
      console.log('[ReportConfig] pdfConfig.showTotals:', pdfConfig.showTotals);
      await saveConfigMutation.mutateAsync({
        key: 'report_config',
        value: JSON.stringify(configToSave),
      });
      hasUnsavedChanges.current = false;
      toast.success('Configuración guardada correctamente');
    } catch (error: any) {
      toast.error(cleanErrorMessage(error.message));
    }
  };

  const handlePreview = useCallback(async () => {
    setIsGeneratingPreview(true);
    try {
      const result = await previewMutation.mutateAsync({
        config: JSON.stringify({ pdf: pdfConfig, excel: excelConfig }),
      });
      
      // Convert base64 to blob URL
      const pdfBlob = new Blob(
        [Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))],
        { type: 'application/pdf' }
      );
      const url = URL.createObjectURL(pdfBlob);
      setPreviewPDF(url);
    } catch (error: any) {
      toast.error(cleanErrorMessage(error.message));
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [pdfConfig, excelConfig, previewMutation]);

  // Removed auto-update to avoid performance issues
  // User can manually trigger preview by clicking the button

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración de Reportes</h2>
        <p className="text-muted-foreground">
          Personaliza cómo se generan los reportes de pedidos en PDF y Excel
        </p>
      </div>

      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pdf">PDF</TabsTrigger>
          <TabsTrigger value="excel">Excel</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf" className="space-y-4">
          {/* Columnas PDF */}
          <Card>
            <CardHeader>
              <CardTitle>Columnas a Mostrar</CardTitle>
              <CardDescription>Selecciona qué columnas incluir en el PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-image">Imagen del Producto</Label>
                <Switch
                  id="pdf-image"
                  checked={pdfConfig.showImage}
                  onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showImage: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-sku">SKU</Label>
                <Switch
                  id="pdf-sku"
                  checked={pdfConfig.showSKU}
                  onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showSKU: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-product">Producto</Label>
                <Switch
                  id="pdf-product"
                  checked={pdfConfig.showProduct}
                  onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showProduct: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-quantity">Cantidad</Label>
                <Switch
                  id="pdf-quantity"
                  checked={pdfConfig.showQuantity}
                  onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showQuantity: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-price">Precio Unitario</Label>
                <Switch
                  id="pdf-price"
                  checked={pdfConfig.showPrice}
                  onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showPrice: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-subtotal">Subtotal</Label>
                <Switch
                  id="pdf-subtotal"
                  checked={pdfConfig.showSubtotal}
                  onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showSubtotal: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Nombres de Columnas Personalizados */}
          <Card>
            <CardHeader>
              <CardTitle>Nombres de Columnas</CardTitle>
              <CardDescription>Personaliza el nombre de cada columna en el PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="col-name-image">Nombre columna Imagen</Label>
                  <Input
                    id="col-name-image"
                    value={pdfConfig.columnNameImage ?? ''}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnNameImage: e.target.value })}
                    placeholder="imagen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col-name-location">Nombre columna Ubicación</Label>
                  <Input
                    id="col-name-location"
                    value={pdfConfig.columnNameLocation ?? ''}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnNameLocation: e.target.value })}
                    placeholder="ubicación"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col-name-code">Nombre columna Código</Label>
                  <Input
                    id="col-name-code"
                    value={pdfConfig.columnNameCode ?? ''}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnNameCode: e.target.value })}
                    placeholder="codigo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col-name-quantity">Nombre columna Cantidad</Label>
                  <Input
                    id="col-name-quantity"
                    value={pdfConfig.columnNameQuantity ?? ''}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnNameQuantity: e.target.value })}
                    placeholder="cantidad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col-name-description">Nombre columna Descripción</Label>
                  <Input
                    id="col-name-description"
                    value={pdfConfig.columnNameDescription ?? ''}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnNameDescription: e.target.value })}
                    placeholder="descripcion"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col-name-inventory">Nombre columna Inventario</Label>
                  <Input
                    id="col-name-inventory"
                    value={pdfConfig.columnNameInventory ?? ''}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnNameInventory: e.target.value })}
                    placeholder="inventario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col-name-custom-text">Nombre columna Custom Textbox</Label>
                  <Input
                    id="col-name-custom-text"
                    value={pdfConfig.columnNameCustomText ?? ''}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnNameCustomText: e.target.value })}
                    placeholder="custom textbox"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col-name-custom-select">Nombre columna Custom Select</Label>
                  <Input
                    id="col-name-custom-select"
                    value={pdfConfig.columnNameCustomSelect ?? ''}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnNameCustomSelect: e.target.value })}
                    placeholder="customselect"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col-name-price">Nombre columna Precio Unitario</Label>
                  <Input
                    id="col-name-price"
                    value={pdfConfig.columnNamePrice ?? ''}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnNamePrice: e.target.value })}
                    placeholder="precio unitario"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anchos de Columna */}
          <Card>
            <CardHeader>
              <CardTitle>Anchos de Columna</CardTitle>
              <CardDescription>Ajusta el ancho de cada columna en puntos (pt)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pdfConfig.showSKU && (
                <div className="space-y-2">
                  <Label htmlFor="col-width-sku">Ancho SKU (pt)</Label>
                  <Input
                    id="col-width-sku"
                    type="number"
                    value={pdfConfig.columnWidthSKU}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnWidthSKU: parseInt(e.target.value) || 80 })}
                    min="40"
                    max="200"
                  />
                </div>
              )}
              {pdfConfig.showProduct && (
                <div className="space-y-2">
                  <Label htmlFor="col-width-product">Ancho Producto (pt)</Label>
                  <Input
                    id="col-width-product"
                    type="number"
                    value={pdfConfig.columnWidthProduct}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnWidthProduct: parseInt(e.target.value) || 200 })}
                    min="100"
                    max="400"
                  />
                </div>
              )}
              {pdfConfig.showQuantity && (
                <div className="space-y-2">
                  <Label htmlFor="col-width-quantity">Ancho Cantidad (pt)</Label>
                  <Input
                    id="col-width-quantity"
                    type="number"
                    value={pdfConfig.columnWidthQuantity}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnWidthQuantity: parseInt(e.target.value) || 60 })}
                    min="40"
                    max="150"
                  />
                </div>
              )}
              {pdfConfig.showPrice && (
                <div className="space-y-2">
                  <Label htmlFor="col-width-price">Ancho Precio (pt)</Label>
                  <Input
                    id="col-width-price"
                    type="number"
                    value={pdfConfig.columnWidthPrice}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnWidthPrice: parseInt(e.target.value) || 80 })}
                    min="50"
                    max="150"
                  />
                </div>
              )}
              {pdfConfig.showSubtotal && (
                <div className="space-y-2">
                  <Label htmlFor="col-width-subtotal">Ancho Subtotal (pt)</Label>
                  <Input
                    id="col-width-subtotal"
                    type="number"
                    value={pdfConfig.columnWidthSubtotal}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, columnWidthSubtotal: parseInt(e.target.value) || 80 })}
                    min="50"
                    max="150"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración de Página */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Página</CardTitle>
              <CardDescription>Ajusta el tamaño de hoja y márgenes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page-size">Tamaño de Hoja</Label>
                <Select
                  value={pdfConfig.pageSize}
                  onValueChange={(value: 'A4' | 'LETTER' | 'LEGAL') => setPdfConfig({ ...pdfConfig, pageSize: value })}
                >
                  <SelectTrigger id="page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="LETTER">Letter (8.5 × 11 in)</SelectItem>
                    <SelectItem value="LEGAL">Legal (8.5 × 14 in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="margin-top">Margen Superior (pt)</Label>
                  <Input
                    id="margin-top"
                    type="number"
                    value={pdfConfig.marginTop}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, marginTop: parseInt(e.target.value) || 50 })}
                    min="20"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin-bottom">Margen Inferior (pt)</Label>
                  <Input
                    id="margin-bottom"
                    type="number"
                    value={pdfConfig.marginBottom}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, marginBottom: parseInt(e.target.value) || 50 })}
                    min="20"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin-left">Margen Izquierdo (pt)</Label>
                  <Input
                    id="margin-left"
                    type="number"
                    value={pdfConfig.marginLeft}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, marginLeft: parseInt(e.target.value) || 50 })}
                    min="20"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin-right">Margen Derecho (pt)</Label>
                  <Input
                    id="margin-right"
                    type="number"
                    value={pdfConfig.marginRight}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, marginRight: parseInt(e.target.value) || 50 })}
                    min="20"
                    max="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tamaños y Espaciado */}
          <Card>
            <CardHeader>
              <CardTitle>Tamaños y Espaciado</CardTitle>
              <CardDescription>Ajusta el tamaño de elementos y espaciado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pdfConfig.showImage && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="image-width">Ancho de Imagen (px)</Label>
                    <Input
                      id="image-width"
                      type="number"
                      value={pdfConfig.imageWidth}
                      onChange={(e) => setPdfConfig({ ...pdfConfig, imageWidth: parseInt(e.target.value) || 50 })}
                      min="20"
                      max="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-height">Alto de Imagen (px)</Label>
                    <Input
                      id="image-height"
                      type="number"
                      value={pdfConfig.imageHeight}
                      onChange={(e) => setPdfConfig({ ...pdfConfig, imageHeight: parseInt(e.target.value) || 50 })}
                      min="20"
                      max="200"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="font-size">Tamaño de Fuente (pt)</Label>
                <Input
                  id="font-size"
                  type="number"
                  value={pdfConfig.fontSize}
                  onChange={(e) => setPdfConfig({ ...pdfConfig, fontSize: parseInt(e.target.value) || 10 })}
                  min="6"
                  max="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line-spacing">Espaciado entre Líneas (px)</Label>
                <Input
                  id="line-spacing"
                  type="number"
                  value={pdfConfig.lineSpacing}
                  onChange={(e) => setPdfConfig({ ...pdfConfig, lineSpacing: parseInt(e.target.value) || 25 })}
                  min="15"
                  max="50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
              <CardDescription>Selecciona qué datos del cliente mostrar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-customer">Mostrar Sección de Cliente</Label>
                <Switch
                  id="show-customer"
                  checked={pdfConfig.showCustomerInfo}
                  onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showCustomerInfo: checked })}
                />
              </div>
              {pdfConfig.showCustomerInfo && (
                <>
                  <div className="flex items-center justify-between pl-6">
                    <Label htmlFor="show-client-id">ID del Cliente</Label>
                    <Switch
                      id="show-client-id"
                      checked={pdfConfig.showClientId}
                      onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showClientId: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between pl-6">
                    <Label htmlFor="show-company">Empresa</Label>
                    <Switch
                      id="show-company"
                      checked={pdfConfig.showCompanyName}
                      onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showCompanyName: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between pl-6">
                    <Label htmlFor="show-contact">Contacto</Label>
                    <Switch
                      id="show-contact"
                      checked={pdfConfig.showContactPerson}
                      onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showContactPerson: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between pl-6">
                    <Label htmlFor="show-email-pdf">Email</Label>
                    <Switch
                      id="show-email-pdf"
                      checked={pdfConfig.showEmail}
                      onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showEmail: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between pl-6">
                    <Label htmlFor="show-phone-pdf">Teléfono</Label>
                    <Switch
                      id="show-phone-pdf"
                      checked={pdfConfig.showPhone}
                      onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showPhone: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between pl-6">
                    <Label htmlFor="show-address-pdf">Dirección</Label>
                    <Switch
                      id="show-address-pdf"
                      checked={pdfConfig.showAddress}
                      onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showAddress: checked })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Totales */}
          <Card>
            <CardHeader>
              <CardTitle>Totales del Pedido</CardTitle>
              <CardDescription>Mostrar u ocultar la sección de totales (Subtotal, Impuesto, Total)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-totals">Mostrar Totales</Label>
                <Switch
                  id="show-totals"
                  checked={pdfConfig.showTotals}
                  onCheckedChange={(checked) => {
                    hasUnsavedChanges.current = true;
                    setPdfConfig({ ...pdfConfig, showTotals: checked });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Encabezado y Pie de Página */}
          <Card>
            <CardHeader>
              <CardTitle>Encabezado y Pie de Página</CardTitle>
              <CardDescription>Personaliza los textos del encabezado y pie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-header">Mostrar Encabezado</Label>
                <Switch
                  id="show-header"
                  checked={pdfConfig.showHeader}
                  onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showHeader: checked })}
                />
              </div>
              {pdfConfig.showHeader && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="header-text">Texto del Encabezado</Label>
                  <Input
                    id="header-text"
                    value={pdfConfig.headerText}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, headerText: e.target.value })}
                    placeholder="PEDIDO"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-footer">Mostrar Pie de Página</Label>
                <Switch
                  id="show-footer"
                  checked={pdfConfig.showFooter}
                  onCheckedChange={(checked) => setPdfConfig({ ...pdfConfig, showFooter: checked })}
                />
              </div>
              {pdfConfig.showFooter && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="footer-text">Texto del Pie de Página</Label>
                  <Input
                    id="footer-text"
                    value={pdfConfig.footerText}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, footerText: e.target.value })}
                    placeholder="Gracias por su pedido"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excel" className="space-y-4">
          {/* Columnas Excel */}
          <Card>
            <CardHeader>
              <CardTitle>Columnas a Mostrar</CardTitle>
              <CardDescription>Selecciona qué columnas incluir en el Excel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="excel-sku">SKU</Label>
                <Switch
                  id="excel-sku"
                  checked={excelConfig.showSKU}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, showSKU: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="excel-product">Producto</Label>
                <Switch
                  id="excel-product"
                  checked={excelConfig.showProduct}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, showProduct: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="excel-quantity">Cantidad</Label>
                <Switch
                  id="excel-quantity"
                  checked={excelConfig.showQuantity}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, showQuantity: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="excel-price">Precio Unitario</Label>
                <Switch
                  id="excel-price"
                  checked={excelConfig.showPrice}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, showPrice: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="excel-subtotal">Subtotal</Label>
                <Switch
                  id="excel-subtotal"
                  checked={excelConfig.showSubtotal}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, showSubtotal: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="excel-stock">Stock</Label>
                <Switch
                  id="excel-stock"
                  checked={excelConfig.showStock}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, showStock: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="excel-category">Categoría</Label>
                <Switch
                  id="excel-category"
                  checked={excelConfig.showCategory}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, showCategory: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
              <CardDescription>Configura qué información adicional incluir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="excel-customer">Información del Cliente</Label>
                <Switch
                  id="excel-customer"
                  checked={excelConfig.showCustomerInfo}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, showCustomerInfo: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="excel-totals">Totales (Subtotal, Impuesto, Total)</Label>
                <Switch
                  id="excel-totals"
                  checked={excelConfig.showTotals}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, showTotals: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Formato */}
          <Card>
            <CardHeader>
              <CardTitle>Formato</CardTitle>
              <CardDescription>Personaliza la apariencia del Excel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="header-color">Color del Encabezado (Hex sin #)</Label>
                <Input
                  id="header-color"
                  value={excelConfig.headerColor}
                  onChange={(e) => setExcelConfig({ ...excelConfig, headerColor: e.target.value.replace('#', '') })}
                  placeholder="E0E0E0"
                  maxLength={6}
                />
                <div 
                  className="w-full h-8 rounded border"
                  style={{ backgroundColor: `#${excelConfig.headerColor}` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="alternate-rows">Alternar Color de Filas</Label>
                <Switch
                  id="alternate-rows"
                  checked={excelConfig.alternateRows}
                  onCheckedChange={(checked) => setExcelConfig({ ...excelConfig, alternateRows: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button onClick={handleSave} disabled={saveConfigMutation.isPending}>
          {saveConfigMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
        <Button 
          onClick={handlePreview} 
          disabled={isGeneratingPreview}
          variant="outline"
        >
          {isGeneratingPreview ? 'Generando...' : 'Vista Previa PDF'}
        </Button>
      </div>

      {/* PDF Preview */}
      {previewPDF && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Vista Previa del PDF</CardTitle>
                <CardDescription>Esta es una vista previa con datos de ejemplo</CardDescription>
              </div>
              <a 
                href={previewPDF} 
                download="preview.pdf"
                className="text-sm text-blue-600 hover:underline"
              >
                Descargar PDF
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <iframe
              src={`${previewPDF}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-[800px] border rounded bg-gray-100"
              title="Vista Previa PDF"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

