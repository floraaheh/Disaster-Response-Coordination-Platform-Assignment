import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, MapPin, Clock, Users, Radio, Shield, Bell } from 'lucide-react';
import io from 'socket.io-client';
import DisasterList from './components/DisasterList';
import DisasterForm from './components/DisasterForm';
import RealtimeUpdates from './components/RealtimeUpdates';
import Dashboard from './components/Dashboard';

const API_BASE = 'http://localhost:3001/api';

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

function App() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'disasters' | 'reports'>('dashboard');
  const [socket, setSocket] = useState<any>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDisasters: 0,
    activeReports: 0,
    verifiedResources: 0,
    liveUpdates: 0
  });

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket']
    });
    
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });
    
    newSocket.on('disaster_updated', (data) => {
      setRealtimeUpdates(prev => [
        { type: 'disaster', action: data.action, data: data.disaster, timestamp: new Date() },
        ...prev.slice(0, 19)
      ]);
      
      if (data.action === 'create') {
        setDisasters(prev => [data.disaster, ...prev]);
      } else if (data.action === 'update') {
        setDisasters(prev => prev.map(d => d.id === data.disaster.id ? data.disaster : d));
      } else if (data.action === 'delete') {
        setDisasters(prev => prev.filter(d => d.id !== data.disaster.id));
      }
    });
    
    newSocket.on('social_media_updated', (data) => {
      setRealtimeUpdates(prev => [
        { type: 'social_media', data, timestamp: new Date() },
        ...prev.slice(0, 19)
      ]);
    });
    
    newSocket.on('resources_updated', (data) => {
      setRealtimeUpdates(prev => [
        { type: 'resources', data, timestamp: new Date() },
        ...prev.slice(0, 19)
      ]);
    });
    
    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    fetchDisasters();
  }, []);

  useEffect(() => {
    // Update stats when disasters change
    setStats({
      totalDisasters: disasters.length,
      activeReports: disasters.reduce((sum, d) => sum + (d.reports?.[0]?.count || 0), 0),
      verifiedResources: disasters.reduce((sum, d) => sum + (d.resources?.[0]?.count || 0), 0),
      liveUpdates: realtimeUpdates.length
    });
  }, [disasters, realtimeUpdates]);

  const fetchDisasters = async () => {
    try {
      const response = await fetch(`${API_BASE}/disasters`);
      const data = await response.json();
      setDisasters(data);
    } catch (error) {
      console.error('Failed to fetch disasters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisasterCreated = (disaster: Disaster) => {
    setDisasters(prev => [disaster, ...prev]);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading disaster response system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Disaster Response Hub
                </h1>
                <p className="text-sm text-gray-500">Real-time coordination platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Live Updates</span>
              </div>
              
              <button
                onClick={() => setShowForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Report Disaster</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Radio className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('disasters')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'disasters'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Active Disasters</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'dashboard' && (
              <Dashboard 
                disasters={disasters}
                stats={stats}
                realtimeUpdates={realtimeUpdates}
              />
            )}
            
            {activeTab === 'disasters' && (
              <DisasterList disasters={disasters} />
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <RealtimeUpdates updates={realtimeUpdates} />
          </div>
        </div>
      </main>

      {/* Disaster Form Modal */}
      {showForm && (
        <DisasterForm
          onClose={() => setShowForm(false)}
          onSubmit={handleDisasterCreated}
        />
      )}
    </div>
  );
}

export default App;