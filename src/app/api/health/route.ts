import {NextResponse} from 'next/server';

export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = '/ru';
  return NextResponse.redirect(url);
}

