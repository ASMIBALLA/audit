'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, CheckCircle, AlertTriangle, Shield, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IntegrityBanner } from './audit/integrity-banner';
import { IntegrityMetadata } from './audit/integrity-metadata';
import { IntegrityLog } from './audit/integrity-log';

// Extend jsPDF type to include autoTable (workaround for TypeScript if types missing)
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
}

export default function TripAuditViewer() {
  const [tripId, setTripId] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [error, setError] = useState('');
  const [availableTrips, setAvailableTrips] = useState<string[]>([]);

  // Chaos Engineering State
  const [showTamper, setShowTamper] = useState(false);
  const [tamperField, setTamperField] = useState('total_trip_emissions_kg_co2e');
  const [tamperValue, setTamperValue] = useState('');

  useEffect(() => {
    // Fetch available trips when component mounts
    const fetchTrips = async () => {
      try {
        const response = await fetch('http://localhost:8001/audit/list-trips');
        if (response.ok) {
          const data = await response.json();
          setAvailableTrips(data.trips || []);
        }
      } catch (err) {
        console.error("Failed to fetch trip list", err);
      }
    };
    fetchTrips();
  }, []);

  const fetchAuditReport = async (id?: string) => {
    const targetId = id || tripId;
    if (!targetId) return;

    setLoading(true);
    setError('');
    setAuditData(null);
    setTripId(targetId);

    try {
      const response = await fetch(`http://localhost:8001/audit/trip-report/${targetId}`);
      if (!response.ok) {
        throw new Error('Audit record not found');
      }
      const data = await response.json();
      setAuditData(data);
    } catch (err) {
      setError('Trip ID not found in audit logs. Ensure you have processed data first.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!auditData) return;

    const doc = new jsPDF() as jsPDFWithAutoTable;

    // Header
    doc.setFontSize(20);
    doc.text('Scope 3 Carbon Audit Certificate', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Audit ID: ${auditData.audit_id || 'N/A'}`, 14, 30);
    doc.text(`Date Verified: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Data Hash (SHA-256): ${auditData.data_hash?.substring(0, 20)}...`, 14, 40);

    // Confidence Section
    doc.setDrawColor(0, 128, 0);
    doc.setLineWidth(1);
    doc.line(14, 45, 196, 45);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Verification Summary', 14, 55);

    doc.setFontSize(11);
    doc.text(`Supplier: ${auditData.supplier_id}`, 14, 65);
    doc.text(`Vehicle: ${auditData.vehicle_type} (${auditData.vehicle_id})`, 14, 72);
    doc.text(`Total Distance: ${auditData.total_trip_distance_km} km`, 14, 79);
    doc.text(`Total Emissions: ${auditData.total_trip_emissions_kg_co2e} kg CO2e`, 14, 86);
    doc.text(`Confidence Score: ${(auditData.confidence_score * 100).toFixed(1)}%`, 14, 93);

    // Methodology
    doc.setFontSize(12);
    doc.text('Methodology', 14, 110);
    doc.setFontSize(9);
    doc.setTextColor(80);
    const splitText = doc.splitTextToSize(auditData.methodology || "No methodology text.", 180);
    doc.text(splitText, 14, 118);

    // Table
    const tableStartY = 118 + splitText.length * 4 + 10;

    autoTable(doc, {
      startY: tableStartY,
      head: [['Timestamp (UTC)', 'Segment Dist (km)', 'Segment CO2 (kg)']],
      body: auditData.segments.map((s: any) => [
        new Date(s.from_timestamp).toLocaleTimeString(),
        s.distance_km,
        s.emissions_kg_co2e
      ]),
    });

    // Recommendations (if any)
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    if (auditData.recommendations?.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Reduction Recommendations', 14, finalY);
      finalY += 8;
      doc.setFontSize(10);
      auditData.recommendations.forEach((rec: any) => {
        doc.text(`- ${rec.type}: ${rec.rationale} (Potential -${rec.potential_reduction_pct}%)`, 14, finalY);
        finalY += 6;
      });
    }

    // Integrity Check
    if (auditData.integrity_status === 'COMPROMISED') {
      doc.setTextColor(220, 38, 38); // Red
      doc.setFontSize(16);
      doc.text('⚠️ AUDIT INTEGRITY COMPROMISED', 14, 15);
      doc.setTextColor(0);

      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(2);
      doc.rect(10, 10, 190, 277); // Border

      // Add tamper details
      if (auditData.tamper_evidence?.length > 0) {
        let tamperY = (doc as any).lastAutoTable?.finalY || 180;
        tamperY += 20;
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 38);
        doc.text('Tamper Evidence Log', 14, tamperY);
        tamperY += 10;

        doc.setFontSize(10);
        doc.setTextColor(0);
        auditData.tamper_evidence.forEach((ev: any) => {
          doc.text(`- Modified Field: ${ev.field}`, 14, tamperY);
          doc.text(`  Recorded Hash: ${ev.stored_hash.substring(0, 15)}...`, 14, tamperY + 5);
          doc.text(`  Actual Hash:   ${ev.recalculated_hash.substring(0, 15)}...`, 14, tamperY + 10);
          tamperY += 20;
        });
      }
    }


    doc.save(`audit_cert_${tripId}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* ... (search bar remains same) ... */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Enter Trip ID (e.g., TRIP_A1)"
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => fetchAuditReport()} disabled={loading}>
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Verify Audit'}
        </Button>
      </div>

      {/* 🛠️ Chaos / Tamper Tools (Simulation) */}
      <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTamper(!showTamper)}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span>Simulation: Chaos Engineering</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500">
            {showTamper ? 'Hide Tools' : 'Show Tamper Tools'}
          </Button>
        </div>

        {showTamper && (
          <div className="mt-3 flex gap-2 items-end animate-in slide-in-from-top-2">
            <div className="grid gap-1 flex-1">
              <label className="text-xs font-medium text-slate-500">Target Field</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={tamperField}
                onChange={(e) => setTamperField(e.target.value)}
              >
                <option value="total_trip_emissions_kg_co2e">Total Emissions (kg)</option>
                <option value="total_trip_distance_km">Total Distance (km)</option>
                <option value="confidence_score">Confidence Score (0-1)</option>
              </select>
            </div>
            <div className="grid gap-1 flex-1">
              <label className="text-xs font-medium text-slate-500">Corrupt Value</label>
              <Input
                value={tamperValue}
                onChange={(e) => setTamperValue(e.target.value)}
                placeholder="Enter fake value..."
                className="h-9 bg-white"
              />
            </div>
            <Button
              variant="destructive"
              className="h-9"
              onClick={async () => {
                if (!tripId) return;
                try {
                  const val = parseFloat(tamperValue);
                  if (isNaN(val)) { alert("Please enter a valid number"); return; }

                  await fetch(`http://localhost:8001/simulation/tamper-data?trip_id=${tripId}&field=${tamperField}&new_value=${val}`, {
                    method: 'POST'
                  });
                  alert(`💥 INJECTED: Manually corrupted '${tamperField}' to '${val}'.\n\nVerify Audit now to see detection.`);
                  setAuditData(null);
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              <AlertTriangle className="mr-2 h-4 w-4" /> Inject Corruption
            </Button>
            <Button
              variant="outline"
              className="h-9 border-green-200 text-green-700 hover:bg-green-50"
              onClick={async () => {
                if (!tripId) return;
                try {
                  await fetch(`http://localhost:8001/simulation/reset-data?trip_id=${tripId}`, {
                    method: 'POST'
                  });
                  alert("✅ RESTORED: Original validated data has been recovered from cold storage.");
                  fetchAuditReport(); // Auto-refresh to show green state
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Restore Original
            </Button>
          </div>
        )}
      </div>

      {availableTrips.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-500 py-1">Quick Select:</span>
          {availableTrips.map(id => (
            <Button
              key={id}
              variant="outline"
              size="sm"
              onClick={() => fetchAuditReport(id)}
              className={tripId === id ? 'bg-blue-50 border-blue-200' : ''}
            >
              {id}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {auditData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">


          {/* 1️⃣ Global Audit Integrity Banner */}
          <IntegrityBanner
            status={auditData.integrity_status || 'PENDING'}
            lastVerified={new Date().toISOString()}
          />

          {/* 3️⃣ Integrity Metadata Section */}
          <IntegrityMetadata
            auditId={auditData.audit_id}
            rootHash={auditData.data_hash}
            status={auditData.integrity_status}
            timestamp={new Date().toISOString()}
          />

          {/* Audit Header Card */}
          <Card className={`border-l-4 shadow-sm ${auditData.integrity_status === 'COMPROMISED' ? 'border-l-red-500' : 'border-l-blue-600'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className={`h-5 w-5 ${auditData.integrity_status === 'COMPROMISED' ? 'text-red-600' : 'text-blue-600'}`} />
                  {auditData.integrity_status === 'COMPROMISED' ? 'TAMPERED AUDIT LOG' : 'Verified Trip Audit'}
                </CardTitle>
                <CardDescription>
                  Audit ID: <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{auditData.audit_id}</span>
                </CardDescription>
              </div>
              <Button
                variant={auditData.integrity_status === 'COMPROMISED' ? 'destructive' : 'outline'}
                size="sm"
                onClick={generatePDF}
              >
                <Download className="mr-2 h-4 w-4" />
                {auditData.integrity_status === 'COMPROMISED' ? 'Export Compromised (Red)' : 'Export Certificate'}
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Emissions</p>
                <p className="text-2xl font-bold text-slate-900">{auditData.total_trip_emissions_kg_co2e} <span className="text-sm font-normal text-gray-500">kg</span></p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Distance</p>
                <p className="text-2xl font-bold text-slate-900">{auditData.total_trip_distance_km} <span className="text-sm font-normal text-gray-500">km</span></p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Confidence Score</p>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${auditData.confidence_score > 0.9 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {(auditData.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                {auditData.integrity_status === 'COMPROMISED' ? (
                  <Badge variant="destructive" className="mt-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 mr-1" /> COMPROMISED
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">
                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata & Provenance */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Data Provenance</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Ingested At</span>
                  <span className="font-mono">{new Date(auditData.ingested_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Data Source</span>
                  <span>{auditData.data_sources?.gps}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Data Hash</span>
                  <span className="font-mono text-xs" title={auditData.data_hash}>{auditData.data_hash?.substring(0, 16)}...</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Emission Factors</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Source Library</span>
                  <span>{auditData.emission_factor_source?.source?.split('(')[0]}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Version</span>
                  <span>{auditData.emission_factor_source?.version}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Applied Factor</span>
                  <span>{auditData.emission_factor_per_km} kg/km</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Alert */}
          {auditData.recommendations?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="flex items-center gap-2 font-semibold text-amber-900 mb-2">
                <AlertTriangle className="h-5 w-5" />
                Optimizer Recommendations
              </h4>
              <ul className="space-y-2">
                {auditData.recommendations.map((rec: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-amber-800 text-sm">
                    <span className="font-bold">• {rec.type}:</span>
                    {rec.rationale}
                    <span className="font-semibold text-green-700 ml-1">(-{rec.potential_reduction_pct}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Detailed Calculation Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Segment Dist.</th>
                      <th className="p-3">Segment Emissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditData.segments.map((segment: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs">{new Date(segment.from_timestamp).toLocaleTimeString()}</td>
                        <td className="p-3">{segment.distance_km.toFixed(3)} km</td>
                        <td className="p-3 text-slate-700 font-semibold">{segment.emissions_kg_co2e.toFixed(3)} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )
      }
    </div >
  );
}
