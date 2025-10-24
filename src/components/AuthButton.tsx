'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function AuthButton() {
  const { data, status } = useSession();

  if (status === 'loading') {
    return (
      <button className="rounded-xl border border-white/20 px-3 py-2 opacity-60">
        Checking…
      </button>
    );
  }

  const authed = !!data?.user;
  return authed ? (
    <button
      onClick={() => signOut()}
      className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10"
      title={data?.user?.email ?? ''}
    >
      Sign out
    </button>
  ) : (
    <button
      onClick={() => signIn('google')}
      className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10"
    >
      Sign in
    </button>
  );
}
