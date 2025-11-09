import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  productName: string;
}

/**
 * Modal para mostrar imagen de producto en tamaño completo
 */
export default function ImageModal({ isOpen, onClose, imageUrl, productName }: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/95">
        <VisuallyHidden>
          <DialogTitle>{productName}</DialogTitle>
        </VisuallyHidden>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Image container */}
        <div className="relative w-full h-[80vh] flex items-center justify-center p-4">
          <img
            src={imageUrl}
            alt={productName}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Product name */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white text-center font-medium">{productName}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

