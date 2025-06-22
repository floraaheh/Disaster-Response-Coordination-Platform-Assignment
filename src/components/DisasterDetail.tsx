import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Users, Tag, AlertTriangle, Shield, Radio, Image, ExternalLink } from 'lucide-react';

interface DisasterDetailProps {
  disaster: any;
  onClose: () => void;
}

const DisasterDetail: React.FC<DisasterDetailProps> = ({ disaster, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'resources' | 'social' | 'updates'>('overview');
  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [socialMedia, setSocialMedia] = useState([]);
  const [officialUpdates, setOfficialUpdates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [disaster.id, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'resources':
          const resourcesRes = await fetch(`http://localhost:3001/api/disasters/${disaster.id}/resources`);
          if (resourcesRes.ok) {
            const resourcesData = await resourcesRes.json();
            setResources(resourcesData);
          }
          break;
        case 'social':
          const socialRes = await fetch(`http://localhost:3001/api/disasters/${disaster.id}/social-media`);
          if (socialRes.ok) {
            const socialData = await socialRes.json();
            setSocialMedia(socialData);
          }
          break;
        case 'updates':
          const updatesRes = await fetch(`http://localhost:3001/api/disasters/${disaster.id}/official-updates`);
          if (updatesRes.ok) {
            const updatesData = await updatesRes.json();
            setOfficialUpdates(updatesData);
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyImage = async (imageUrl: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/disasters/${disaster.id}/verify-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer netrunnerX'
        },
        body: JSON.stringify({ image_url: imageUrl })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Verification Result: ${result.status}\nScore: ${result.authenticity_score}/100\n${result.analysis_summary}`);
      }
    } catch (error) {
      console.error('Error verifying image:', error);
      alert('Failed to verify image');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: Users },
    { id: 'resources', label: 'Resources', icon: MapPin },
    { id: 'social', label: 'Social Media', icon: Radio },
    { id: 'updates', label: 'Official Updates', icon: ExternalLink }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{disaster.title}</h2>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{disaster.location_name || 'Location pending'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(disaster.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{disaster.description}</p>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {disaster.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-full text-sm ${
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">
                    {disaster.reports?.[0]?.count || 0}
                  </div>
                  <div className="text-sm text-blue-700">Reports</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <MapPin className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    {disaster.resources?.[0]?.count || 0}
                  </div>
                  <div className="text-sm text-green-700">Resources</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.floor((Date.now() - new Date(disaster.created_at).getTime()) / (1000 * 60 * 60))}h
                  </div>
                  <div className="text-sm text-purple-700">Active</div>
                </div>
              </div>

              {/* Ownership */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>ID:</strong> {disaster.id}</div>
                  <div><strong>Owner:</strong> {disaster.owner_id}</div>
                  <div><strong>Created:</strong> {new Date(disaster.created_at).toLocaleString()}</div>
                  {disaster.updated_at && (
                    <div><strong>Last Updated:</strong> {new Date(disaster.updated_at).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading resources...</p>
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No resources found for this disaster</p>
                  <p className="text-gray-500 text-sm mt-1">Resources will appear here as they become available</p>
                </div>
              ) : (
                resources.map((resource: any) => (
                  <div key={resource.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{resource.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {resource.location_name}
                          </span>
                          <span>Type: {resource.type}</span>
                          {resource.capacity && <span>Capacity: {resource.capacity}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        resource.type === 'shelter' ? 'bg-blue-100 text-blue-800' :
                        resource.type === 'medical' ? 'bg-red-100 text-red-800' :
                        resource.type === 'food' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {resource.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading social media reports...</p>
                </div>
              ) : socialMedia.length === 0 ? (
                <div className="text-center py-8">
                  <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No social media reports found</p>
                </div>
              ) : (
                socialMedia.map((post: any) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        post.priority === 'urgent' ? 'bg-red-500' :
                        post.priority === 'high' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-gray-900">{post.post}</p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span>@{post.user}</span>
                          <span>{post.platform}</span>
                          <span>{new Date(post.timestamp).toLocaleString()}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            post.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            post.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {post.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading official updates...</p>
                </div>
              ) : officialUpdates.length === 0 ? (
                <div className="text-center py-8">
                  <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No official updates found</p>
                </div>
              ) : (
                officialUpdates.map((update: any) => (
                  <div key={update.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{update.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{update.content}</p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span>{update.source}</span>
                          <span>{new Date(update.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          update.priority === 'high' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {update.priority}
                        </span>
                        {update.url && (
                          <a
                            href={update.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Report management coming soon</p>
              <p className="text-gray-500 text-sm mt-1">This will show user-submitted reports and verification status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisasterDetail;