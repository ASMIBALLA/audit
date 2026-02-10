'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';

interface TamperEvent {
    detected_at: string;
    field: string;
    stored_hash: string;
    recalculated_hash: string;
    severity: string;
    source?: string;
}

interface IntegrityLogProps {
    events: TamperEvent[];
}

export function IntegrityLog({ events }: IntegrityLogProps) {
    if (!events || events.length === 0) return null;

    return (
        <Card className="border-red-200 shadow-sm mt-6">
            <CardHeader className="bg-red-50/50 border-b border-red-100 pb-3">
                <CardTitle className="text-base text-red-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Audit Integrity Events (Immutable Log)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[180px]">Timestamp (UTC)</TableHead>
                            <TableHead>Field Modified</TableHead>
                            <TableHead>Hash Mismatch Evidence</TableHead>
                            <TableHead className="w-[100px]">Severity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map((event, idx) => (
                            <TableRow key={idx} className="bg-red-50/10 hover:bg-red-50/20">
                                <TableCell className="font-mono text-xs text-slate-600">
                                    {new Date(event.detected_at).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-semibold text-red-800">{event.field}</TableCell>
                                <TableCell className="font-mono text-xs">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-green-700">Stored: {event.stored_hash.substring(0, 16)}...</span>
                                        <span className="text-red-600">Actual: {event.recalculated_hash.substring(0, 16)}...</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        {event.severity}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
