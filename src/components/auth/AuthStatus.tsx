'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return <div>Loading auth...</div>;
  
  if (status === 'loading') {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }
  
  if (status === 'authenticated' && session?.user) {
    return (
      <div className="text-sm text-green-600">
        Signed in as {session.user.email}
      </div>
    );
  }
  
  return <div className="text-sm text-red-500">Not signed in</div>;
}
