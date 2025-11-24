import { createBrowserRouter } from 'react-router';
import { Root } from './routes/root';
import { Home } from './routes/home';

export const routes = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [{ index: true, Component: Home }],
  },
]);
