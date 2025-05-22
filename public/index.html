<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QR Code Generator & Tracker</title>
  <style>
    body {
      font-family: sans-serif;
      background-color: #f9f9f9;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    input[type="url"] {
      width: 80%;
      padding: 0.5rem;
      margin-bottom: 1rem;
    }
    button {
      padding: 0.5rem 1rem;
      background-color: #007BFF;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
    #qrResult {
      margin-top: 1.5rem;
    }
    img {
      max-width: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>QR Code Generator & Tracker</h2>
    <form id="qrForm">
      <input type="url" id="urlInput" placeholder="Enter your URL here" required />
      <br />
      <button type="submit">Generate QR Code</button>
    </form>
    <div id="qrResult"></div>
  </div>

  <script>
    const form = document.getElementById('qrForm');
    const urlInput = document.getElementById('urlInput');
    const qrResult = document.getElementById('qrResult');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('url', urlInput.value);
      const res = await fetch('/create', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const blob = await res.blob();
        const imgURL = URL.createObjectURL(blob);
        qrResult.innerHTML = `<h3>Your QR Code:</h3><img src="${imgURL}" alt="QR Code" />`;
      } else {
        qrResult.textContent = 'Error generating QR Code.';
      }
    });
  </script>
</body>
</html>
