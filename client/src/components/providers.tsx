import { ReactNode, useEffect, Component, ErrorInfo } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

// Create Solana connectors at module level (outside component)
const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});

interface ProvidersProps {
  children: ReactNode;
}

// Error boundary to catch Privy wallet detection errors
class PrivyErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: false }; // Don't show error state, just suppress
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Suppress Privy wallet detection errors (they're non-fatal)
    if (error.message?.includes('hook') || error.message?.includes('Invalid hook call')) {
      console.warn('[Privy] Wallet detection warning (suppressed):', error.message);
      return;
    }
    console.error('[Privy] Error:', error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

function ThemeInitializer({ children }: { children: ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const theme = stored || "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  const wrappedChildren = (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeInitializer>
    </QueryClientProvider>
  );

  if (!privyAppId) {
    console.warn("[Privy] VITE_PRIVY_APP_ID not set, Privy auth will not be available");
    return wrappedChildren;
  }

  return (
    <PrivyErrorBoundary>
      <PrivyProvider
        appId={privyAppId}
        config={{
          // Login methods - wallet first, email at bottom
          loginMethods: ["wallet", "email"],
          appearance: {
            theme: "dark",
            accentColor: "#22c55e",
            logo: undefined,
            showWalletLoginFirst: true,
            // CRITICAL: This tells Privy to only show Solana wallets, not EVM
            walletChainType: "solana-only",
            // Wallet order: Phantom first, then Jupiter, then Solflare, then others
            walletList: [
              "phantom",
              "jupiter",
              "solflare",
              "backpack",
              "detected_solana_wallets",
            ],
          },
          // Solana external wallets configuration
          externalWallets: {
            solana: {
              connectors: solanaConnectors,
            },
          },
          // Embedded wallet settings - off for now
          embeddedWallets: {
            solana: {
              createOnLogin: "off",
            },
          },
        } as any}
      >
        {wrappedChildren}
      </PrivyProvider>
    </PrivyErrorBoundary>
  );
}
