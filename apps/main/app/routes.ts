import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('routes/_layout.tsx', [index('routes/home/home.tsx')]),
  route('.well-known/farcaster.json', 'routes/.well-known/farcaster.json.ts'),
] satisfies RouteConfig;
