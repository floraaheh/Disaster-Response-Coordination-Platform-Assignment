import React, { useState } from 'react';
import { MapPin, Clock, Users, Tag, Eye, AlertTriangle } from 'lucide-react';
import DisasterDetail from './DisasterDetail';

interface Disaster {
  id: string;
  title: string;
  location_name?: string;
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
  reports?: { count: number }[];
  resources?: { count: number }[];
}

interface DisasterListProps {
  disasters: Disaster[];
}

const DisasterList: React.FC<DisasterListProps> = ({ disasters }) => {
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'reports' | 'resources'>('date');

  // Get unique tags for filtering
  const allTags = Array.from(new Set(disasters.flatMap(d => d.tags)));

  // Filter disasters
  const filteredDisasters = disasters.filter(disaster => {
    if (filter === 'all') return true;
    return disaster.tags.includes(filter);
  });

  // Sort disasters
  const sortedDisasters = [...filteredDisasters].sort((a, b) => {
    switch (sortBy) {
      case 'reports':
        const aReports = a.reports?.[0]?.count || 0;
        const bReports = b.reports?.[0]?.count || 0;
        return bReports - aReports;
      case 'resources':
        const aResources = a.resources?.[0]?.count || 0;
        const bResources = b.resources?.[0]?.count || 0;
        return bResources - aResources;
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const getPriorityColor = (tags: string[]) => {
    if (tags.includes('urgent') || tags.includes('emergency')) {
      return 'border-l-red-500 bg-red-50';
    } else if (tags.includes('high')) {
      return 'border-l-orange-500 bg-orange-50';
    } else {
      return 'border-l-blue-500 bg-white';
    }
  };

  const getStatusIcon = (tags: string[]) => {
    if (tags.includes('urgent') || tags.includes('emergency')) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    return <MapPin className="h-5 w-5 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Tag
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Disasters</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'reports' | 'resources')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="date">Most Recent</option>
                <option value="reports">Most Reports</option>
                <option value="resources">Most Resources</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {sortedDisasters.length} of {disasters.length} disasters
          </div>
        </div>
      </div>

      {/* Disaster Cards */}
      <div className="space-y-4">
        {sortedDisasters.map(disaster => (
          <div
            key={disaster.id}
            className={`bg-white rounded-lg shadow-sm border-l-4 border border-gray-200 hover:shadow-md transition-shadow ${getPriorityColor(disaster.tags)}`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(disaster.tags)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {disaster.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{disaster.location_name || 'Location pending'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(disaster.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{disaster.reports?.[0]?.count || 0} reports</span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                    {disaster.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {disaster.tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-2 py-1 text-xs rounded-full ${
                          tag === 'urgent' || tag === 'emergency'
                            ? 'bg-red-100 text-red-800'
                            : tag === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <Tag className="h-3 w-3 inline mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <button
                    onClick={() => setSelectedDisaster(disaster)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>

                  <div className="text-right text-xs text-gray-500">
                    <div>ID: {disaster.id.slice(0, 8)}...</div>
                    <div>Owner: {disaster.owner_id}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {sortedDisasters.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No disasters found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No disasters have been reported yet.' 
                : `No disasters found with the "${filter}" tag.`}
            </p>
          </div>
        )}
      </div>

      {/* Disaster Detail Modal */}
      {selectedDisaster && (
        <DisasterDetail
          disaster={selectedDisaster}
          onClose={() => setSelectedDisaster(null)}
        />
      )}
    </div>
  );
};

export default DisasterList;