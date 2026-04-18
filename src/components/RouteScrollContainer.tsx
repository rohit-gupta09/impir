import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

type RouteScrollContainerProps = {
  className?: string;
};

export function RouteScrollContainer({ className }: RouteScrollContainerProps) {
  const location = useLocation();
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return (
    <main ref={containerRef} className={className}>
      <Outlet />
    </main>
  );
}
