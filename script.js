document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const emlText = e.target.result;
    const headers = EMLParser.parseHeaders(emlText);

    const resultsDiv = document.getElementById('results');
    let html = '';

    // Standard header blocks
    html += formatHeaderBlock('From', headers['From']);
    html += formatHeaderBlock('To', headers['To']);
    html += formatHeaderBlock('Cc', headers['Cc']);
    html += formatHeaderBlock('Bcc', headers['Bcc']);
    html += formatHeaderBlock('Reply-To', headers['Reply-To']);
    html += formatHeaderBlock('Subject', decodeMimeHeader(headers['Subject']));
    html += formatHeaderBlock('Date', formatDate(headers['Date']));

    // Advanced headers
    html += formatHeaderBlock('Message-ID', headers['Message-ID']);
    html += formatHeaderBlock('Return-Path', headers['Return-Path']);
    html += formatHeaderBlock('MIME-Version', headers['MIME-Version']);
    html += formatHeaderBlock('Content-Type', headers['Content-Type']);

    // Received headers (multiple lines)
    if (headers['Received']) {
      const received = Array.isArray(headers['Received']) ? headers['Received'] : [headers['Received']];
      html += `<div><strong>Received:</strong><ul>${received.map(r => `<li>${r}</li>`).join('')}</ul></div>`;
    }

    // X-Headers
    const xHeaders = Object.keys(headers).filter(h => h.toLowerCase().startsWith('x-'));
    if (xHeaders.length) {
      html += `<div><strong>Misc Headers:</strong><ul>`;
      xHeaders.forEach(xh => {
        html += `<li><strong>${xh}:</strong> ${headers[xh]}</li>`;
      });
      html += `</ul></div>`;
    }

    resultsDiv.innerHTML = html;
  };
  reader.readAsText(file);
});

function formatHeaderBlock(label, value) {
  if (!value) return '';
  if (['From', 'To', 'Cc', 'Bcc', 'Reply-To'].includes(label)) {
    value = formatAddressField(value);
  }
  return `<p><strong>${label}:</strong> ${value}</p>`;
}

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
