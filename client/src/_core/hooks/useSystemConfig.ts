import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

/**
 * Hook para acceder a la configuración del sistema
 * Proporciona valores de configuración y funciones de utilidad
 */
export function useSystemConfig() {
  const { data: config, isLoading } = trpc.config.getAll.useQuery();

  const systemConfig = useMemo(() => {
    // Valores por defecto
    const defaults = {
      taxRate: 10,
      timezone: "America/Asuncion",
      currency: "USD",
      currencySymbol: "$",
      storeName: "IMPORKAM",
      storePhone: "",
      storeAddress: "",
    };

    if (!config) return defaults;

    return {
      taxRate: config.tax_rate ? parseFloat(config.tax_rate) : defaults.taxRate,
      timezone: config.timezone || defaults.timezone,
      currency: config.currency || defaults.currency,
      currencySymbol: config.currency_symbol || defaults.currencySymbol,
      storeName: config.store_name || defaults.storeName,
      storePhone: config.store_phone || defaults.storePhone,
      storeAddress: config.store_address || defaults.storeAddress,
    };
  }, [config]);

  /**
   * Formatea un precio con el símbolo de moneda configurado
   */
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return `${systemConfig.currencySymbol}${numPrice.toFixed(2)}`;
  };

  /**
   * Calcula el impuesto basado en la tasa configurada
   */
  const calculateTax = (subtotal: number): number => {
    return subtotal * (systemConfig.taxRate / 100);
  };

  /**
   * Calcula el total (subtotal + impuesto)
   */
  const calculateTotal = (subtotal: number): number => {
    return subtotal + calculateTax(subtotal);
  };

  return {
    config: systemConfig,
    isLoading,
    formatPrice,
    calculateTax,
    calculateTotal,
  };
}

