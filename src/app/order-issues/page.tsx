'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { Search, Plus, ChevronRight } from 'lucide-react';

type Issue = {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  trackingId?: string;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.set('q', searchTerm);
      if (statusFilter) query.set('status', statusFilter);
      query.set('page', page.toString());
      query.set('pageSize', '15');

      const res = await fetch(`/api/order-issues?${query.toString()}`);
      const data = await res.json();
      if (data && Array.isArray(data.issues)) {
        setIssues(data.issues);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        // Fallback for older API versions
        setIssues(data);
        setTotalPages(1);
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
  }, [searchTerm, statusFilter, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchIssues();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchIssues]);

  const executeDelete = async () => {
    if (!issueToDelete || isDeleting) return;
    setIsDeleting(true);
    console.log('[OrderIssues] executeDelete fired for', issueToDelete);

    try {
      const res = await fetch(`/api/order-issues/${issueToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Issue deleted successfully');
        setDeleteModalOpen(false);
        fetchIssues();
      } else {
        toast.error('Failed to delete issue');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIssueToDelete(null);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 relative z-10">
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Order Issue"
        message="Are you sure you want to delete this order issue? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setIssueToDelete(null);
        }}
      />

      <header className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Order Issues</h1>
          <p className="text-neutral-400 text-sm md:text-base">Manage and track customer order issues</p>
        </div>
        <Link
          href="/order-issues/new"
          className="inline-flex items-center justify-center px-6 py-3 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all gap-2 w-full md:w-auto"
        >
          <Plus size={16} />
          <span>Create Issue</span>
        </Link>
      </header>

      {/* Summary Cards */}
      <div className="flex-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-sm text-white">
          <p className="text-sm text-neutral-400 mb-1">Open</p>
          <p className="text-3xl font-medium">{issues.filter(i => i.status === 'OPEN').length}</p>
        </div>
        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-sm text-white">
          <p className="text-sm text-neutral-400 mb-1">In Progress</p>
          <p className="text-3xl font-medium">{issues.filter(i => i.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-sm text-white">
          <p className="text-sm text-neutral-400 mb-1">Waiting</p>
          <p className="text-3xl font-medium">{issues.filter(i => i.status === 'WAITING').length}</p>
        </div>
        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-sm text-white">
          <p className="text-sm text-neutral-400 mb-1">Urgent</p>
          <p className="text-3xl font-medium text-red-400">{issues.filter(i => i.priority === 'URGENT').length}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="flex-none p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-black/50">
          <h2 className="text-xl font-semibold text-white tracking-tight">Issues List</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none pr-10 relative cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255, 255, 255, 0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1em 1em'
              }}
            >
              <option value="" className="bg-neutral-900">All Statuses</option>
              <option value="OPEN" className="bg-neutral-900">Open</option>
              <option value="IN_PROGRESS" className="bg-neutral-900">In Progress</option>
              <option value="WAITING" className="bg-neutral-900">Waiting</option>
              <option value="RESOLVED" className="bg-neutral-900">Resolved</option>
              <option value="CLOSED" className="bg-neutral-900">Closed</option>
              <option value="CANCELLED" className="bg-neutral-900">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-neutral-400">Loading issues...</div>
        ) : (
          <div className="flex-1 min-h-0 relative z-10 w-full overflow-auto no-scrollbar">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="sticky top-0 text-xs text-neutral-400 uppercase tracking-wider bg-neutral-950/80 backdrop-blur-md border-b border-white/5 z-20 shadow-sm">
                <tr>
                  <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Issue ID</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Order Details</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Customer Details</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Title</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-center">Priority</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-center">Status</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Created At</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 md:px-8 py-10 md:py-20 text-center text-neutral-400">
                      There are currently no unresolved order issues.
                    </td>
                  </tr>
                ) : (
                  issues.map(issue => (
                    <tr
                      key={issue.id}
                      className="hover:bg-white/[0.03] transition-colors duration-200 group"
                    >
                      <td className="px-4 md:px-8 py-4 md:py-5 font-mono text-xs text-neutral-500">#{issue.id.slice(0, 8)}</td>
                      <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-white">
                        <div>{issue.orderNumber || issue.orderId}</div>
                        {issue.trackingId && <div className="text-xs text-neutral-400 mt-1 font-normal">Track: {issue.trackingId}</div>}
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-neutral-300">
                        <div className="text-sm font-medium">{issue.customerName || 'N/A'}</div>
                        <div className="text-xs text-neutral-500 mt-1">{issue.customerEmail || 'No email'}</div>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-neutral-300">{issue.title}</td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${issue.priority === 'URGENT' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          issue.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${issue.status === 'OPEN' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          issue.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-white/5 text-neutral-400 border border-white/10'
                          }`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-neutral-400">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                        <button
                          onClick={() => router.push(`/order-issues/${issue.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/10 bg-white/5 text-white rounded-lg hover:bg-white/10 text-xs font-medium transition-all"
                        >
                          View <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex-none p-4 md:px-8 py-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm bg-black/50">
            <div className="text-neutral-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 text-white rounded-lg transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 text-white rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
