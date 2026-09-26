export const dynamic = 'force-dynamic';

const globalSessions = global as typeof globalThis & { cameraSessions?: Record<string, string> };
if (!globalSessions.cameraSessions) {
  globalSessions.cameraSessions = {};
}

export async function POST(req: Request) {
  try {
    const { sessionId, url } = await req.json();
    if (!sessionId || !url) return Response.json({ error: 'Missing data' }, { status: 400 });
    
    globalSessions.cameraSessions[sessionId] = url;
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('id');
  if (!sessionId) return Response.json({ error: 'Missing ID' }, { status: 400 });
  
  const resultUrl = globalSessions.cameraSessions[sessionId] || null;
  return Response.json({ url: resultUrl });
}
