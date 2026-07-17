// src/utils/helpers.js
export function cleanId(dataString) {
    if (!dataString) return null;
    const str = String(dataString);
    if (str.indexOf('id=') !== -1) return str.split('id=')[1].split('&')[0];
    if (str.indexOf('/d/') !== -1) return str.split('/d/')[1].split('/')[0];
    return str;
  }