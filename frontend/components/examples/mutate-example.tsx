// components/user-like-button.tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function UserLikeButton({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${userId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to like');
      return res.json();
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['users'] });
      const prev = qc.getQueryData<any[]>(['users']);
      qc.setQueryData(['users'], (old: any[] = []) =>
        old.map((u) =>
          u.id === userId ? { ...u, likes: (u.likes ?? 0) + 1 } : u
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) =>
      ctx?.prev && qc.setQueryData(['users'], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return <button onClick={() => likeMutation.mutate()}>Like</button>;
}
