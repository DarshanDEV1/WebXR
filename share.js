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
        document.getElementById('startShare').style.display = 'none';
    } catch (err) {
        console.error("Error: " + err);
    }
});

document.getElementById('increaseSize').addEventListener('click', function() {
    const videosphere = document.querySelector('a-videosphere');
    const currentRadius = videosphere.getAttribute('radius');
    videosphere.setAttribute('radius', currentRadius + 1);
});

document.getElementById('decreaseSize').addEventListener('click', function() {
    const videosphere = document.querySelector('a-videosphere');
    const currentRadius = videosphere.getAttribute('radius');
    if (currentRadius > 1) {
        videosphere.setAttribute('radius', currentRadius - 1);
    }
});
