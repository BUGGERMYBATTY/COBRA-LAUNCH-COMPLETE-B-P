// Health check endpoint for Vercel serverless function
export default function handler(req, res) {
    res.status(200).json({
        status: 'ok',
        message: 'Cobra Launch Backend API is running on Vercel'
    });
}
