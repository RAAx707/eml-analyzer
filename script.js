document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const emlText = e.target.result;

    // Simple header parsing
    const headers = {};
    const lines = emlText.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith("From:")) headers.From = line.replace("From:", "").trim();
      if (line.startsWith("To:")) headers.To = line.replace("To:", "").trim();
      if (line.startsWith("Subject:")) headers.Subject = line.replace("Subject:", "").trim();
      if (line.startsWith("Date:")) headers.Date = line.replace("Date:", "").trim();
      if (line.startsWith("Reply-To:")) headers.ReplyTo = line.replace("Reply-To:", "").trim();
    }

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
      <p><strong>From:</strong> ${headers.From || 'N/A'}</p>
      <p><strong>To:</strong> ${headers.To || 'N/A'}</p>
      <p><strong>Subject:</strong> ${headers.Subject || 'N/A'}</p>
      <p><strong>Date:</strong> ${headers.Date || 'N/A'}</p>
      <p><strong>Reply-To:</strong> ${headers.ReplyTo || 'N/A'}</p>
    `;
  };
  reader.readAsText(file);
});
