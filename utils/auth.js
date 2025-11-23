import jwt from 'jsonwebtoken';

export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token Data:", decoded); // Debugging
        return decoded;
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return null;
    }
}
