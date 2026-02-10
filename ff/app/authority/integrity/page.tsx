'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lock, ShieldAlert, CheckCircle, Search } from 'lucide-react';
import { IntegrityLog } from '@/components/audit/integrity-log';

export default function AuthorityPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ compromised: 0, secure: 0 });

    useEffect(() => {
        const fetchIntegrityEvents = async () => {
            try {
                const res = await fetch('http://localhost:8001/authority/integrity-events');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.events || []);
                    // Simple stat calculation (mock for now, as backend returns all events)
                    setStats({
                        compromised: data.event_count > 0 ? 1 : 0, // Simplified logic
                        secure: 100 // Mock count
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchIntegrityEvents();
    }, []);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold tracking-wider uppercase">
                    <Lock className="h-4 w-4" /> Regulatory Compliance View
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Audit Integrity Dashboard</h1>
                <p className="text-slate-600 max-w-2xl">
                    This interface provides a read-only, immutable view of all data integrity violations detected across the platform.
                    It is designed for use by regulatory bodies and external auditors.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-red-50 border-red-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" /> Integrity Violations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-900">{events.length}</div>
                        <p className="text-xs text-red-700">Tamper events logged permanently</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> System Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {events.length > 0 ? (
                            <Badge variant="destructive" className="text-sm">COMPROMISED</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm">SECURE</Badge>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Real-time hash verification active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <Search className="h-4 w-4" /> Audit Scope
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">Global</div>
                        <p className="text-xs text-slate-500">Monitoring all Supply Chain Nodes</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-slate-500" />
                        Immutable Event Ledger
                    </h2>
                    <Badge variant="outline">Read-Only Access</Badge>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading ledger...</div>
                ) : (
                    <IntegrityLog events={events} />
                )}
            </div>
        </div>
    );
}
