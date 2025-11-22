import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { sdk } from '@farcaster/miniapp-sdk';
import { Root } from './routes/root';
import { Home } from './routes/home';
import { About } from './routes/about';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'about',
        element: <About />,
      },
    ],
  },
]);

// Initialize the app
async function init() {
  const root = createRoot(document.getElementById('root')!);
  
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );

  // Hide the splash screen once the app is ready
  await sdk.actions.ready();
}

init();
