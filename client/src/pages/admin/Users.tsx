import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";

export default function UsersAdmin() {
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

  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [editFormData, setEditFormData] = useState({
    userId: "",
    username: "",
    email: "",
    companyName: "",
    contactPerson: "",
    companyTaxId: "",
    phone: "",
    address: "",
    gpsLocation: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    clientNumber: "",
    agentNumber: "",
    role: "cliente" as "cliente" | "operador" | "administrador" | "vendedor",
    priceType: "ciudad" as "ciudad" | "interior" | "especial",
    status: "active" as "active" | "frozen",
  });

  const utils = trpc.useUtils();

  // Queries
  const { data: users, isLoading } = trpc.users.listWithStats.useQuery(filters);
  const { data: stats } = trpc.users.getStats.useQuery();

  // Mutations
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuario creado exitosamente");
      utils.users.listWithStats.invalidate();
      utils.users.getStats.invalidate();
      // Resetear formulario
      setFormData({
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
        role: "cliente",
        priceType: "ciudad",
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const toggleFreezeMutation = trpc.users.toggleFreeze.useMutation({
    onSuccess: () => {
      toast.success("Estado de cuenta actualizado");
      utils.users.listWithStats.invalidate();
      utils.users.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const changePasswordMutation = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Contraseña cambiada exitosamente");
      setPasswordModalOpen(false);
      setNewPassword("");
      setSelectedUserId("");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuario eliminado");
      utils.users.listWithStats.invalidate();
      utils.users.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateUserMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Usuario actualizado exitosamente");
      utils.users.listWithStats.invalidate();
      setEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleToggleFreeze = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: "¿Cambiar estado de cuenta?",
      description: "Esta acción cambiará el estado de la cuenta entre activa y congelada.",
      onConfirm: () => {
        toggleFreezeMutation.mutate({ userId });
      }
    });
  };

  const handleOpenPasswordModal = (userId: string) => {
    setSelectedUserId(userId);
    setPasswordModalOpen(true);
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    changePasswordMutation.mutate({
      userId: selectedUserId,
      newPassword,
    });
  };

  const handleDeleteUser = (userId: string, username: string) => {
    setConfirmDialog({
      open: true,
      title: "¿Eliminar usuario?",
      description: `Esta acción eliminará permanentemente al usuario "${username}". Esta acción no se puede deshacer.`,
      onConfirm: () => {
        deleteUserMutation.mutate({ userId });
      }
    });
  };

  const handleOpenEditModal = (user: any) => {
    setEditFormData({
      userId: user.id,
      username: user.username || "",
      email: user.email || "",
      companyName: user.companyName || "",
      contactPerson: user.contactPerson || "",
      companyTaxId: user.companyTaxId || "",
      phone: user.phone || "",
      address: user.address || "",
      gpsLocation: user.gpsLocation || "",
      city: user.city || "",
      state: user.state || "",
      zipCode: user.zipCode || "",
      country: user.country || "",
      clientNumber: user.clientNumber || "",
      agentNumber: user.agentNumber || "",
      role: user.role,
      priceType: user.priceType || "ciudad",
      status: user.status,
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const { userId, ...updateData } = editFormData;
    updateUserMutation.mutate({ userId, ...updateData });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "administrador":
        return "bg-red-100 text-red-800";
      case "operador":
        return "bg-purple-100 text-purple-800";
      case "vendedor":
        return "bg-green-100 text-green-800";
      case "cliente":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "administrador":
        return "Administrador";
      case "operador":
        return "Operador";
      case "vendedor":
        return "Vendedor";
      case "cliente":
        return "Cliente";
      default:
        return "Desconocido";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const getLastLoginColor = (lastSignedIn: Date | null) => {
    if (!lastSignedIn) return "text-gray-500";
    const daysSince = (Date.now() - new Date(lastSignedIn).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return "text-green-600";
    if (daysSince < 30) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Clientes</div>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Activos</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Congelados</div>
            <div className="text-2xl font-bold text-gray-600">{stats.frozenUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Nuevos (30 días)</div>
            <div className="text-2xl font-bold text-blue-600">{stats.newUsersLast30Days}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Ventas</div>
            <div className="text-2xl font-bold text-purple-600">
              ${Number(stats.totalSales).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Creación */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Crear Nuevo Usuario</h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campo ID (Número de Cliente/Agente/Usuario) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID (Número) {formData.role === "cliente" ? "Cliente" : formData.role === "vendedor" ? "Agente" : "Usuario"} {(formData.role === "cliente" || formData.role === "vendedor") && "*"}
            </label>
            <input
              type="text"
              required={formData.role === "cliente" || formData.role === "vendedor"}
              value={formData.role === "cliente" ? formData.clientNumber : formData.role === "vendedor" ? formData.agentNumber : ""}
              onChange={(e) => {
                if (formData.role === "cliente") {
                  setFormData({ ...formData, clientNumber: e.target.value });
                } else if (formData.role === "vendedor") {
                  setFormData({ ...formData, agentNumber: e.target.value });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={formData.role === "cliente" ? "CLI-001" : formData.role === "vendedor" ? "VEN-15" : "Generado automáticamente"}
              disabled={formData.role !== "cliente" && formData.role !== "vendedor"}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === "cliente" && "Número único del cliente (obligatorio)"}
              {formData.role === "vendedor" && "Número único del agente (obligatorio)"}
              {formData.role !== "cliente" && formData.role !== "vendedor" && "No aplica para este rol"}
            </p>
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
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.role === "vendedor" ? "Nombre de Vendedor *" : 
               formData.role === "cliente" ? "Nombre de Cliente *" : 
               formData.role === "administrador" ? "Nombre de Administrador *" : 
               formData.role === "operador" ? "Nombre de Operador *" : 
               "Nombre de Negocio *"}
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

          {/* Dirección del Cliente */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección del Cliente
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Calle, número, colonia, ciudad, estado, código postal"
              rows={2}
            />
          </div>

          {/* Ubicación GPS */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación GPS
            </label>
            <input
              type="text"
              value={formData.gpsLocation ?? ""}
              onChange={(e) => setFormData({ ...formData, gpsLocation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 19.432608, -99.133209 o enlace de Google Maps"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
            <input
              type="text"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
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
              <option value="vendedor">Vendedor</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          {/* Tipo de Precio */}
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

          {/* Asignar Agente (solo para clientes) */}
          {formData.role === "cliente" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asignar a Agente (ID) *
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
                Ingresa el ID del agente para asignar este cliente (obligatorio)
              </p>
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Usuarios */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Listado de Clientes</h2>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Nombre, email, negocio..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todos</option>
              <option value="cliente">Cliente</option>
              <option value="operador">Operador</option>
              <option value="vendedor">Vendedor</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="frozen">Congelados</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No se encontraron usuarios</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Negocio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Comprado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Último Ingreso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{user.companyName || "-"}</td>
                    <td className="px-4 py-3 text-sm">{user.contactPerson || user.name || "-"}</td>
                    <td className="px-4 py-3 text-sm">{user.email || "-"}</td>
                    <td className="px-4 py-3 text-sm">{user.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          user.status
                        )}`}
                      >
                        {user.status === "active" ? "✅ Activo" : "❄️ Congelado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">{user.totalOrders}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ${Number(user.totalSpent).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={getLastLoginColor(user.lastSignedIn)}>
                        {user.lastSignedIn
                          ? formatDistanceToNow(new Date(user.lastSignedIn), {
                              addSuffix: true,
                              locale: es,
                            })
                          : "Nunca"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="text-green-600 hover:text-green-800"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleToggleFreeze(user.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title={user.status === "active" ? "Congelar" : "Activar"}
                        >
                          {user.status === "active" ? "❄️" : "✅"}
                        </button>
                        <button
                          onClick={() => handleOpenPasswordModal(user.id)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Cambiar contraseña"
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username || user.email || "usuario")}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Edición de Usuario */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Editar Usuario</h3>
            <form onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editFormData.role === "vendedor" ? "Nombre de Vendedor" : 
                   editFormData.role === "cliente" ? "Nombre de Cliente" : 
                   editFormData.role === "administrador" ? "Nombre de Administrador" : 
                   editFormData.role === "operador" ? "Nombre de Operador" : 
                   "Nombre de Negocio"}
                </label>
                <input
                  type="text"
                  value={editFormData.companyName}
                  onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  value={editFormData.contactPerson}
                  onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUT/Tax ID</label>
                <input
                  type="text"
                  value={editFormData.companyTaxId}
                  onChange={(e) => setEditFormData({ ...editFormData, companyTaxId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>

              {/* Ubicación GPS */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación GPS</label>
                <input
                  type="text"
                  value={editFormData.gpsLocation ?? ""}
                  onChange={(e) => setEditFormData({ ...editFormData, gpsLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ej: 19.432608, -99.133209 o enlace de Google Maps"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento/Estado</label>
                <input
                  type="text"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                <input
                  type="text"
                  value={editFormData.zipCode}
                  onChange={(e) => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <input
                  type="text"
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cliente</label>
                <input
                  type="text"
                  value={editFormData.clientNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, clientNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Agente</label>
                <input
                  type="text"
                  value={editFormData.agentNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, agentNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="cliente">Cliente</option>
                  <option value="operador">Operador</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Precio</label>
                <select
                  value={editFormData.priceType}
                  onChange={(e) => setEditFormData({ ...editFormData, priceType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="ciudad">Ciudad</option>
                  <option value="interior">Interior</option>
                  <option value="especial">Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Activo</option>
                  <option value="frozen">Congelado</option>
                </select>
              </div>

              <div className="md:col-span-2 flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Contraseña */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Cambiar Contraseña</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? "Cambiando..." : "Cambiar"}
              </button>
              <button
                onClick={() => {
                  setPasswordModalOpen(false);
                  setNewPassword("");
                  setSelectedUserId("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} });
          }
        }}
        variant="destructive"
      />
    </div>
  );
}

