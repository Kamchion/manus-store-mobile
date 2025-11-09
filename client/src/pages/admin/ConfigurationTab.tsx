import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Package, Upload, Mail, Image, FileText } from "lucide-react";
import SystemConfig from "./SystemConfig";
import ProductFieldsConfig from "./ProductFieldsConfig";
import EmailConfig from "./EmailConfig";
import LogoConfig from "./LogoConfig";
import ReportConfig from "./ReportConfig";
import ProductImportNew from "@/components/ProductImportNew";
import ClientImport from "@/components/ClientImport";

type ConfigSubTab = "system" | "productFields" | "logo" | "email" | "reports" | "import";

export default function ConfigurationTab() {
  const [activeSubTab, setActiveSubTab] = useState<ConfigSubTab>("system");

  return (
    <div>
      {/* Sub-tabs */}
      <div className="sticky top-32 z-10 bg-gradient-to-br from-blue-50 to-indigo-100 -mx-6 px-6 pt-2 pb-4 mb-6 border-b">        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3">
        <Button
          variant={activeSubTab === "system" ? "default" : "outline"}
          onClick={() => setActiveSubTab("system")}
          className="flex items-center gap-2"
          size="sm"
        >
          <Settings className="w-4 h-4" />
          Sistema
        </Button>

        <Button
          variant={activeSubTab === "productFields" ? "default" : "outline"}
          onClick={() => setActiveSubTab("productFields")}
          className="flex items-center gap-2"
          size="sm"
        >
          <Package className="w-4 h-4" />
          Campos de Producto
        </Button>

        <Button
          variant={activeSubTab === "logo" ? "default" : "outline"}
          onClick={() => setActiveSubTab("logo")}
          className="flex items-center gap-2"
          size="sm"
        >
          <Image className="w-4 h-4" />
          Logo
        </Button>

        <Button
          variant={activeSubTab === "email" ? "default" : "outline"}
          onClick={() => setActiveSubTab("email")}
          className="flex items-center gap-2"
          size="sm"
        >
          <Mail className="w-4 h-4" />
          Correo Electrónico
        </Button>

        <Button
          variant={activeSubTab === "reports" ? "default" : "outline"}
          onClick={() => setActiveSubTab("reports")}
          className="flex items-center gap-2"
          size="sm"
        >
          <FileText className="w-4 h-4" />
          Reportes
        </Button>

        <Button
          variant={activeSubTab === "import" ? "default" : "outline"}
          onClick={() => setActiveSubTab("import")}
          className="flex items-center gap-2"
          size="sm"
        >
          <Upload className="w-4 h-4" />
          Importar Datos
        </Button>
        </div>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === "system" && <SystemConfig />}
      {activeSubTab === "productFields" && <ProductFieldsConfig />}
      {activeSubTab === "logo" && <LogoConfig />}
      {activeSubTab === "email" && <EmailConfig />}
      {activeSubTab === "reports" && <ReportConfig />}
      {activeSubTab === "import" && <ImportSubTab />}
    </div>
  );
}

function ImportSubTab() {
  const [importType, setImportType] = useState<"products" | "clients">("products");

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <Button
          variant={importType === "products" ? "default" : "outline"}
          onClick={() => setImportType("products")}
          size="sm"
        >
          Productos
        </Button>
        <Button
          variant={importType === "clients" ? "default" : "outline"}
          onClick={() => setImportType("clients")}
          size="sm"
        >
          Clientes
        </Button>
      </div>

      {importType === "products" ? <ProductImportNew /> : <ClientImport />}
    </div>
  );
}

