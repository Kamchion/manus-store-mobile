import { useState } from "react";
import { toast } from "sonner";

interface UserFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function UserFormNew({ onSubmit, isLoading }: UserFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    companyName: "",
    contactPerson: "",
    phone: "",
    address: "",
    gpsLocation: "",
    clientNumber: "",
    agentNumber: "",
    role: "cliente" as "cliente" | "operador" | "administrador" | "vendedor",
    priceType: "ciudad" as "ciudad" | "interior" | "especial",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData({
            ...formData,
            gpsLocation: `${latitude},${longitude}`,
          });
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          toast.error("No se pudo obtener la ubicación. Verifica los permisos del navegador.");
        }
      );
    } else {
      toast.error("Tu navegador no soporta geolocalización");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Información Básica */}
      <div className="md:col-span-2 lg:col-span-3">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Información Básica</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de Usuario *
        </label>
        <input
          type="text"
          required
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="usuario123"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo Electrónico *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña *
        </label>
        <input
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mínimo 6 caracteres"
          minLength={6}
        />
      </div>

      {/* Información del Negocio */}
      <div className="md:col-span-2 lg:col-span-3 mt-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Información del Negocio</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de Negocio *
        </label>
        <input
          type="text"
          required
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mi Empresa S.A."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Persona de Contacto
        </label>
        <input
          type="text"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Juan Pérez"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+1234567890"
        />
      </div>

      {/* Dirección y Ubicación */}
      <div className="md:col-span-2 lg:col-span-3 mt-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Dirección y Ubicación</h3>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección Completa
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Calle, número, colonia, ciudad, estado, código postal"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ubicación GPS
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.gpsLocation}
            onChange={(e) => setFormData({ ...formData, gpsLocation: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Latitud, Longitud"
          />
          <button
            type="button"
            onClick={handleGetLocation}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            title="Obtener ubicación actual"
          >
            📍 GPS
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Formato: latitud,longitud (ej: 19.4326,-99.1332)
        </p>
      </div>

      {/* Rol y Configuración */}
      <div className="md:col-span-2 lg:col-span-3 mt-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Rol y Configuración</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
        <select
          required
          value={formData.role}
          onChange={(e) =>
            setFormData({
              ...formData,
              role: e.target.value as "cliente" | "operador" | "administrador" | "vendedor",
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="cliente">Cliente</option>
          <option value="operador">Operador</option>
          <option value="administrador">Administrador</option>
          <option value="vendedor">Vendedor</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {formData.role === "cliente" && "Usuario final que realiza compras"}
          {formData.role === "operador" && "Gestiona pedidos y usuarios (sin acceso a productos)"}
          {formData.role === "administrador" && "Acceso total al sistema"}
          {formData.role === "vendedor" && "Agente de ventas que gestiona sus clientes"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Precio *
        </label>
        <select
          required
          value={formData.priceType}
          onChange={(e) =>
            setFormData({
              ...formData,
              priceType: e.target.value as "ciudad" | "interior" | "especial",
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ciudad">Ciudad</option>
          <option value="interior">Interior</option>
          <option value="especial">Especial</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Define qué precios verá este usuario
        </p>
      </div>

      {/* Números de Cliente/Agente */}
      {formData.role === "cliente" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Cliente
          </label>
          <input
            type="text"
            value={formData.clientNumber}
            onChange={(e) => setFormData({ ...formData, clientNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CLI-001"
          />
          <p className="text-xs text-gray-500 mt-1">
            Dejar vacío para generar automáticamente
          </p>
        </div>
      )}

      {formData.role === "vendedor" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Agente *
          </label>
          <input
            type="text"
            required
            value={formData.agentNumber}
            onChange={(e) => setFormData({ ...formData, agentNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VEN-15"
          />
          <p className="text-xs text-gray-500 mt-1">
            Los clientes con este número pertenecerán a este vendedor
          </p>
        </div>
      )}

      {/* Botón de Envío */}
      <div className="md:col-span-2 lg:col-span-3 mt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creando..." : "Crear Usuario"}
        </button>
      </div>
    </form>
  );
}

