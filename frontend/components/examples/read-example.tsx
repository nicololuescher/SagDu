'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchUsers() {
  const res = await fetch('/api/users', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

export default function UsersPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) return <div>Loading…</div>;
  if (isError) return <div>Couldn’t load users</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {data.map((u: any) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}
