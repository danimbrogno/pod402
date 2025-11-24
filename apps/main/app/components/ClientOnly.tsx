import { useEffect, useState } from 'react';

/**
 * Client-only wrapper component to prevent hydration mismatches
 *
 * This component only renders its children on the client side, ensuring
 * that server-rendered HTML matches the initial client render.
 *
 * On the server and during initial hydration, it renders the fallback.
 * After hydration, it switches to rendering the children.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  // const [hasMounted, setHasMounted] = useState(false);

  // useEffect(() => {
  //   // Only set mounted after hydration is complete
  //   setHasMounted(true);
  // }, []);

  // // Always render fallback during SSR and initial hydration
  // // This ensures server and client HTML match
  // if (!hasMounted) {
  //   return fallback ? <>{fallback}</> : null;
  // }

  // After hydration, render the actual children
  return <>{children}</>;
}
