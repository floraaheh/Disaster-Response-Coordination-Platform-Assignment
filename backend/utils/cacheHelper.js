const supabase = require('./supabaseClient');

// Time helper to get expiry timestamp
function getExpiryTimestamp(ttlSeconds) {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);
  return expiresAt.toISOString();
}

// Fetch cached value if not expired
async function getCachedValue(key) {
  const { data, error } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', key)
    .single();

  if (error || !data) return null;

  const now = new Date();
  const expires = new Date(data.expires_at);
  return now < expires ? data.value : null;
}

// Store value with expiration
async function setCachedValue(key, value, ttlSeconds = 3600) {
  const { error } = await supabase
    .from('cache')
    .upsert({
      key,
      value,
      expires_at: getExpiryTimestamp(ttlSeconds)
    });

  if (error) console.error(`Failed to cache value for ${key}:`, error.message);
}

module.exports = {
  getCachedValue,
  setCachedValue
};
