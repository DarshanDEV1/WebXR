document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const secret = document.getElementById('secret').value;

    if (username === 'admin' && password === 'password' && secret === '1234') {
        window.location.href = 'share.html';
    } else {
        alert('Invalid credentials or secret code');
    }
});
