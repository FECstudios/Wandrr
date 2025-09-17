export default function handler(req, res) {
  console.log('Test endpoint hit!');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  res.status(200).json({ 
    message: 'API is working!', 
    method: req.method,
    timestamp: new Date().toISOString()
  });
}