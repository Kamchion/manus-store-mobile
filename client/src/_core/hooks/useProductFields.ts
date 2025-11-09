import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface FieldConfig {
  field: string;
  label: string;
  enabled: boolean;
  order: number;
  displayType: "text" | "badge" | "price" | "number" | "multiline";
  column?: "full" | "left" | "right";
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
}

export function useProductFields() {
  const { user } = useAuth();
  const isVendor = user?.role === "vendedor";
  
  // Use different queries based on user role
  const { data: clientFields, isLoading: isLoadingClient } = trpc.config.getProductFields.useQuery(undefined, {
    enabled: !isVendor,
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: vendorFields, isLoading: isLoadingVendor } = trpc.config.getProductFieldsVendor.useQuery(undefined, {
    enabled: isVendor,
    staleTime: 5 * 60 * 1000,
  });
  
  const fields = isVendor ? vendorFields : clientFields;
  const isLoading = isVendor ? isLoadingVendor : isLoadingClient;

  const enabledFields = (fields || [])
    .filter((f: FieldConfig) => f.enabled)
    .sort((a: FieldConfig, b: FieldConfig) => a.order - b.order);

  return {
    fields: enabledFields as FieldConfig[],
    isLoading,
  };
}

