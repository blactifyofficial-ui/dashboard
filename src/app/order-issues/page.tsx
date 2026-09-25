'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';

type Issue = {
  id: string;
  orderId: string;
  orderNumber?: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
};

export default function OrderIssuesDashboard() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.set('q', searchTerm);
      if (statusFilter) query.set('status', statusFilter);

      const res = await fetch(`/api/order-issues?${query.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setIssues(data);
      } else {
        console.error('Failed to fetch issues:', data);
        setIssues([]);
      }
    } catch (e) {
      console.error(e);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchIssues();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchIssues, searchTerm, statusFilter]);

  const initiateDelete = (id: string) => {
    setIssueToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!issueToDelete) return;
    setDeleteModalOpen(false);

    try {
      const res = await fetch(`/api/order-issues/${issueToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Issue deleted successfully');
        fetchIssues();
      } else {
        toast.error('Failed to delete issue');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIssueToDelete(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-black">
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Order Issue"
        message="Are you sure you want to delete this order issue? This action cannot be undone."
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setIssueToDelete(null);
        }}
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Order Issues Dashboard</h1>
        <Link
          href="/order-issues/new"
          className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-gray-200 transition-colors"
        >
          + Create Issue
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white">
          <p className="text-sm text-gray-400 mb-1">Open</p>
          <p className="text-3xl font-medium">{issues.filter(i => i.status === 'OPEN').length}</p>
        </div>
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white">
          <p className="text-sm text-gray-400 mb-1">In Progress</p>
          <p className="text-3xl font-medium">{issues.filter(i => i.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white">
          <p className="text-sm text-gray-400 mb-1">Waiting</p>
          <p className="text-3xl font-medium">{issues.filter(i => i.status === 'WAITING').length}</p>
        </div>
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white">
          <p className="text-sm text-gray-400 mb-1">Urgent</p>
          <p className="text-3xl font-medium text-red-500">{issues.filter(i => i.priority === 'URGENT').length}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search issues, orders..."
          className="bg-[#1e1e1e] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 w-full md:w-80"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="bg-[#1e1e1e] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING">Waiting</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl border border-white/10 overflow-hidden text-white">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">There are currently no unresolved order issues.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#2a2a2a] border-b border-white/10">
                <tr>
                  <th className="p-4 font-medium text-gray-300">Issue ID</th>
                  <th className="p-4 font-medium text-gray-300">Order</th>
                  <th className="p-4 font-medium text-gray-300">Title</th>
                  <th className="p-4 font-medium text-gray-300">Priority</th>
                  <th className="p-4 font-medium text-gray-300">Status</th>
                  <th className="p-4 font-medium text-gray-300">Created At</th>
                  <th className="p-4 font-medium text-gray-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {issues.map(issue => (
                  <tr
                    key={issue.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm text-gray-400">#{issue.id.slice(0, 8)}</td>
                    <td className="p-4">{issue.orderNumber || issue.orderId}</td>
                    <td className="p-4 font-medium">{issue.title}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${issue.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                          issue.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>
                        {issue.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${issue.status === 'OPEN' ? 'bg-green-500/20 text-green-400' :
                          issue.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                        }`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/order-issues/${issue.id}`)}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => initiateDelete(issue.id)}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded text-sm transition-colors"
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
