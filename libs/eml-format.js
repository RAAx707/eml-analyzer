// libs/eml-format.js
const EMLParser = {
  parseHeaders(emlText) {
    const headers = {};
    const lines = emlText.split(/\r?\n/);

    let currentHeader = null;

    for (let line of lines) {
      if (line === '') break; // End of headers

      // Continuation line (e.g., folded Subject:)
      if (/^\s/.test(line) && currentHeader) {
        headers[currentHeader] += ' ' + line.trim();
        continue;
      }

      const separatorIndex = line.indexOf(':');
      if (separatorIndex > -1) {
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        currentHeader = key;

        if (!headers[key]) {
          headers[key] = value;
        } else {
          // Handle duplicates like multiple To:
          if (Array.isArray(headers[key])) {
            headers[key].push(value);
          } else {
            headers[key] = [headers[key], value];
          }
        }
      }
    }

    return headers;
  }
};
