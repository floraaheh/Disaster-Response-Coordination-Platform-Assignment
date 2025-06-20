import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Replace with your backend URL if deployed

function App() {
  const [disasters, setDisasters] = useState([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    fetchDisasters();

    socket.on('disaster_updated', () => {
      fetchDisasters(); // Real-time updates
    });

    return () => {
      socket.off('disaster_updated');
    };
  }, []);

  const fetchDisasters = async () => {
    const res = await axios.get('http://localhost:3000/disasters');
    setDisasters(res.data);
  };

  const createDisaster = async () => {
    await axios.post('http://localhost:3000/disasters', {
      title,
      location_name: location,
      description,
      tags: tags.split(','),
      owner_id: 'netrunnerX'
    });
    setTitle('');
    setLocation('');
    setDescription('');
    setTags('');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Disaster Response Dashboard</h1>
      <div>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} /><br />
        <input placeholder="Location Name" value={location} onChange={e => setLocation(e.target.value)} /><br />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} /><br />
        <input placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} /><br />
        <button onClick={createDisaster}>Create Disaster</button>
      </div>

      <hr />
      <h2>Active Disasters</h2>
      <ul>
        {disasters.map(d => (
          <li key={d.id}>
            <strong>{d.title}</strong> - {d.location_name} - {d.tags.join(', ')}
            <p>{d.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
