const express = require('express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT and check if the user is an admin
function checkAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send({ success: false, message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).send({ success: false, message: 'Invalid or expired token' });
        }

        const user = await User.findById(decoded.userId);
        if (user.role !== 'admin') {
            return res.status(403).send({ success: false, message: 'Access denied' });
        }

        req.user = user;
        next();
    });
}

// Get all users (admin only)
router.get('/users', checkAdmin, async (req, res) => {
    const users = await User.find();
    res.json({ success: true, users });
});

// Create a new user (admin only)
router.post('/create-user', checkAdmin, async (req, res) => {
    const { email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, role });
    await user.save();
    res.status(201).json({ success: true, message: 'User created successfully' });
});

// Promote a user to admin
router.put('/promote/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'admin';
    await user.save();
    res.json({ success: true, message: 'User promoted to admin' });
});

// Demote an admin to user
router.put('/demote/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'user';
    await user.save();
    res.json({ success: true, message: 'Admin demoted to user' });
});

// Delete a user (admin only)
router.delete('/delete/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    await user.remove();
    res.json({ success: true, message: 'User deleted successfully' });
});

module.exports = router;
