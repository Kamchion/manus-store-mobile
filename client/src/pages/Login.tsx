import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";

export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: logoConfig } = trpc.config.getLogoConfig.useQuery();

  const utils = trpc.useUtils();
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      toast.success("Inicio de sesión exitoso");
      
      // Refrescar la sesión antes de redirigir
      await utils.auth.me.invalidate();
      
      // Redirigir según el rol del usuario
      if (data.user.role === 'vendedor') {
        window.location.href = "/vendedor";
      } else {
        window.location.href = "/products";
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loginMutation.mutate({ usernameOrEmail, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo y Texto Personalizable */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            {logoConfig?.url && logoConfig.url !== "" && logoConfig.url !== "/logo.png" ? (
              <img
                src={logoConfig.url}
                alt="Logo"
                style={{ width: `${logoConfig.sizeLogin || 200}px` }}
                className="object-contain"
              />
            ) : (
              <img
                src="/assets/imporkam-logo.png"
                alt="IMPORKAM"
                style={{ width: `${logoConfig?.sizeLogin || 200}px` }}
                className="object-contain"
              />
            )}
          </div>
          
          {/* Texto Personalizable */}
          {logoConfig?.loginText && (
            <p
              style={{
                color: logoConfig.loginTextColor,
                fontSize: `${logoConfig.loginTextSize}px`,
                fontWeight: logoConfig.loginTextWeight,
                textAlign: logoConfig.loginTextAlign as any,
              }}
            >
              {logoConfig.loginText}
            </p>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario o Correo Electrónico
            </label>
            <input
              type="text"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="usuario123 o correo@ejemplo.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

