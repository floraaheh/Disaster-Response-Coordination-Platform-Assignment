import axios from "axios";

export async function geocodeLocation(locationName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Disaster-App/1.0' }
  });

  const data = response.data;
  if (data.length > 0) {
    const { lat, lon } = data[0];
    return { lat, lon };
  } else {
    throw new Error("No coordinates found for the given location");
  }
}
