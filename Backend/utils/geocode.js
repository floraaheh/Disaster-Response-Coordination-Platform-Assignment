const axios = require('axios');

exports.geocodeLocation = async (locationName) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;

  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Disaster-Platform/1.0' }
  });

  if (response.data.length === 0) throw new Error("No coordinates found");
  const { lat, lon } = response.data[0];
  return { lat, lon };
};
