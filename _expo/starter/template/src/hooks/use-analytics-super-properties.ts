import { useEffect } from "react";

import { config } from "@/constants/config";
import { useEntitlement } from "@/features/paywall/hooks/use-entitlement";
import { registerSuperProperties, setPersonProperties } from "@/lib/analytics";

export function useAnalyticsSuperProperties(): void {
  const { isPro, isLoading } = useEntitlement();
  useEffect(() => {
    registerSuperProperties({ env: config.env });
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    registerSuperProperties({ is_pro: isPro });
    setPersonProperties({ is_pro: isPro });
  }, [isPro, isLoading]);
}
