'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, FileKey, History, Fingerprint } from 'lucide-react';

interface IntegrityMetadataProps {
    auditId: string;
    rootHash: string;
    status: 'VERIFIED' | 'COMPROMISED' | 'PENDING';
    timestamp: string;
}

export function IntegrityMetadata({ auditId, rootHash, status, timestamp }: IntegrityMetadataProps) {
    return (
        <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Lock className="h-3 w-3" /> Integrity Metadata (Immutable)
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5"><FileKey className="h-3 w-3" /> Audit ID</span>
                    <p className="font-mono font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-100">{auditId}</p>
                </div>

                <div className="space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5"><Fingerprint className="h-3 w-3" /> Root Hash (SHA-256)</span>
                    <p className="font-mono font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-100 truncate" title={rootHash}>
                        {rootHash?.substring(0, 24)}...
                    </p>
                </div>

                <div className="space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5"><History className="h-3 w-3" /> Last Verified</span>
                    <p className="font-medium text-slate-900">{new Date(timestamp).toLocaleString()}</p>
                </div>

                <div className="space-y-1">
                    <span className="text-slate-500">Ledger Status</span>
                    <div>
                        <Badge variant={status === 'COMPROMISED' ? 'destructive' : 'outline'} className={status === 'VERIFIED' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                            {status}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
