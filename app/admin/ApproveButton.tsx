'use client';

import { useState } from 'react';
import { updateUserStatus } from '@/app/actions/admin-actions';
import { Status } from '@prisma/client';

export function ApproveButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await updateUserStatus(userId, Status.APPROVED);
    setLoading(false);

    if (result.success) {
      alert('User approved! Unique AGRI-ID and Security PIN sent via email.');
    } else {
      alert(result.error || 'Failed to approve user.');
    }
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Approving...' : 'Approve User'}
    </button>
  );
}