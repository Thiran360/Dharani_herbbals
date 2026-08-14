const imageUriCache: Record<string, any> = {};

export const getImageUrl = (url: string | any): any => {
  if (!url) return require('../assets/images/logo.png');
  if (typeof url === 'number') return url;
  
  if (typeof url === 'object') {
    if (url.uri) return url;
    if (url.url) return getImageUrl(url.url);
    if (url.image) return getImageUrl(url.image);
    if (url.product_image) return getImageUrl(url.product_image);
  }

  if (typeof url !== 'string') return require('../assets/images/logo.png');
  const trimmed = url.trim();
  if (!trimmed) return require('../assets/images/logo.png');
  if (imageUriCache[trimmed]) return imageUriCache[trimmed];

  const fullUrl = (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
    ? trimmed
    : `https://api.codingboss.in/herbal${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;

  const obj = {
    uri: fullUrl,
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  };
  imageUriCache[trimmed] = obj;
  return obj;
};
