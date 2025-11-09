import { trpc } from "@/lib/trpc";
import { APP_LOGO } from "@/const";

interface LogoImageProps {
  size: "navbar" | "login" | "footer" | "email";
  className?: string;
  alt?: string;
}

export function LogoImage({ size, className = "", alt = "Logo" }: LogoImageProps) {
  const { data: logoConfig } = trpc.config.getLogoConfig.useQuery();

  const sizeMap = {
    navbar: logoConfig?.sizeNavbar || 120,
    login: logoConfig?.sizeLogin || 200,
    footer: logoConfig?.sizeFooter || 100,
    email: logoConfig?.sizeEmail || 150,
  };

  const logoUrl = (logoConfig?.url && logoConfig.url !== "" && logoConfig.url !== "/logo.png") 
    ? logoConfig.url 
    : "/assets/imporkam-logo.png";
  const logoSize = sizeMap[size];

  return (
    <img
      src={logoUrl}
      alt={alt}
      style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
      className={className}
    />
  );
}

