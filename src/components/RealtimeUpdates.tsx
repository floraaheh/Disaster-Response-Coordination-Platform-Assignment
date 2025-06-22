import React from 'react';
import { Radio, Clock, AlertTriangle, MapPin, Users, MessageCircle } from 'lucide-react';

interface RealtimeUpdate {
  type: string;
  action?: string;
  data: any;
  timestamp: Date;
}

interface RealtimeUpdatesProps {
  updates: RealtimeUpdate[];
}

const RealtimeUpdates: React.FC<RealtimeUpdatesProps> = ({ updates }) => {
  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'disaster':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'social_media':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      case 'resources':
        return <MapPin className="h-4 w-4 text-green-600" />;
      default:
        return <Radio className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'disaster':
        return 'border-red-200 bg-red-50';
      case 'social_media':
        return 'border-blue-200 bg-blue-50';
      case 'resources':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatUpdateText = (update: RealtimeUpdate) => {
    switch (update.type) {
      case 'disaster':
        return `Disaster ${update.action}: ${update.data.title}`;
      case 'social_media':
        return `${update.data.posts?.length || 0} new social media reports`;
      case 'resources':
        return `Resource ${update.action}: ${update.data.resource?.name || 'Unknown'}`;
      default:
        return 'System update';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-gray-900">Live Updates</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Real-time system activity</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="p-6 text-center">
            <Radio className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No recent updates</p>
            <p className="text-gray-500 text-xs">Updates will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {updates.slice(0, 10).map((update, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getUpdateColor(update.type)} transition-all hover:shadow-sm`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formatUpdateText(update)}
                    </p>
                    <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeAgo(update.timestamp)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Additional details based on update type */}
                {update.type === 'disaster' && update.data.location_name && (
                  <div className="mt-2 pl-7">
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{update.data.location_name}</span>
                    </div>
                  </div>
                )}
                
                {update.type === 'social_media' && update.data.posts && update.data.posts.length > 0 && (
                  <div className="mt-2 pl-7">
                    <div className="text-xs text-gray-600 truncate">
                      Latest: "{update.data.posts[0]?.post || 'No content'}"
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {updates.length > 10 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Showing latest 10 of {updates.length} updates
          </p>
        </div>
      )}
    </div>
  );
};

export default RealtimeUpdates;