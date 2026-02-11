const http = require('http');

const data = JSON.stringify({ email: 'admin@gmail.com', password: '123456' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:' + res.statusCode);
  console.log('SET-COOKIE:' + (res.headers['set-cookie'] || []).join('; '));
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('BODY:' + body));
});

req.on('error', (e) => console.error('ERROR:' + e.message));
req.write(data);
req.end();
