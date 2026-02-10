'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Trophy, TrendingDown } from 'lucide-react';

interface SupplierData {
  supplier_id: string;
  name: string;
  total_emissions_kg_co2e: number;
  total_distance_km: number;
}

interface LeaderboardResponse {
  recommendation: string;
  leaderboard: SupplierData[];
}

export default function SupplierLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<SupplierData[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('http://localhost:8001/intelligence/supplier-leaderboard');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: LeaderboardResponse = await response.json();
        setLeaderboard(data.leaderboard);
        setRecommendation(data.recommendation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-900">Error</p>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommendation Card */}
      <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6">
        <div className="flex items-start gap-3">
          <Trophy className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Recommended Supplier</p>
            <p className="text-lg font-bold text-green-700 mt-1">{recommendation}</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Supplier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Total Emissions
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Total Distance
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((supplier, index) => {
              const emissionColor =
                index === 0 ? 'bg-green-50' : index === leaderboard.length - 1 ? 'bg-red-50' : '';

              return (
                <tr
                  key={supplier.supplier_id}
                  className={`border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors ${emissionColor}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-900">#{index + 1}</span>
                      {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{supplier.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{supplier.supplier_id}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <p className="font-semibold text-gray-900">
                        {supplier.total_emissions_kg_co2e.toFixed(2)} kg CO₂e
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-gray-600">{supplier.total_distance_km.toFixed(2)} km</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Total Suppliers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{leaderboard.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Total Emissions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {leaderboard.reduce((sum, s) => sum + s.total_emissions_kg_co2e, 0).toFixed(2)} kg CO₂e
          </p>
        </div>
      </div>
    </div>
  );
}
