/**
 * Secure Admin Login Script
 * Uses backend API for authentication instead of client-side validation
 */

import { ApiService } from '../../assets/js/api-service-backend.js';
import { CONFIG } from '../../assets/js/config-backend.js';

// Check if already logged in
if (CONFIG.isAuthenticated()) {
    window.location.href = 'index.html';
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validate input
    if (!username || !password) {
        errorMsg.textContent = 'Username dan password harus diisi!';
        errorMsg.classList.remove('hidden');
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Memproses...';
    submitBtn.disabled = true;
    errorMsg.classList.add('hidden');
    
    try {
        // Call backend login API
        const response = await ApiService.login(username, password);
        
        if (response.success) {
            // Login successful, redirect to admin dashboard
            window.location.href = 'index.html';
        } else {
            throw new Error(response.message || 'Login gagal');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        errorMsg.textContent = error.message || 'Username atau password salah!';
        errorMsg.classList.remove('hidden');
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});
