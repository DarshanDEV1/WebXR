const urlParams = new URLSearchParams(window.location.search);
const meetingCode = urlParams.get('code');

if (meetingCode) {
    const codeElement = document.createElement('p');
    codeElement.innerText = `Meeting Code: ${meetingCode}`;
    codeElement.style.position = 'fixed';
    codeElement.style.top = '10px';
    codeElement.style.left = '10px';
    document.body.appendChild(codeElement);

    const signalingServer = {
        rooms: {},
        joinRoom: function(code, peerConnection) {
            if (!this.rooms[code]) this.rooms[code] = { peers: [], candidates: [] };
            this.rooms[code].peers.push(peerConnection);
            return this.rooms[code].peers;
        },
        sendOffer: function(code, offer) {
            this.rooms[code].peers.forEach(peer => {
                peer.setRemoteDescription(offer).then(() => {
                    peer.createAnswer().then(answer => {
                        peer.setLocalDescription(answer);
                        this.sendAnswer(code, answer);
                    });
                });
            });
        },
        sendAnswer: function(code, answer) {
            this.rooms[code].peers[0].setRemoteDescription(answer);
        },
        sendCandidate: function(code, candidate) {
            this.rooms[code].candidates.push(candidate);
            this.rooms[code].peers.forEach(peer => {
                peer.addIceCandidate(candidate);
            });
        },
        receiveCandidate: function(code, peerConnection) {
            this.rooms[code].candidates.forEach(candidate => {
                peerConnection.addIceCandidate(candidate);
            });
        }
    };

    let peerConnections = [];

    const createPeerConnection = (code) => {
        const configuration = {
            'iceServers': [{
                'urls': 'stun:stun.l.google.com:19302'
            }]
        };
        const peerConnection = new RTCPeerConnection(configuration);
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                signalingServer.sendCandidate(code, event.candidate);
            }
        };
        return peerConnection;
    };

    // Host logic
    if (localStorage.getItem('meetingCode') === meetingCode) {
        document.getElementById('startShare').style.display = 'block';

        document.getElementById('startShare').addEventListener('click', async function() {
            try {
                const displayMediaOptions = {
                    video: {
                        cursor: "always"
                    },
                    audio: false
                };
                const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
                const videoElement = document.getElementById('sharedScreen');
                videoElement.srcObject = stream;

                document.getElementById('vr-container').style.display = 'block';
                document.getElementById('controls').style.display = 'block';

                const peerConnection = createPeerConnection(meetingCode);
                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

                peerConnection.createOffer().then(offer => {
                    peerConnection.setLocalDescription(offer);
                    signalingServer.joinRoom(meetingCode, peerConnection);
                    signalingServer.sendOffer(meetingCode, offer);
                });

                peerConnections.push(peerConnection);
            } catch (err) {
                console.error("Error: " + err);
            }
        });
    } else {
        // Participant logic
        const stream = new MediaStream();
        const videoElement = document.getElementById('sharedScreen');
        videoElement.srcObject = stream;

        const peerConnection = createPeerConnection(meetingCode);
        peerConnection.ontrack = event => {
            stream.addTrack(event.track);
        };

        signalingServer.joinRoom(meetingCode, peerConnection);

        peerConnection.createAnswer().then(answer => {
            peerConnection.setLocalDescription(answer);
            signalingServer.sendAnswer(meetingCode, answer);
        });

        signalingServer.receiveCandidate(meetingCode, peerConnection);

        document.getElementById('vr-container').style.display = 'block';
        document.getElementById('controls').style.display = 'block';

        peerConnections.push(peerConnection);
    }
}
