export function getTokenFromRequest(request: Request): string | null {
  const header = request.headers.get('x-lab-token');
  if (header) {
    return header;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get('token');
  return query;
}

export function requireDatasetLabToken(request: Request): Response | null {
  const expected = process.env.DATASET_LAB_TOKEN;
  if (!expected || expected.trim().length === 0) {
    return Response.json(
      {
        error:
          'DATASET_LAB_TOKEN is not configured. Set it in your environment.',
      },
      { status: 500 },
    );
  }

  const token = getTokenFromRequest(request);
  if (token !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
