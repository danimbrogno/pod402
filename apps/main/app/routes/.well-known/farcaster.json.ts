/**
 * Dynamically generates farcaster.json based on domain name and environment variables
 *
 * Environment variables (all optional, with sensible defaults):
 * - FARCASTER_APP_NAME: Name of the app (default: "Zen Den")
 * - FARCASTER_APP_VERSION: Version of the app (default: "1")
 * - FARCASTER_TAGLINE: App tagline (default: "Find your inner peace")
 * - FARCASTER_SUBTITLE: App subtitle (default: "Your peaceful meditation space")
 * - FARCASTER_DESCRIPTION: App description (default: "Zen Den is a meditation and mindfulness app...")
 * - FARCASTER_SPLASH_BG_COLOR: Splash background color in hex (default: "#ffffff")
 * - FARCASTER_ICON_URL: Full URL to icon (default: {origin}/favicon.ico)
 * - FARCASTER_HOME_URL: Home URL (default: request origin)
 * - FARCASTER_SPLASH_IMAGE_URL: Full URL to splash image (default: {origin}/splash.png)
 * - FARCASTER_HERO_IMAGE_URL: Full URL to hero image (default: {origin}/hero.png)
 * - FARCASTER_PRIMARY_CATEGORY: Primary category (default: "health-fitness")
 * - FARCASTER_TAGS: Comma-separated tags (default: "meditation,mindfulness,wellness,peace")
 * - FARCASTER_WEBHOOK_URL: Webhook path (e.g., "/api/farcaster/webhook") - will be combined with request origin (default: empty string)
 * - FARCASTER_SCREENSHOT_URLS: Comma-separated screenshot URLs (default: empty array)
 *
 * The route automatically uses the request origin to construct URLs if not provided via env vars.
 */
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  url.protocol = 'https';
  const origin = url.origin;

  // Get environment variables with fallbacks
  const appName = process.env.FARCASTER_APP_NAME || 'Zen Den';
  const appVersion = process.env.FARCASTER_APP_VERSION || '1';
  const tagline = process.env.FARCASTER_TAGLINE || 'Find your inner peace';
  const subtitle =
    process.env.FARCASTER_SUBTITLE || 'Your peaceful meditation space';
  const description =
    process.env.FARCASTER_DESCRIPTION ||
    'Zen Den is a meditation and mindfulness app designed to help you find peace and tranquility in your daily life.';
  const splashBackgroundColor =
    process.env.FARCASTER_SPLASH_BG_COLOR || '#ffffff';
  const primaryCategory =
    process.env.FARCASTER_PRIMARY_CATEGORY || 'health-fitness';
  const tags = process.env.FARCASTER_TAGS
    ? process.env.FARCASTER_TAGS.split(',').map((tag) => tag.trim())
    : ['meditation', 'mindfulness', 'wellness', 'peace'];
  // Webhook URL: if env var is set, combine with origin; otherwise empty string
  const webhookUrl = process.env.FARCASTER_WEBHOOK_PATH
    ? `${origin}${process.env.FARCASTER_WEBHOOK_PATH.startsWith('/') ? '' : '/'}${process.env.FARCASTER_WEBHOOK_PATH}`
    : '';
  const screenshotUrls = process.env.FARCASTER_SCREENSHOT_URLS
    ? process.env.FARCASTER_SCREENSHOT_URLS.split(',')
        .map((url) => url.trim())
        .filter(Boolean)
    : [];

  // Construct URLs based on the request origin
  const iconUrl = process.env.FARCASTER_ICON_URL || `${origin}/favicon.ico`;
  const homeUrl = process.env.FARCASTER_HOME_URL || origin;
  const splashImageUrl =
    process.env.FARCASTER_SPLASH_IMAGE_URL || `${origin}/splash.png`;
  const heroImageUrl =
    process.env.FARCASTER_HERO_IMAGE_URL || `${origin}/hero.png`;

  const farcasterConfig = {
    accountAssociation: {
      header: process.env.FARCASTER_ACCOUNT_ASSOCIATION_HEADER || '',
      payload: process.env.FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD || '',
      signature: process.env.FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE || '',
    },
    frame: {
      version: appVersion,
      name: appName,
      subtitle,
      description,
      iconUrl,
      homeUrl,
      splashImageUrl,
      splashBackgroundColor,
      heroImageUrl,
      tagline,
      screenshotUrls,
      primaryCategory,
      tags,
      webhookUrl,
    },
  };

  return Response.json(farcasterConfig, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
