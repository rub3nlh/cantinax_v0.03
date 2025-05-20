import express from 'express';
import { addContactToList } from '../services/brevo_email.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Add a user to Brevo list (ID: 24)
 * This endpoint is called when a user's email is verified
 */
router.post('/add-to-brevo-list', async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }
    
    // Add contact to Brevo list
    const result = await addContactToList({
      email,
      name: name || '',
      phone: phone || '',
      listId: 24
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'User added to Brevo list successfully',
      result 
    });
  } catch (error) {
    console.error('Error adding contact to Brevo list:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add contact to Brevo list' 
    });
  }
});

export default router;
