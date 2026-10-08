'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';

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
  const { hasPermission } = useAuth();
  const canViewIssues = hasPermission('issues:view');
  const canCreateIssues = hasPermission('issues:create');

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchIssues = useCallback(async () => {
    setIsFetching(true);
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
      setIsFetching(false);
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

  if (!canViewIssues) {
    return <AccessDenied message="You do not have permission to view order issues." />;
  }

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

      <header className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Order Issues</h1>
          <p className="text-neutral-400 text-xs sm:text-sm md:text-base">Manage and track customer order issues</p>
        </div>
        {canCreateIssues && (
          <Link
            href="/order-issues/new"
            className="inline-flex items-center justify-center px-4 py-2 min-h-[40px] border border-neutral-800 bg-white text-black rounded-lg hover:bg-neutral-200 text-xs font-semibold transition-colors gap-1.5 w-full md:w-auto"
          >
            <Plus size={15} />
            <span>Create Issue</span>
          </Link>
        )}
      </header>

      {/* Summary Cards */}
      <div className="flex-none grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900/60 p-4 sm:p-5 rounded-xl border border-neutral-800 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">Open</p>
          <p className="text-2xl font-bold">{issues.filter(i => i.status === 'OPEN').length}</p>
        </div>
        <div className="bg-neutral-900/60 p-4 sm:p-5 rounded-xl border border-neutral-800 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">In Progress</p>
          <p className="text-2xl font-bold">{issues.filter(i => i.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="bg-neutral-900/60 p-4 sm:p-5 rounded-xl border border-neutral-800 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">Waiting</p>
          <p className="text-2xl font-bold">{issues.filter(i => i.status === 'WAITING').length}</p>
        </div>
        <div className="bg-neutral-900/60 p-4 sm:p-5 rounded-xl border border-neutral-800 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">Urgent</p>
          <p className="text-2xl font-bold text-rose-400">{issues.filter(i => i.priority === 'URGENT').length}</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="flex-none p-4 md:px-6 md:py-4 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-neutral-900/80">
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">Issues List</h2>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 pr-3.5 py-1.5 min-h-[38px] w-full bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 min-h-[38px] bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors appearance-none pr-8 cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255, 255, 255, 0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
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

          <div className={`flex-1 min-h-0 w-full overflow-auto no-scrollbar transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="sticky top-0 text-[11px] text-neutral-400 uppercase tracking-wider bg-neutral-900 border-b border-neutral-800 z-20">
                <tr>
                  <th className="px-4 md:px-6 py-3 font-semibold">Issue ID</th>
                  <th className="px-4 md:px-6 py-3 font-semibold">Order Details</th>
                  <th className="px-4 md:px-6 py-3 font-semibold">Customer Details</th>
                  <th className="px-4 md:px-6 py-3 font-semibold">Title</th>
                  <th className="px-4 md:px-6 py-3 font-semibold text-center">Priority</th>
                  <th className="px-4 md:px-6 py-3 font-semibold text-center">Status</th>
                  <th className="px-4 md:px-6 py-3 font-semibold">Created At</th>
                  <th className="px-4 md:px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 md:px-6 py-12 text-center text-neutral-500 text-sm">
                      There are currently no unresolved order issues.
                    </td>
                  </tr>
                ) : (
                  issues.map(issue => (
                    <tr
                      key={issue.id}
                      className="hover:bg-neutral-800/30 transition-colors group"
                    >
                      <td className="px-4 md:px-6 py-3.5 font-mono text-xs text-neutral-500">#{issue.id.slice(0, 8)}</td>
                      <td className="px-4 md:px-6 py-3.5 font-medium text-white">
                        <div>{issue.orderNumber || issue.orderId}</div>
                        {issue.trackingId && <div className="text-xs text-neutral-400 mt-0.5 font-normal">Track: {issue.trackingId}</div>}
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-neutral-300">
                        <div className="text-sm font-medium">{issue.customerName || 'N/A'}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{issue.customerEmail || 'No email'}</div>
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-neutral-300">{issue.title}</td>
                      <td className="px-4 md:px-6 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          issue.priority === 'URGENT' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                          issue.priority === 'HIGH' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                          'bg-neutral-800 text-neutral-300 border border-neutral-700'
                        }`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          issue.status === 'OPEN' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                          issue.status === 'IN_PROGRESS' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                          'bg-neutral-800 text-neutral-300 border border-neutral-700'
                        }`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-neutral-400 text-xs">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-right">
                        <button
                          onClick={() => router.push(`/order-issues/${issue.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[30px] border border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 rounded-md text-xs font-medium transition-colors"
                        >
                          View <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        {totalPages > 1 && (
          <div className="flex-none p-4 md:px-6 py-3 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-neutral-900/80">
            <div className="text-neutral-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 min-h-[32px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 disabled:opacity-30 text-white rounded-lg transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 min-h-[32px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 disabled:opacity-30 text-white rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      )}

    </div>
  );
}
