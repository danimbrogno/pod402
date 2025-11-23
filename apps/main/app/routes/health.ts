/**
 * Health check endpoint for Docker healthchecks
 */
export async function loader() {
  return Response.json(
    { status: 'ok', timestamp: Date.now() },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

