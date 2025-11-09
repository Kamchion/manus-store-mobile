import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSystemConfig } from "@/_core/hooks/useSystemConfig";
import { useProductFields } from "@/_core/hooks/useProductFields";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import ImageModal from "@/components/ImageModal";

interface ProductCardProps {
  product: any;
  onAddToCart: (productId: string, quantity: number, customText?: string, customSelect?: string) => void;
  onViewVariants: (product: any) => void;
  isAddingToCart?: boolean;
}

export default function ProductCard({ product, onAddToCart, onViewVariants, isAddingToCart }: ProductCardProps) {
  const { formatPrice } = useSystemConfig();
  const { fields, isLoading: fieldsLoading } = useProductFields();
  const { data: cardStyles } = trpc.config.getCardStyles.useQuery(undefined, {
    staleTime: 0, // No cache - always fetch fresh data
  });
  const [quantity, setQuantity] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // Función para agregar timestamp a la URL de la imagen para evitar caché
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return "";
    // Si la URL ya tiene parámetros, agregar timestamp con &, sino con ?
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${Date.now()}`;
  };
  
  // Estados para campos personalizados
  const [customText, setCustomText] = useState(product.customText || "");
  const [customSelect, setCustomSelect] = useState(product.customSelect || "");

  const renderFieldValue = (field: any) => {
    let value = product[field.field];
    
    // Handle special cases
    if (field.field === "rolePrice") {
      value = product.rolePrice || product.basePrice || "0";
    }

    // Renderizar campos personalizados editables
    if (field.field === "customText") {
      return (
        <input
          type="text"
          maxLength={8}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Texto"
          className="w-[60px] h-[18px] px-1 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      );
    }

    if (field.field === "customSelect") {
      const options = ["Opción 1", "Opción 2", "Opción 3"]; // Puedes hacer esto configurable
      return (
        <select
          value={customSelect}
          onChange={(e) => setCustomSelect(e.target.value)}
          className="w-[60px] h-[18px] px-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (!value && value !== 0) return null;

    // Default styles if not provided
    const style = {
      color: field.textColor || '#000000',
      fontSize: `${field.fontSize || 12}px`,
      fontWeight: field.fontWeight || '400',
      textAlign: (field.textAlign || 'left') as any,
    };

    switch (field.displayType) {
      case "price":
        return (
          <div style={style} className="font-bold">
            {formatPrice(value)}
          </div>
        );
      
      case "badge":
        return (
          <span 
            style={{
              ...style, 
              backgroundColor: '#f3f4f6', 
              padding: '2px 8px', 
              borderRadius: '4px', 
              display: 'inline-block'
            }}
          >
            {value}
          </span>
        );
      
      case "number":
        if (field.field === "stock") {
          return (
            <div style={style}>
              {value} stock
            </div>
          );
        }
        if (field.field === "unitsPerBox") {
          return (
            <div style={style}>
              Box: {value}
            </div>
          );
        }
        if (field.field === "minQuantity") {
          return (
            <div style={style}>
              MOQ: {value}
            </div>
          );
        }
        return (
          <div style={style}>
            {field.label}: {value}
          </div>
        );
      
      case "multiline":
        return (
          <div style={style} className="line-clamp-2">
            {value}
          </div>
        );
      
      default:
        return <div style={style}>{value}</div>;
    }
  };

  // Group fields by row based on column configuration
  const groupFieldsByRow = (fields: any[]) => {
    const rows: any[][] = [];
    let currentRow: any[] = [];

    fields.forEach((field) => {
      const column = field.column || 'full'; // Default to full width
      
      if (column === "full") {
        // Full width field gets its own row
        if (currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [];
        }
        rows.push([field]);
      } else if (column === "left") {
        // Start a new row with left field
        if (currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [];
        }
        currentRow.push(field);
      } else if (column === "right") {
        // Add to current row or create new row if empty
        currentRow.push(field);
        rows.push(currentRow);
        currentRow = [];
      } else {
        // Default: treat as full width
        if (currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [];
        }
        rows.push([field]);
      }
    });

    // Push any remaining fields
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  };

  // Default styles if not loaded
  const margins = cardStyles?.margins || { top: 6, bottom: 8, left: 6, right: 6 };
  const imageSpacing = cardStyles?.imageSpacing || 16;
  const fieldSpacing = cardStyles?.fieldSpacing || 4;

  // If fields are still loading, show a skeleton or default view
  if (fieldsLoading || !fields || fields.length === 0) {
    return (
      <Card className="flex flex-col h-full hover:shadow-lg transition-shadow overflow-hidden gap-0 py-0">
        <div 
          className="relative overflow-hidden bg-white aspect-square cursor-pointer"
          onClick={() => product.image && product.image !== "" && setIsImageModalOpen(true)}
        >
          {product.image && product.image !== "" ? (
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="w-full h-full object-contain hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-1.5 sm:p-2 flex-1 flex flex-col">
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 mb-0.5">{product.name}</h3>
          <p className="text-base sm:text-lg font-bold text-blue-600">
            {formatPrice(product.rolePrice || product.basePrice || "0")}
          </p>
          
          {/* Conditional Rendering based on variants */}
          <div className="mt-auto pt-2">
            {product.hasVariants ? (
              // Products WITH variants - show "Ver Opciones" button
              <Button
                onClick={() => onViewVariants(product)}
                className="w-full text-xs h-8"
                size="sm"
              >
                Ver Opciones ({product.variantsCount})
              </Button>
            ) : (
              // Products WITHOUT variants - show quantity selector + add button in same row
              <div className="flex items-center gap-1.5">
                <div className="flex-1 flex items-center justify-between bg-gray-100 rounded p-0.5">
                  <button
                    onClick={() => setQuantity(Math.max(0, quantity - 1))}
                    className="px-2 py-0.5 text-gray-600 hover:text-gray-900 font-bold text-sm"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setQuantity(Math.max(0, value));
                    }}
                    className="text-xs font-semibold w-16 text-center bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2 py-0.5 text-gray-600 hover:text-gray-900 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
                <Button
                  onClick={() => {
                    if (quantity > 0) {
                      onAddToCart(product.id, quantity, customText, customSelect);
                    }
                  }}
                  disabled={quantity === 0 || isAddingToCart}
                  className="h-8 px-2"
                  size="sm"
                >
                  {isAddingToCart ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={product.image || ""}
          productName={product.name}
        />
      </Card>
    );
  }

  const fieldRows = groupFieldsByRow(fields);

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow overflow-hidden gap-0 py-0">
      {/* Product Image */}
      <div 
        className="relative overflow-hidden bg-white aspect-square cursor-pointer"
        onClick={() => product.image && product.image !== "" && setIsImageModalOpen(true)}
      >
        {product.image && product.image !== "" ? (
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-contain hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Spacing between image and content */}
      <div style={{ height: `${imageSpacing}px` }} />
      
      {/* Product Info - Dynamic Fields */}
      <div 
        className="flex-1 flex flex-col"
        style={{
          paddingTop: `${margins.top}px`,
          paddingBottom: `${margins.bottom}px`,
          paddingLeft: `${margins.left}px`,
          paddingRight: `${margins.right}px`,
        }}
      >
        {/* Render fields in configured rows */}
        {fieldRows.map((row, rowIndex) => (
          <div 
            key={rowIndex}
            className="flex gap-2"
            style={{
              marginBottom: rowIndex < fieldRows.length - 1 ? `${fieldSpacing}px` : 0,
            }}
          >
            {row.map((field) => (
              <div key={field.field} className={row.length === 1 ? 'w-full' : 'flex-1'}>
                {renderFieldValue(field)}
              </div>
            ))}
          </div>
        ))}

        {/* Conditional Rendering based on variants */}
        <div className="mt-auto" style={{ paddingTop: `${fieldSpacing * 2}px` }}>
          {product.hasVariants ? (
            // Products WITH variants - show "Ver Opciones" button
            <Button
              onClick={() => onViewVariants(product)}
              className="w-full text-xs h-8"
              size="sm"
            >
              Ver Opciones ({product.variantsCount})
            </Button>
          ) : (
            // Products WITHOUT variants - show quantity selector + add button in same row
            <div className="flex items-center gap-1.5">
              <div className="flex-1 flex items-center justify-between bg-gray-100 rounded p-0.5">
                <button
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  className="px-2 py-0.5 text-gray-600 hover:text-gray-900 font-bold text-sm"
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setQuantity(Math.max(0, value));
                  }}
                  className="text-xs font-semibold w-16 text-center bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2 py-0.5 text-gray-600 hover:text-gray-900 font-bold text-sm"
                >
                  +
                </button>
              </div>
              <Button
                onClick={() => {
                  if (quantity > 0) {
                    onAddToCart(product.id, quantity, customText, customSelect);
                  }
                }}
                disabled={quantity === 0 || isAddingToCart}
                className="h-8 px-2"
                size="sm"
              >
                {isAddingToCart ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={product.image || ""}
        productName={product.name}
      />
    </Card>
  );
}

