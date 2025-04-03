import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a Supabase client for token verification
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Middleware to verify Supabase authentication tokens
 * Extracts the token from the Authorization header and verifies it
 */
export const requireAuth = async (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Extract the token
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication token missing'
            });
        }

        // Verify the JWT token with Supabase
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            console.error('Token verification error:', error);
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired authentication token'
            });
        }

        // Attach the user to the request object for use in route handlers
        req.user = data.user;

        // User is authenticated, proceed to the route handler
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
};
