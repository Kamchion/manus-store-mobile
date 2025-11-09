import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function AnnouncementPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const { data: popup } = trpc.config.getPopup.useQuery();

  useEffect(() => {
    // Check if popup should be shown
    if (popup?.enabled && !hasShown) {
      // Check if user has already seen this popup in this session
      const popupShown = sessionStorage.getItem("announcement_popup_shown");
      
      if (!popupShown) {
        // Show popup after a short delay
        setTimeout(() => {
          setIsOpen(true);
          setHasShown(true);
          sessionStorage.setItem("announcement_popup_shown", "true");
        }, 500);
      }
    }
  }, [popup, hasShown]);

  if (!popup?.enabled) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-600">
            {popup.title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-base text-gray-700 whitespace-pre-wrap">
          {popup.message}
        </DialogDescription>
        <div className="flex justify-end mt-4">
          <Button onClick={() => setIsOpen(false)} className="gap-2">
            <X className="h-4 w-4" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

