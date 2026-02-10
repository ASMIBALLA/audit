'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Segment {
  from_timestamp: string;
  to_timestamp: string;
  distance_km: number;
  emissions_kg_co2e: number;
}

interface TripSegmentsProps {
  segments: Segment[];
}

export default function TripSegments({ segments }: TripSegmentsProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());

  const toggleSegment = (index: number) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSegments(newExpanded);
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Trip Segments ({segments.length})</h3>
        <p className="text-sm text-gray-600 mb-4">
          Detailed breakdown of each segment along the route with calculated emissions
        </p>
      </div>

      <div className="space-y-2">
        {segments.map((segment, index) => {
          const isExpanded = expandedSegments.has(index);

          return (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-purple-300 transition-colors"
            >
              <button
                onClick={() => toggleSegment(index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">{formatTime(segment.from_timestamp)}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">{formatTime(segment.to_timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div>
                        <span className="text-xs text-gray-500">Distance: </span>
                        <span className="font-semibold text-gray-900">{segment.distance_km.toFixed(4)} km</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Emissions: </span>
                        <span className="font-semibold text-orange-600">
                          {segment.emissions_kg_co2e.toFixed(4)} kg CO₂e
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-4">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Time:</span>
                      <span className="font-mono text-gray-900">{segment.from_timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Time:</span>
                      <span className="font-mono text-gray-900">{segment.to_timestamp}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        {segment.distance_km.toFixed(4)} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emissions:</span>
                      <span className="font-mono font-semibold text-orange-600">
                        {segment.emissions_kg_co2e.toFixed(4)} kg CO₂e
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
