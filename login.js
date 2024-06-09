document.getElementById('hostBtn').addEventListener('click', function() {
    document.getElementById('hostForm').style.display = 'block';
    document.getElementById('joinForm').style.display = 'none';
});

document.getElementById('joinBtn').addEventListener('click', function() {
    document.getElementById('joinForm').style.display = 'block';
    document.getElementById('hostForm').style.display = 'none';
});

document.getElementById('generateCode').addEventListener('click', function() {
    const code = Math.random().toString(36).substr(2, 9);
    document.getElementById('meetingCode').innerText = `Meeting Code: ${code}`;
    document.getElementById('meetingCode').style.display = 'block';
    localStorage.setItem('meetingCode', code);
    window.location.href = `share.html?code=${code}`;
});

document.getElementById('joinMeetingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const code = document.getElementById('meetingCodeInput').value;
    window.location.href = `share.html?code=${code}`;
});
