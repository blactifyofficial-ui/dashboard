import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const shop = url.searchParams.get('shop');

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!code || !shop || !clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing parameters or environment variables' }, { status: 400 });
  }

  try {
    // Exchange the authorization code for an access token
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; padding: 2rem;">
            <h1>Success!</h1>
            <p>Your Admin API Access Token is:</p>
            <textarea readonly style="width: 100%; height: 100px; font-size: 16px;">${data.access_token}</textarea>
            <p><strong>Copy this token and replace the SHOPIFY_ADMIN_ACCESS_TOKEN in your .env.local file with it!</strong></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    } else {
      return NextResponse.json({ error: 'Failed to get access token', details: data }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
