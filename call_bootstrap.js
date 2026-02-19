const https = require('https');

const data = JSON.stringify({
  data: {
    secret: 'OceanPearl2026Bootstrap!'
  }
});

const options = {
  hostname: 'v3bootstrap-c4ywpd7kfa-as.a.run.app',
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
