'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useCallback } from 'react';
import toast from 'react-hot-toast';

type Activity = {
  id: string;
  createdAt: string;
  actorId: string;
  activityType: string;
  oldStatus?: string;
  newStatus?: string;
  remark?: string;
};

type Issue = {
  id: string;
  orderId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  updatedAt: string;
  assignedToId?: string;
  activities: Activity[];
};

export default function IssueDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRemark, setNewRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIssue = useCallback(async () => {
    try {
      const res = await fetch(`/api/order-issues/${id}`);
      if (res.ok) {
        setIssue(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/order-issues/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, lastUpdatedAt: issue.updatedAt }),
      });
      if (res.ok) {
        fetchIssue();
        toast.success('Status updated successfully');
      } else {
        toast.error((await res.json()).error || 'Failed to update status');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/order-issues/${id}/remarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark: newRemark }),
      });
      if (res.ok) {
        setNewRemark('');
        fetchIssue();
        toast.success('Remark added successfully');
      } else {
        toast.error((await res.json()).error || 'Failed to add remark');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading issue...</div>;
  if (!issue) return <div className="p-8 text-white">Issue not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto text-white">
      <button onClick={() => router.push('/order-issues')} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
        ← Back to Issues
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">{issue.category}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                issue.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                issue.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>{issue.priority}</span>
            </div>
            
            <h1 className="text-2xl font-semibold mb-2">{issue.title}</h1>
            <p className="text-gray-400 font-mono text-sm mb-6">Issue #{issue.id.slice(0, 8)} • Order #{issue.orderId}</p>

            <div className="bg-[#2a2a2a] p-4 rounded-xl border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Description</h3>
              <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Activity Timeline</h2>
            <div className="space-y-6">
              {issue.activities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2"></div>
                    <div className="w-0.5 h-full bg-white/10 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="text-sm text-gray-400 mb-1">
                      {new Date(activity.createdAt).toLocaleString()} • {activity.actorId === 'unassigned' ? 'System' : 'Staff'}
                    </p>
                    {activity.activityType === 'CREATED' && (
                      <p className="font-medium text-gray-200">Issue created and marked as {activity.newStatus}</p>
                    )}
                    {activity.activityType === 'STATUS_CHANGED' && (
                      <p className="font-medium text-gray-200">
                        Status changed: <span className="text-gray-400 line-through mr-1">{activity.oldStatus}</span> → <span className="text-white">{activity.newStatus}</span>
                      </p>
                    )}
                    {activity.activityType === 'REMARK_ADDED' && (
                      <div className="mt-2 bg-[#2a2a2a] p-3 rounded-lg border border-white/5 text-gray-200">
                        &quot;{activity.remark}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Add Remark</h3>
              <textarea 
                rows={3} 
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 mb-3"
                placeholder="Type your remark here..."
                value={newRemark}
                onChange={e => setNewRemark(e.target.value)}
              />
              <button 
                onClick={handleAddRemark}
                disabled={isSubmitting || !newRemark.trim()}
                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Remark'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Properties</h3>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select 
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                value={issue.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={isSubmitting || issue.status === 'CLOSED'}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING">Waiting</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Assigned To</label>
              <div className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg p-2.5 text-white cursor-not-allowed opacity-70">
                {issue.assignedToId ? 'Staff Assigned' : 'Unassigned'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
