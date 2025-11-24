import { Outlet, Link } from 'react-router';
import { FarcasterHeader } from '~/components/FarcasterHeader';
import { ClientOnly } from '~/components/ClientOnly';
import { MeditationAudioProvider } from '~/routes/meditation/context';
import { X402Provider } from '~/contexts/X402Context';

export default function Layout() {
  return (
    <ClientOnly
      fallback={
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-700 to-teal-800 flex items-center justify-center">
                <span className="text-white text-sm font-bold">Z</span>
              </div>
              <h1 className="text-lg font-semibold text-stone-900">Zen Den</h1>
            </Link>
            <div className="text-sm text-stone-500">Loading...</div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen flex flex-col">
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/50 shadow-sm">
          <div suppressHydrationWarning>
            <FarcasterHeader />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <X402Provider>
            <MeditationAudioProvider>
              <Outlet />
            </MeditationAudioProvider>
          </X402Provider>
        </main>
      </div>
    </ClientOnly>
  );
}
