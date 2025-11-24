import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('routes/_layout.tsx', [
    index('routes/home/home.tsx'),
    route('meditation/free', 'routes/meditation/free.tsx'),
    route('meditation/paid', 'routes/meditation/paid.tsx'),
    route('meditation/result', 'routes/meditation/result.tsx'),
  ]),
  route('health', 'routes/health.ts'),
  route('.well-known/farcaster.json', 'routes/.well-known/farcaster.json.ts'),
] satisfies RouteConfig;
