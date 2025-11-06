import express = require('express');
import { fetchCustomersForActiveUsers } from '../services/userServices';

const router = express.Router();

router.get('/active-users/customers', async (req, res) => {
  try {
    const data = await fetchCustomersForActiveUsers();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
