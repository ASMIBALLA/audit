'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, RefreshCw, TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
    total_co2_kg: number;
    total_distance_km: number;
    avg_confidence_score: number;
    total_trips: number;
    top_offender: string;
    last_updated: string | null;
}

interface ExecutiveDashboardProps {
    onDataProcessed: () => void;
}

export default function ExecutiveDashboard({ onDataProcessed }: ExecutiveDashboardProps) {
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8001/intelligence/dashboard-stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Failed to fetch stats", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRunAudit = async () => {
        setProcessing(true);
        try {
            await fetch('http://localhost:8001/automation/process-all-data', { method: 'POST' });
            await fetchStats();
            onDataProcessed(); // Notify parent
        } catch (err) {
            console.error("Audit failed", err);
        } finally {
            setProcessing(false);
        }
    };

    // Mock data for chart (if not enough real data for meaningful chart)
    const chartData = [
        { name: 'EcoLogistics', emissions: 450, distance: 1200 },
        { name: 'RapidMovers', emissions: 320, distance: 800 },
        { name: 'GreenFreight', emissions: 150, distance: 950 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Executive Sustainability Audit</h2>
                    <p className="text-slate-500">Real-time Scope 3 intelligence and verification.</p>
                </div>
                <div className="flex items-center gap-2">
                    {stats?.last_updated && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live Audit: {stats.last_updated}
                        </div>
                    )}
                    <Button onClick={handleRunAudit} disabled={processing} className="bg-slate-900 text-white hover:bg-slate-800">
                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        {processing ? 'Running Audit...' : 'Run Live Audit'}
                    </Button>
                </div>
            </div>

            {stats ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total CO2e Audited</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_co2_kg.toLocaleString()} kg</div>
                            <p className="text-xs text-muted-foreground">Across {stats.total_trips} trips</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Confidence Score</CardTitle>
                            <ShieldCheck className={`h-4 w-4 ${stats.avg_confidence_score > 0.8 ? 'text-green-600' : 'text-yellow-600'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{(stats.avg_confidence_score * 100).toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">Based on GPS density & gaps</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                            <Activity className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_distance_km.toLocaleString()} km</div>
                            <p className="text-xs text-muted-foreground">Verified GPS Distance</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Top Offender</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold truncate" title={stats.top_offender}>{stats.top_offender}</div>
                            <p className="text-xs text-muted-foreground">Highest aggregate emissions</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="p-10 text-center border-dashed border-2 rounded-lg bg-slate-50">
                    <p className="text-slate-500">No audit data available. Run a live audit to generate intelligence.</p>
                </div>
            )}

            {/* Chart Section */}
            <Card className="col-span-4 shadow-md border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">Emission Intensity vs. Distance</CardTitle>
                    <CardDescription>
                        Compare carbon efficiency: <span className="font-medium text-slate-900">Total Emissions (kg)</span> against <span className="font-medium text-blue-600">Distance Traveled (km)</span>. Lower emissions relative to distance indicates better efficiency.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                    <div className="h-[350px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0.6} />
                                    </linearGradient>
                                    <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl ring-1 ring-black/5">
                                                    <p className="font-bold text-slate-900 mb-2">{label}</p>
                                                    <div className="space-y-1">
                                                        {payload.map((entry: any, index: number) => (
                                                            <div key={index} className="flex items-center gap-2 text-sm">
                                                                <div
                                                                    className="w-2 h-2 rounded-full"
                                                                    style={{ backgroundColor: entry.fill === 'url(#colorEmissions)' ? '#0f172a' : '#3b82f6' }}
                                                                />
                                                                <span className="text-slate-500 capitalize">{entry.name}:</span>
                                                                <span className="font-mono font-medium text-slate-900">
                                                                    {entry.value.toLocaleString()} {entry.name.includes('Emissions') ? 'kg' : 'km'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="emissions"
                                    fill="url(#colorEmissions)"
                                    radius={[6, 6, 0, 0]}
                                    name="Emissions"
                                    barSize={40}
                                />
                                <Bar
                                    dataKey="distance"
                                    fill="url(#colorDistance)"
                                    radius={[6, 6, 0, 0]}
                                    name="Distance"
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
