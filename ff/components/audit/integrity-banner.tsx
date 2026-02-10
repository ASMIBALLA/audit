'use client';

import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface IntegrityBannerProps {
    status: 'VERIFIED' | 'COMPROMISED' | 'PENDING';
    lastVerified?: string;
}

export function IntegrityBanner({ status, lastVerified }: IntegrityBannerProps) {
    if (status === 'COMPROMISED') {
        return (
            <Alert variant="destructive" className="border-l-4 border-l-red-600 shadow-md">
                <ShieldAlert className="h-5 w-5" />
                <AlertTitle className="font-bold text-lg">AUDIT COMPROMISED – Integrity Violation Detected</AlertTitle>
                <AlertDescription>
                    This record has failed cryptographic verification. One or more fields have been manually altered and do not match the immutable ledger.
                    {lastVerified && <div className="mt-1 text-sm opacity-90">Last Verification Attempt: {new Date(lastVerified).toLocaleString()}</div>}
                </AlertDescription>
            </Alert>
        );
    }

    if (status === 'VERIFIED') {
        return (
            <Alert className="border-l-4 border-l-green-600 bg-green-50 border-green-200 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="font-bold text-lg text-green-900">Cryptographically Verified Audit</AlertTitle>
                <AlertDescription className="text-green-800">
                    Root hash and field-level signatures are valid. The data matches the immutable audit ledger.
                    {lastVerified && <div className="mt-1 text-sm opacity-80">Verified on: {new Date(lastVerified).toLocaleString()}</div>}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Alert className="border-l-4 border-l-amber-500 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="font-bold text-amber-900">Verification Pending</AlertTitle>
            <AlertDescription className="text-amber-800">
                Integrity check is in progress or data has not yet been hashed.
            </AlertDescription>
        </Alert>
    );
}
