const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyZ3sJTzV239anLmkc32wvxmnlf0xViFH3u5s2DdOofKl_okKe5v0ooU6vucHD9vqMf/exec'; // Replace after clasp deploy

export const gasApi = async (action, payload = {}) => {
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload }),
  });

  const result = await response.json();
  if (result.status === 'error') throw new Error(result.message);
  
  // Safely check if the data is a JSON string or just a normal text message
  if (typeof result.data === 'string') {
    try {
      return JSON.parse(result.data);
    } catch (e) {
      // If it fails to parse, it means it's just a regular text message like "Leave applied successfully."
      return result.data;
    }
  }
  
  return result.data;
};