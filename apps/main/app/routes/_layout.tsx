import { Outlet } from 'react-router';
import { FarcasterHeader } from '~/components/FarcasterHeader';
import { ClientOnly } from '~/components/ClientOnly';

export default function Layout() {
  return (
    <div className="min-h-screen bg-blue-100">
      <div suppressHydrationWarning>
        <ClientOnly
          fallback={
            <header className="border-b border-gray-200 bg-white">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-lg font-semibold">Zen Den</h1>
                  <div className="text-sm text-gray-500">Loading...</div>
                </div>
              </div>
            </header>
          }
        >
          <FarcasterHeader />
        </ClientOnly>
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
