import { type LoaderFunctionArgs } from '@remix-run/cloudflare';

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
  // Get environment variables from multiple sources
  const alfredAppname =
    process.env.ALFRED_APPNAME ||
    (context?.cloudflare?.env as Record<string, any>)?.ALFRED_APPNAME ||
    (context as any)?.env?.ALFRED_APPNAME ||
    'bolt'; // fallback for development
  const alfredLabel =
    process.env.ALFRED_LABEL ||
    (context?.cloudflare?.env as Record<string, any>)?.ALFRED_LABEL ||
    (context as any)?.env?.ALFRED_LABEL ||
    'default'; // fallback for development

  // Parse the segment parameter (expected format: "appname-label")
  const segment = params.segment;
  const expectedSegment = `${alfredAppname}-${alfredLabel}`;

  // Verify that the request matches the expected environment variable values
  if (alfredAppname && alfredLabel && segment === expectedSegment) {
    return new Response('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // If environment variables are not set or don't match, return 404
  return new Response('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};
