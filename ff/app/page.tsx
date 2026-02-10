'use client';

import { useState } from 'react';
import ExecutiveDashboard from '@/components/executive-dashboard';
import SupplierLeaderboard from '@/components/supplier-leaderboard';
import TripAuditViewer from '@/components/trip-audit-viewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [dataProcessed, setDataProcessed] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header (Simplified as Dashboard has its own header) */}

        {/* Dashboard Section */}
        <section className="mb-8 space-y-6">
          <ExecutiveDashboard onDataProcessed={() => setDataProcessed(true)} />
        </section>

        {/* Detailed Intelligence Tabs */}
        <div className="space-y-6">
          <Tabs defaultValue="leaderboard" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Deep Dive Intelligence</h3>
              <TabsList>
                <TabsTrigger value="leaderboard">Supplier Leaderboard</TabsTrigger>
                <TabsTrigger value="audit">Trip Audit & Verification</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-slate-900">Supplier Emission Rankings</CardTitle>
                  <CardDescription>
                    Performance benchmarking based on carbon intensity per km.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SupplierLeaderboard />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-slate-900">Trip Audit & Certificate Generator</CardTitle>
                  <CardDescription>
                    Generate verifiable audit logs for compliance reporting.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TripAuditViewer />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
