const socket = io();

document.getElementById('createMeeting').addEventListener('click', createMeeting);
document.getElementById('joinMeeting').addEventListener('click', showJoinMeeting);
document.getElementById('joinButton').addEventListener('click', joinMeeting);

let meetingCode;
let peerConnection;
let viewerId;

const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function createMeeting() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('createMeetingSection').classList.remove('hidden');
    meetingCode = generateCode();
    document.getElementById('meetingCode').textContent = meetingCode;
    socket.emit('createMeeting', meetingCode);
    startScreenSharing();
}

function showJoinMeeting() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('joinMeetingSection').classList.remove('hidden');
}

function joinMeeting() {
    const code = document.getElementById('joinCode').value;
    socket.emit('joinMeeting', code);
}

function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

async function startScreenSharing() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        document.getElementById('screenVideo').srcObject = stream;
        setupPeerConnection(stream, true);
    } catch (err) {
        console.error('Error sharing screen: ', err);
    }
}

function setupPeerConnection(stream, isHost) {
    peerConnection = new RTCPeerConnection(config);

    if (isHost) {
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    }

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('candidate', { candidate: event.candidate, target: isHost ? viewerId : meetingCode });
        }
    };

    if (isHost) {
        socket.on('viewerJoined', async (viewerSocketId) => {
            viewerId = viewerSocketId;
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('offer', { offer, target: viewerId, sender: socket.id });
        });
    } else {
        peerConnection.ontrack = event => {
            document.getElementById('viewVideo').srcObject = event.streams[0];
        };

        socket.on('offer', async (data) => {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('answer', { answer, target: data.sender });
            } catch (err) {
                console.error('Error setting remote description and creating answer:', err);
            }
        });
    }

    socket.on('answer', async (data) => {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
            console.error('Error setting remote description:', err);
        }
    });

    socket.on('candidate', async (data) => {
        if (data.candidate) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
                console.error('Error adding ICE candidate:', err);
            }
        }
    });
}

socket.on('invalidCode', () => {
    alert('Invalid Meeting Code');
    document.getElementById('joinMeetingSection').classList.remove('hidden');
    document.getElementById('viewMeetingSection').classList.add('hidden');
});

socket.on('hostDisconnected', () => {
    alert('Host has disconnected');
    location.reload();
});

socket.on('joinMeetingSuccess', (code) => {
    document.getElementById('joinMeetingSection').classList.add('hidden');
    document.getElementById('viewMeetingSection').classList.remove('hidden');
    meetingCode = code;
    setupPeerConnection(null, false);
});
