// src/components/AuthButton.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthButton() {
  const { data: session } = useSession();
  const authed = !!session?.user;

  return authed ? (
    <button className="text-sm opacity-80 hover:opacity-100" onClick={() => signOut()}>
      Sign out
    </button>
  ) : (
    <button className="text-sm opacity-80 hover:opacity-100" onClick={() => signIn('google')}>
      Sign in
    </button>
  );
}
