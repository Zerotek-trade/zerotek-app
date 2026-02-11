import { Link } from "wouter";

interface ZerotekLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ZerotekLogo({ className = "", size = "md" }: ZerotekLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-9 w-9",
    xl: "h-12 w-12",
  };

  return (
    <img 
      src="/logo.jpg" 
      alt="zerotek logo" 
      className={`${sizeClasses[size]} rounded-md object-contain ${className}`}
      loading="eager"
    />
  );
}

interface BrandProps {
  showLogo?: boolean;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
  href?: string;
  className?: string;
}

export function Brand({ 
  showLogo = true, 
  showText = true, 
  size = "md",
  asLink = false,
  href = "/",
  className = ""
}: BrandProps) {
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showLogo && <ZerotekLogo size={size} />}
      {showText && (
        <span className={`font-medium tracking-tight ${textSizeClasses[size]}`}>
          zerotek
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
