import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Search, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type StatusFilter = 'all' | 'sent' | 'pending' | 'failed' | 'approved' | 'rejected';
type SortBy = 'newest' | 'oldest' | 'status';

export default function ResponseHistory() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch active session
  const { data: activeSession } = trpc.moderation.getActiveSession.useQuery();

  // Fetch responses for active session
  const { data: responses, isLoading: responsesLoading } = trpc.moderation.getSessionResponses.useQuery(
    { sessionId: activeSession?.id || 0, limit: 500 },
    { enabled: activeSession !== null }
  );

  // Filter and sort responses
  const filteredResponses = useMemo(() => {
    if (!responses) return [];

    let filtered = responses as any[];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r: any) => r.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.responseText?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a: any, b: any) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [responses, statusFilter, searchQuery, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = () => {
    if (!filteredResponses.length) return;

    const csv = [
      ['Timestamp', 'Response', 'Status', 'Language', 'Grounded'].join(','),
      ...filteredResponses.map((r: any) =>
        [
          new Date(r.createdAt).toISOString(),
          `"${r.responseText?.replace(/"/g, '""') || ''}"`,
          r.status,
          r.responseLanguage || 'Unknown',
          r.isGroundedInContext ? 'Yes' : 'No'
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Active Session</h2>
          <p className="text-slate-600">Start a moderation session to view response history.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Response History</h1>
          <p className="text-slate-600">View and manage all generated responses</p>
        </div>

        {/* Session Info */}
        <Card className="mb-6 p-6 bg-blue-50 border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-700">Active Session</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {activeSession.facebookPageId}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Started {formatDistanceToNow(new Date(activeSession.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Filters */}
        <Card className="mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search responses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortBy)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {responsesLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : filteredResponses.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-500">No responses found</p>
            </Card>
          ) : (
            <>
              <div className="text-sm text-slate-600 mb-4">
                Showing {filteredResponses.length} of {responses?.length || 0} responses
              </div>
              {filteredResponses.map((response: any) => (
                <Card key={response.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Response Text */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Response</h3>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-slate-600 text-sm">
                          {response.responseText}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Details</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Status:</span>
                          <Badge className={getStatusColor(response.status || '')}>
                            {response.status || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Language:</span>
                          <Badge variant="outline">{response.responseLanguage}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Grounded:</span>
                          <Badge variant={response.isGroundedInContext ? 'default' : 'destructive'}>
                            {response.isGroundedInContext ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 pt-2">
                          {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
