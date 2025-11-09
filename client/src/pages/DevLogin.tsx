import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  companyName: string | null;
}

export default function DevLogin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/dev/dev-users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userId: string) => {
    try {
      const response = await fetch("/api/dev/dev-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Reload to update auth state
        window.location.href = "/products";
      } else {
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Modo de Desarrollo - Seleccionar Usuario</CardTitle>
          <CardDescription>
            Selecciona un usuario para iniciar sesión y probar la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{user.name || "Sin nombre"}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.companyName && (
                        <p className="text-sm text-muted-foreground">
                          Empresa: {user.companyName}
                        </p>
                      )}
                    </div>
                    <Button onClick={() => handleLogin(user.id)}>
                      Iniciar Sesión
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

