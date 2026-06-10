import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Link } from 'wouter';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowRight, Calendar, MessageSquare, Send } from 'lucide-react';

export default function SessionHistory() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Fetch all user sessions
  const { data: sessions, isLoading: sessionsLoading } = trpc.moderation.getUserSessions.useQuery({
    limit: 100,
  });

  // Fetch responses for selected session
  const { data: responses, isLoading: responsesLoading } = trpc.moderation.getSessionResponses.useQuery(
    { sessionId: selectedSessionId || 0, limit: 500 },
    { enabled: selectedSessionId !== null }
  );

  // Fetch comments for selected session
  const { data: comments, isLoading: commentsLoading } = trpc.moderation.getComments.useQuery(
    { sessionId: selectedSessionId || 0, limit: 500 },
    { enabled: selectedSessionId !== null }
  );

  const selectedSession = useMemo(() => {
    return sessions?.find((s: any) => s.id === selectedSessionId);
  }, [sessions, selectedSessionId]);

  const stats = useMemo(() => {
    if (!responses || !comments) return null;

    const sentResponses = responses.filter((r: any) => r.status === 'sent');
    const approvedResponses = responses.filter((r: any) => r.status === 'approved');
    const pendingResponses = responses.filter((r: any) => r.status === 'pending');

    return {
      totalComments: comments.length,
      totalResponses: responses.length,
      sentResponses: sentResponses.length,
      approvedResponses: approvedResponses.length,
      pendingResponses: pendingResponses.length,
      responseRate: comments.length > 0 ? Math.round((responses.length / comments.length) * 100) : 0,
    };
  }, [responses, comments]);

  const getSessionDuration = (session: any) => {
    const start = new Date(session.createdAt);
    const end = new Date(session.updatedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Session History</h1>
          <p className="text-slate-600">View and analyze past moderation sessions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Sessions</h2>
              
              {sessionsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : !sessions || sessions.length === 0 ? (
                <p className="text-sm text-slate-500">No sessions found</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sessions.map((session: any) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSessionId === session.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {session.facebookPageId}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                          </p>
                          <Badge 
                            variant={session.isActive ? 'default' : 'outline'} 
                            className="mt-2 text-xs"
                          >
                            {session.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2">
            {!selectedSession ? (
              <Card className="p-12 text-center">
                <p className="text-slate-500">Select a session to view details</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Session Info */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Facebook Page</p>
                      <p className="text-lg font-semibold text-slate-900 mt-1">
                        {selectedSession.facebookPageId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Duration</p>
                      <p className="text-lg font-semibold text-slate-900 mt-1">
                        {getSessionDuration(selectedSession)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">Session Period</p>
                      <p className="text-sm text-slate-900 mt-1">
                        {format(new Date(selectedSession.createdAt), 'MMM d, yyyy HH:mm')} 
                        {' '} to {' '}
                        {format(new Date(selectedSession.updatedAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Statistics */}
                {stats && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-600">Total Comments</p>
                          <p className="text-2xl font-bold text-slate-900">{stats.totalComments}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Send className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-slate-600">Responses Sent</p>
                          <p className="text-2xl font-bold text-slate-900">{stats.sentResponses}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div>
                        <p className="text-xs text-slate-600">Response Rate</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.responseRate}%</p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div>
                        <p className="text-xs text-slate-600">Pending Responses</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.pendingResponses}</p>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link href={`/session/${selectedSession.id}`}>
                    <Button className="gap-2 flex-1">
                      View Session Details
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const csv = [
                        ['Timestamp', 'Response', 'Status', 'Language', 'Grounded'].join(','),
                        ...(responses || []).map((r: any) =>
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
                      a.download = `session-${selectedSession.id}-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                  >
                    Export CSV
                  </Button>
                </div>

                {/* Responses List */}
                {responsesLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <Card className="p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Recent Responses ({responses?.length || 0})
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {!responses || responses.length === 0 ? (
                        <p className="text-sm text-slate-500">No responses in this session</p>
                      ) : (
                        responses.slice(0, 10).map((response: any) => (
                          <div key={response.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-sm text-slate-900 line-clamp-2">{response.responseText}</p>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {response.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
