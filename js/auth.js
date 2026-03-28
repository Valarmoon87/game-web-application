// js/auth.js

// Check if user is logged in
function checkAuth() {
    const user = getLoggedInUser();
    if (!user && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
        window.location.href = 'login.html';
    }
    return user;
}

function getLoggedInUser() {
    return JSON.parse(localStorage.getItem('cyber_current_user'));
}

function login(username, password) {
    const users = JSON.parse(localStorage.getItem('cyber_registered_users')) || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Successful login
        localStorage.setItem('cyber_current_user', JSON.stringify(user));
        // Sync with main.js user system
        localStorage.setItem('cyber_user', JSON.stringify({
            username: user.username,
            xp: user.xp || 0,
            gamesPlayed: user.gamesPlayed || 0,
            badges: user.badges || [],
            scores: user.scores || {}
        }));
        return true;
    }
    return false;
}

function signup(username, password) {
    const users = JSON.parse(localStorage.getItem('cyber_registered_users')) || [];
    
    if (users.find(u => u.username === username)) {
        return { success: false, message: "User already exists" };
    }
    
    const newUser = {
        username: username,
        password: password,
        xp: 0,
        gamesPlayed: 0,
        badges: [],
        scores: {}
    };
    
    users.push(newUser);
    localStorage.setItem('cyber_registered_users', JSON.stringify(users));
    return { success: true };
}

function logout() {
    localStorage.removeItem('cyber_current_user');
    window.location.href = 'login.html';
}

// Logic for Login Form
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;
        
        if (login(user, pass)) {
            window.location.href = 'index.html';
        } else {
            alert('Invalid credentials. Access Denied.');
        }
    });
}

// Logic for Signup Form
if (document.getElementById('signup-form')) {
    document.getElementById('signup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('signup-username').value;
        const pass = document.getElementById('signup-password').value;
        
        const result = signup(user, pass);
        if (result.success) {
            alert('Registration Complete. You may now login.');
            window.location.href = 'login.html';
        } else {
            alert(result.message);
        }
    });
}

// Global Logout listener
document.addEventListener('click', (e) => {
    if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
        logout();
    }
});

// Run check on load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
