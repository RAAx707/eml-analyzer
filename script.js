document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const emlText = e.target.result;
    const headers = EMLParser.parseHeaders(emlText);

    const resultsDiv = document.getElementById('results');
    let html = '';

    // === BASIC HEADERS ===
    html += createSection('Basic Info', [
      formatHeaderBlock('From', headers['From']),
      formatHeaderBlock('To', headers['To']),
      formatHeaderBlock('Cc', headers['Cc']),
      formatHeaderBlock('Bcc', headers['Bcc']),
      formatHeaderBlock('Reply-To', headers['Reply-To']),
      formatHeaderBlock('Subject', decodeMimeHeader(headers['Subject'])),
      formatHeaderBlock('Date', formatDate(headers['Date']))
    ]);

    // === ADVANCED HEADERS ===
    html += createSection('Advanced Info', [
      formatHeaderBlock('Message-ID', headers['Message-ID']),
      formatHeaderBlock('Return-Path', headers['Return-Path']),
      formatHeaderBlock('MIME-Version', headers['MIME-Version']),
      formatHeaderBlock('Content-Type', headers['Content-Type'])
    ]);

    // === RECEIVED HEADERS ===
    if (headers['Received']) {
      const received = Array.isArray(headers['Received']) ? headers['Received'] : [headers['Received']];
      html += `
        <div class="bg-gray-800 border border-gray-700 rounded p-4">
          <h2 class="text-lg font-semibold text-blue-400 mb-2">Received Headers (${received.length})</h2>
          <ul class="space-y-1 list-disc list-inside text-sm text-gray-300">
            ${received.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // === X-HEADERS (COLLAPSIBLE) ===
    const xHeaders = Object.keys(headers).filter(h => h.toLowerCase().startsWith('x-'));
    if (xHeaders.length) {
      html += `
        <details class="bg-gray-800 border border-gray-700 rounded p-4">
          <summary class="cursor-pointer text-blue-400 font-semibold hover:underline text-lg">
            Misc Headers (${xHeaders.length})
          </summary>
          <ul class="mt-2 space-y-1 text-sm text-gray-300 list-disc list-inside">
            ${xHeaders.map(xh => `<li><strong>${xh}:</strong> ${headers[xh]}</li>`).join('')}
          </ul>
        </details>
      `;
    }

    resultsDiv.innerHTML = html;
  };
  reader.readAsText(file);
});

// === UTILITY FUNCTIONS ===

function createSection(title, blocks) {
  const content = blocks.filter(Boolean).join('');
  if (!content) return '';
  return `
    <div class="bg-gray-800 border border-gray-700 rounded p-4 space-y-2">
      <h2 class="text-lg font-semibold text-blue-400 mb-2">${title}</h2>
      ${content}
    </div>
  `;
}

function formatHeaderBlock(label, value) {
  if (!value) return '';
  if (['From', 'To', 'Cc', 'Bcc', 'Reply-To'].includes(label)) {
    value = formatAddressField(value);
  }
  return `<p class="text-sm text-gray-300"><strong class="text-gray-400">${label}:</strong> ${value}</p>`;
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
