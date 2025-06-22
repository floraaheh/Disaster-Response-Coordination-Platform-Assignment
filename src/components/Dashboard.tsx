import React from 'react';
import { AlertTriangle, Users, MapPin, Shield, Clock, TrendingUp } from 'lucide-react';

interface DashboardProps {
  disasters: any[];
  stats: {
    totalDisasters: number;
    activeReports: number;
    verifiedResources: number;
    liveUpdates: number;
  };
  realtimeUpdates: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ disasters, stats, realtimeUpdates }) => {
  const recentDisasters = disasters.slice(0, 3);
  const urgentDisasters = disasters.filter(d => 
    d.tags.includes('urgent') || d.tags.includes('emergency')
  );

  const statCards = [
    {
      title: 'Active Disasters',
      value: stats.totalDisasters,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Field Reports',
      value: stats.activeReports,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Resources Available',
      value: stats.verifiedResources,
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Live Updates',
      value: stats.liveUpdates,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6 transition-transform hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full bg-white shadow-sm`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert Section for Urgent Disasters */}
      {urgentDisasters.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900">Priority Alerts</h3>
          </div>
          <div className="space-y-3">
            {urgentDisasters.slice(0, 3).map(disaster => (
              <div key={disaster.id} className="bg-white rounded-lg p-4 border border-red-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{disaster.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{disaster.location_name}</p>
                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(disaster.created_at).toLocaleTimeString()}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {disaster.reports?.[0]?.count || 0} reports
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {disaster.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className={`px-2 py-1 text-xs rounded-full ${
                          tag === 'urgent' || tag === 'emergency'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Disasters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Disasters</h3>
          <div className="space-y-4">
            {recentDisasters.map(disaster => (
              <div key={disaster.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {disaster.title}
                  </h4>
                  <p className="text-sm text-gray-500 truncate">
                    {disaster.location_name || 'Location pending'}
                  </p>
                  <div className="flex items-center mt-1 space-x-3 text-xs text-gray-400">
                    <span>{new Date(disaster.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{disaster.tags.length} tags</span>
                  </div>
                </div>
              </div>
            ))}
            {recentDisasters.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent disasters</p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-900">API Services</span>
              </div>
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                Operational
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-900">Real-time Updates</span>
              </div>
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                Connected
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">External APIs</span>
              </div>
              <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                Cached
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-900">Social Media Feed</span>
              </div>
              <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                Mock Data
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last System Check</span>
              <span className="text-gray-900 font-medium">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;