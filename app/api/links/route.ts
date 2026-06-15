import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  await req.json()
  return Response.json({ slug: 'test' })
}
