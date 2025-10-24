'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const authed = !!session?.user;

  return (
    <div className="flex items-center gap-3">
      {status === 'loading' && (
        <span className="text-xs opacity-60">Checking session…</span>
      )}

      {authed ? (
        <>
          <span className="text-sm opacity-80">
            {session.user?.name ?? 'User'}
          </span>
          <button
            className="rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          className="rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
          onClick={() => signIn('google')}
        >
          Sign in
        </button>
      )}
    </div>
  );
}
