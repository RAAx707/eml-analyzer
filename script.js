document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const emlText = e.target.result;

    // Use external parser
    const headers = EMLParser.parseHeaders(emlText);

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
      <p><strong>From:</strong> ${headers['From'] || 'N/A'}</p>
      <p><strong>To:</strong> ${headers['To'] || 'N/A'}</p>
      <p><strong>Subject:</strong> ${headers['Subject'] || 'N/A'}</p>
      <p><strong>Date:</strong> ${headers['Date'] || 'N/A'}</p>
      <p><strong>Reply-To:</strong> ${headers['Reply-To'] || 'N/A'}</p>
    `;
  };
  reader.readAsText(file);
});
