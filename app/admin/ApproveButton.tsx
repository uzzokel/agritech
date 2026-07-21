// components/ApproveButton.tsx
'use client';

import { useState } from 'react';
import { approveUser } from '@/app/actions/user';

export function ApproveButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approveUser(userId);
    setLoading(false);

    if (result.success) {
      alert('User approved! Unique ID sent to email.');
    } else {
      alert('Failed to approve user.');
    }
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? 'Approving...' : 'Approve User'}
    </button>
  );
}