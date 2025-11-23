import { Outlet } from 'react-router';
import { FarcasterHeader } from '~/components/FarcasterHeader';
import { ClientOnly } from '~/components/ClientOnly';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/50 shadow-sm">
        <div suppressHydrationWarning>
          <ClientOnly
            fallback={
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-lg font-semibold text-stone-900">Zen Den</h1>
                  <div className="text-sm text-stone-500">Loading...</div>
                </div>
              </div>
            }
          >
            <FarcasterHeader />
          </ClientOnly>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
