// lib/parseForm.js
import formidable from 'formidable';
import { NextRequest } from 'next/server';

export default function parseForm(req) {
  return new Promise((resolve, reject) => {
    // For Next.js 13+ App Router: Convert NextRequest to Node request
    const nodeReq = new NodeNextRequest(req);
    
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      keepExtensions: true,
      allowEmptyFiles: false,
    });
    
    form.parse(nodeReq, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

// Helper class to adapt NextRequest to Node's IncomingMessage for formidable
class NodeNextRequest {
  constructor(nextRequest) {
    this.headers = {};
    
    // Convert headers from NextRequest format to Node's format
    for (const [key, value] of nextRequest.headers.entries()) {
      this.headers[key.toLowerCase()] = value;
    }
    
    // Ensure content-length is present
    if (!this.headers['content-length'] && nextRequest.body) {
      // For streams, this might be an estimate
      this.headers['content-length'] = '1048576'; // Set a default if missing
    }
    
    // Store the original request and body
    this.originalRequest = nextRequest;
    this.body = nextRequest.body;
  }
  
  // Add readable stream interface methods that formidable expects
  on(event, handler) {
    if (event === 'data') {
      // Set up reading from the request body
      const reader = this.originalRequest.body.getReader();
      
      reader.read().then(function process({ done, value }) {
        if (done) return;
        
        handler(value);
        return reader.read().then(process);
      }).catch(error => {
        console.error('Error reading request body:', error);
      });
    }
    
    return this;
  }
  
  pipe() {
    // Implement if needed
    return this;
  }
}