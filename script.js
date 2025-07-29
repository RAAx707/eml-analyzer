document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const emlText = e.target.result;
    const headers = EMLParser.parseHeaders(emlText);

    const resultsDiv = document.getElementById('results');

    resultsDiv.innerHTML = `
      ${formatHeaderBlock('From', headers['From'])}
      ${formatHeaderBlock('To', headers['To'])}
      ${formatHeaderBlock('Cc', headers['Cc'])}
      ${formatHeaderBlock('Bcc', headers['Bcc'])}
      ${formatHeaderBlock('Reply-To', headers['Reply-To'])}
      ${formatHeaderBlock('Subject', decodeMimeHeader(headers['Subject']))}
      ${formatHeaderBlock('Date', formatDate(headers['Date']))}
    `;
  };
  reader.readAsText(file);
});

// Only render headers if they exist
function formatHeaderBlock(label, value) {
  if (!value) return '';
  if (label === 'From' || label === 'To' || label === 'Cc' || label === 'Bcc' || label === 'Reply-To') {
    value = formatAddressField(value);
  }
  return `<p><strong>${label}:</strong> ${value}</p>`;
}

// Parse names + emails like "Name <email@example.com>"
function formatAddress(raw) {
  const match = raw.match(/(.*)<(.+)>/);
  if (match) {
    const name = match[1].trim().replace(/"/g, '');
    const email = match[2].trim();
    return `${name} (${email})`;
  }
  return raw.trim();
}

function formatAddressField(field) {
  if (!field) return 'N/A';
  if (Array.isArray(field)) {
    return field.map(formatAddress).join(', ');
  }
  return formatAddress(field);
}

// Decode Subject if MIME encoded
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

// Format date: "Tue, 30 Jul 2024, 04:17:22 PM"
function formatDate(rawDate) {
  if (!rawDate) return 'N/A';
  try {
    const date = new Date(rawDate);
    const weekday = date.toLocaleString('en-US', { weekday: 'short' });
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${weekday}, ${day} ${month} ${year}, ${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  } catch {
    return rawDate;
  }
}
