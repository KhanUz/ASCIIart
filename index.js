const output = document.getElementById("asciiOutput");
const canvas = document.getElementById("canvasId");
const videoEl = document.createElement("video");
const context = canvas.getContext("2d", {
    willReadFrequently: true,
    alpha: false,
});
const imgUpload = document.getElementById("ImageFile");
const videoUpload = document.getElementById("VideoFile");
// setting input
const settingBar = document.getElementById("setting-group");
const settingToggleBtn = document.getElementById("settingsBtn");
const playPause = document.getElementById("video-controller");

const charsInput = document.getElementById("char-input");
const scaleInput = document.getElementById("scale-input");
const colorInput = document.getElementById("color-input");
const FPS = 40;
// // setting values
// let characters = charsInput.value;
// let SCALE = 15;
let currentMode = null;
let animationId = null;
function processCurrent() {
    if (currentMode == "image") processImage();
    else if (currentMode == "video") processVideo();
}

charsInput.addEventListener("input", () => {
    characters = charsInput.value;
    if (currentMode == "image" || videoEl.paused) processImage();
});
scaleInput.addEventListener("input", () => {
    scale = scaleInput.value;
    if (currentMode == "image" || videoEl.paused) processImage();
});

colorInput.addEventListener("input", () => {
    output.style.color = colorInput.value;
});

let characters = " .;coOP?#";
//  ░▒▓
let newWidth, newHeight;
let scale = scaleInput.value;
function toggleCanvas() {
    const btn = document.getElementById("toggle-canvas");
    btn.classList.toggle("btn-primary");
    btn.classList.toggle("text-primary");
    showHide(canvas);
}
function setupCanvas() {
    output.innerHTML = "";
    const fontSize = Math.min(
        window.innerWidth / newWidth,
        window.innerHeight / newHeight
    );
    canvas.style.width = fontSize * newWidth + "px";
    canvas.style.height = fontSize * newHeight + "px";
    output.style.fontSize = fontSize + "px";
}

imgUpload.addEventListener("change", async (event) => {
    imageUploadHandler(event.target.files[0]);
});
videoUpload.addEventListener("input", async (event) => {
    videoUploadHandler(event.target.files[0]);
    setVideoController();
});
function setVideoController() {
    playPause.classList.remove("d-none");
    playPause.addEventListener("click", () => {
        playPause.firstChild.classList.toggle("bi-play-btn");
        playPause.style.color = colorInput.value;
        if (!videoEl.paused) {
            videoEl.pause();
            stopProcessing();
        } else {
            videoEl.play();
            processVideo();
        }
    });
}
function videoUploadHandler(file) {
    currentMode = "video";
    if (!file) {
        return;
    }

    if (videoEl.src) {
        URL.revokeObjectURL(videoEl.src);
    }

    const url = URL.createObjectURL(file);
    videoEl.src = url;
    videoEl.onloadeddata = function () {
        videoEl.play();
        processVideo();
    };
}

function imageUploadHandler(file) {
    currentMode = "image";
    if (!file) {
        return;
    }
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            processImage();
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}
function stopProcessing() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}
function processVideo() {
    if (videoEl.paused || videoEl.ended) return;
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    newWidth = Math.ceil(videoEl.videoWidth / scale);
    newHeight = Math.ceil(videoEl.videoHeight / scale);
    setupCanvas();
    context.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    // Get pixel data of the current frame
    output.innerHTML = downscaledASCII(
        context.getImageData(0, 0, videoEl.videoWidth, videoEl.videoHeight)
            .data,
        scale,
        videoEl.videoWidth,
        videoEl.videoHeight,
        characters
    );

    setTimeout(() => {
        animationId = requestAnimationFrame(processVideo);
    }, 1000 / FPS);
}
function processImage() {
    playPause.classList.add("d-none");
    newWidth = Math.ceil(canvas.width / scale);
    newHeight = Math.ceil(canvas.height / scale);
    setupCanvas();

    let imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    ).data;

    output.innerHTML = downscaledASCII(
        imageData,
        scale,
        canvas.width,
        canvas.height,
        characters
    );
    imageData = null;
}

function rgbaToLuminChar(r, g, b, charLen) {
    let luminance = (r * 77 + g * 150 + b * 29) >> 8; // value / 2^8 and to integer
    return (luminance * charLen) >> 8; //  suppose (255 * charLen) / 256
}

function downscaledASCII(
    pixels,
    scaleFactor,
    origWidth,
    origHeight,
    characters
) {
    let newWidth = Math.floor(origWidth / scaleFactor);
    let newHeight = Math.floor(origHeight / scaleFactor);
    let str = "";
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            let srcX = Math.floor(x * scaleFactor);
            let srcY = Math.floor(y * scaleFactor);
            let index = (srcY * origWidth + srcX) * 4;
            let charIndex = rgbaToLuminChar(
                pixels[index],
                pixels[index + 1],
                pixels[index + 2],
                characters.length
            );

            str += characters[charIndex];
        }
        str += "<br>";
    }

    return str;
}
