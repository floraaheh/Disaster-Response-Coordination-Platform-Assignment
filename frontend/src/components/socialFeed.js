import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000'); // adjust if hosted

export default function SocialFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Fetch initial posts
    axios.get('http://localhost:5000/api/social').then(res => {
      setPosts(res.data);
    });

    // Listen for real-time updates
    socket.on('new_social_post', (newPost) => {
      setPosts(prev => [newPost, ...prev]);
    });

    return () => socket.off('new_social_post');
  }, []);

  return (
    <div>
      <h2>📡 Real-Time Social Media Feed</h2>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <strong>@{post.username}:</strong> {post.content}
            <br />
            <small>{new Date(post.timestamp).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
