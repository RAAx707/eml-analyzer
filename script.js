document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const emlText = e.target.result;
    const headers = EMLParser.parseHeaders(emlText);

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
      <p><strong>From:</strong> ${headers['From'] ? formatAddress(headers['From']) : 'N/A'}</p>
      <p><strong>To:</strong> ${headers['To'] ? formatAddressField(headers['To']) : 'N/A'}</p>
      <p><strong>Subject:</strong> ${headers['Subject'] ? decodeMimeHeader(headers['Subject']) : 'N/A'}</p>
      <p><strong>Date:</strong> ${headers['Date'] || 'N/A'}</p>
      <p><strong>Reply-To:</strong> ${headers['Reply-To'] ? formatAddress(headers['Reply-To']) : 'N/A'}</p>
    `;
  };
  reader.readAsText(file);
});

// Format "John Doe <john@example.com>" to "John Doe (john@example.com)"
function formatAddress(raw) {
  const match = raw.match(/(.*)<(.+)>/);
  if (match) {
    const name = match[1].trim().replace(/"/g, '');
    const email = match[2].trim();
    return `${name} (${email})`;
  }
  return raw.trim();
}

// Handle multiple recipients (To/Cc/Bcc)
function formatAddressField(field) {
  if (!field) return 'N/A';
  if (Array.isArray(field)) {
    return field.map(formatAddress).join(', ');
  }
  return formatAddress(field);
}

// Decode MIME-encoded subject lines
function decodeMimeHeader(str) {
  if (!str || !str.startsWith('=?')) return str;

  return str.replace(/=\?(.+?)\?(B|Q)\?(.+?)\?=/gi, (_, charset, encoding, encodedText) => {
    if (encoding.toUpperCase() === 'B') {
      try {
        const decoded = atob(encodedText);
        return new TextDecoder(charset).decode(new Uint8Array([...decoded].map(c => c.charCodeAt(0))));
      } catch (e) {
        return encodedText;
      }
    } else if (encoding.toUpperCase() === 'Q') {
      return decodeQuotedPrintable(encodedText, charset);
    } else {
      return encodedText;
    }
  });
}

function decodeQuotedPrintable(text, charset) {
  const decoded = text.replace(/_/g, ' ').replace(/=([A-Fa-f0-9]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return new TextDecoder(charset).decode(new TextEncoder().encode(decoded));
}
