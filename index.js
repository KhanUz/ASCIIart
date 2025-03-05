const output = document.getElementById("asciiOutput");
const canvas = document.getElementById("canvasId");
const videoEl = document.createElement("video");
const context = canvas.getContext("2d", {
    willReadFrequently: true,
    alpha: false,
});
context.imageSmoothingEnabled = true;
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
let IMAGE = null;
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
    if (currentMode == "image" || videoEl.paused) processImage(IMAGE);
});

colorInput.addEventListener("input", () => {
    output.style.color = colorInput.value;
});

let characters = " .;coOP?#";

//  ░▒▓
let newWidth, newHeight;
let scale = scaleInput.value;

function setupCanvas() {
    output.innerHTML = "";
    const fontSize = Math.min(
        window.innerWidth / canvas.width,
        window.innerHeight / canvas.height
    );
    console.log(canvas.width);

    canvas.style.width = canvas.width * fontSize + "px";
    canvas.style.height = canvas.height * fontSize + "px";
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
            IMAGE = img;
            processImage(img);
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
    canvas.width = videoEl.videoWidth / scale;
    canvas.height = videoEl.videoHeight / scale;
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
function processImage(img) {
    canvas.width = img.width / scale;
    canvas.height = img.height / scale;
    setupCanvas();

    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    let pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    output.innerHTML = ASCII(pixels, characters);
}
function ASCII(pixels, characters) {
    // Use const for immutable variables
    const width = canvas.width;
    const height = canvas.height;

    // Improve readability by extracting complex calculations
    const getPixelIndex = (y, x) => {
        const adjustedY = (y + height) % height;
        const adjustedX = (x + width) % width;
        return (width * adjustedY + adjustedX) * 4;
    };

    // Precompute convolution kernels to improve readability
    const convolutionX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
    ];

    const convolutionY = [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
    ];

    // Use template literal for multi-line string building
    let output = "";

    // Improve nested loop performance by caching length
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Extract pixel neighborhood indices
            const indices = [
                getPixelIndex(y - 1, x - 1),
                getPixelIndex(y - 1, x),
                getPixelIndex(y - 1, x + 1),
                getPixelIndex(y, x - 1),
                getPixelIndex(y, x),
                getPixelIndex(y, x + 1),
                getPixelIndex(y + 1, x - 1),
                getPixelIndex(y + 1, x),
                getPixelIndex(y + 1, x + 1),
            ];

            // Compute Sobel operator convolution
            const computeConvolution = (kernel) => {
                return indices.reduce(
                    (sum, index, i) =>
                        sum + pixels[index] * kernel[Math.floor(i / 3)][i % 3],
                    0
                );
            };

            const changeX = computeConvolution(convolutionX);
            const changeY = computeConvolution(convolutionY);

            // Compute magnitude using more readable approach
            const magnitude = map(
                Math.sqrt(changeX * changeX + changeY * changeY),
                0,
                1414,
                0,
                255
            );

            // Simplify angle and character selection logic
            if (magnitude > 100) {
                // Use more precise angle mapping
                const angle = Math.atan2(changeY, changeX) * (180 / Math.PI);

                // Use a more comprehensive angle-to-character mapping
                const getDirectionChar = (angle) => {
                    if (angle >= -22.5 && angle < 22.5) return "-"; // Horizontal
                    if (angle >= 22.5 && angle < 67.5) return "/"; // Top-right diagonal
                    if (angle >= 67.5 && angle < 112.5) return "|"; // Vertical
                    if (angle >= 112.5 && angle < 157.5) return "\\"; // Bottom-right diagonal
                    if (angle >= -157.5 && angle < -112.5) return "\\"; // Bottom-left diagonal
                    if (angle >= -112.5 && angle < -67.5) return "/"; // Top-left diagonal
                    if (angle >= -67.5 && angle < -22.5) return "|"; // Vertical (left side)

                    return "-"; // Fallback
                };

                output += getDirectionChar(angle);
            } else {
                // Simplified luminance character selection
                const midPixelIndex = getPixelIndex(y, x);
                const luminanceChar = rgbaToLuminChar(
                    pixels[midPixelIndex],
                    pixels[midPixelIndex + 1],
                    pixels[midPixelIndex + 2],
                    characters.length
                );

                output += characters[0];
            }
        }

        // Use more standard line break
        output += "\n";
    }

    return output;
}
function map(value, inX, inY, outX, outY) {
    return ((value - inX) * (outY - outX)) / (inY - inX) + outX;
}
function rgbaToLuminChar(r, g, b, charLen) {
    let luminance = (r * 77 + g * 150 + b * 29) >> 8; // value / 2^8 and to integer
    return (luminance * charLen) >> 8; //  suppose (255 * charLen) / 256
}

function asciiArt(pixels, newWidth, newHeight, characters) {
    let output = "";
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            let index = (y * newWidth + x) * 4;
            let charIndex = rgbaToLuminChar(
                pixels[index],
                pixels[index + 1],
                pixels[index + 2],
                characters.length
            );

            output += characters[charIndex];
        }
        output += "<br>";
    }
    return output;
}

function toggleCanvas() {
    const btn = document.getElementById("toggle-canvas");
    btn.classList.toggle("btn-primary");
    btn.classList.toggle("text-primary");
    showHide(canvas);
}
