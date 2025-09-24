import {NextResponse} from "next/server";

export function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/ru";
  return NextResponse.redirect(url);
}

export const dynamic = "force-dynamic";
