import type { ReactNode } from "react";
import { useState, useEffect } from "react";

interface Props {
  children(): ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: Props) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? <>{children()}</> : <>{fallback}</>;
}
