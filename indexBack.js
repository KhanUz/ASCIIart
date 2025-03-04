const IMAGE = "photos/kunj-parekh-Y5BD-H9qGvs-unsplash.jpg";
const SCALE = 8;
const output = document.getElementById("asciiOutput");
const characters = "_.;coPO?@#";
const CHARACTER_GRID_SIZE = 8;
const canvas = document.getElementById("canvasId");
const context = canvas.getContext("2d");

// Setting canvas
(async () => {
    const frame = await getFrame(IMAGE);
    output.style.width = canvas.style.width = frame.width + "px"; // ✅ Fixed
    output.style.height = canvas.style.height = frame.height + "px"; // ✅ Fixed

    canvas.width = frame.width;
    canvas.height = frame.height;

    let data = downscale(frame.data, 8, frame.width, frame.height);

    output.textContent = charDisplay(modifyFrame(data, rgbaToLuminChar));
    createImage(data);
})();

function charDisplay(lumin, width) {
    let output = "";
    for (let i = 0; i < lumin.length; i += 4) {
        output += characters[lumin[i]];
        // if (i === width - 4 || i === width + 4) {
        //     output += "/n";
        //     console.log(true);
        // }
    }
    console.log(lumin);

    return output;
}

async function getFrame(url) {
    return new Promise((resolve, reject) => {
        const frame = new Image();
        frame.crossOrigin = "Anonymous";
        frame.src = url;
        frame.onload = function () {
            const cnv = document.createElement("canvas");
            const ctx = cnv.getContext("2d");
            cnv.width = frame.width;
            cnv.height = frame.height;
            ctx.drawImage(frame, 0, 0);
            resolve(ctx.getImageData(0, 0, frame.width, frame.height));
        };
        frame.onerror = () => reject(new Error("Image loading failed"));
    });
}

function createImage(pixels) {
    const imageData = context.createImageData(canvas.width, canvas.height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);
}

function modifyFrame(pixels, callback) {
    let output = new Uint8ClampedArray(pixels.length);
    for (let i = 0; i < pixels.length; i += 4) {
        let newValue = callback(pixels[i], pixels[i + 1], pixels[i + 2]);
        output[i] = output[i + 1] = output[i + 2] = newValue;
        output[i + 3] = pixels[i + 3];
    }
    return output;
}

function upscale(pixels, scaleFactor, width, height) {
    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;
    if (!Number.isInteger(scaleFactor) || scaleFactor < 1) {
        throw new Error(
            "Scale factor must be a positive integer (e.g., 2, 3, 4)."
        );
    }

    const newWidth = width * scaleFactor;
    const newHeight = height * scaleFactor;
    const output = new Uint8ClampedArray(newHeight * newWidth * 4);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let index = (width * y + x) * 4;
            let r = pixels[index];
            let g = pixels[index + 1]; // ✅ Fixed
            let b = pixels[index + 2]; // ✅ Fixed
            let a = pixels[index + 3];

            for (let dy = 0; dy < scaleFactor; dy++) {
                for (let dx = 0; dx < scaleFactor; dx++) {
                    let newX = x * scaleFactor + dx;
                    let newY = y * scaleFactor + dy;
                    let newIndex = (newY * newWidth + newX) * 4;

                    output[newIndex] = r;
                    output[newIndex + 1] = g;
                    output[newIndex + 2] = b;
                    output[newIndex + 3] = a;
                }
            }
        }
    }
    return output;
}

function downscale(pixels, scaleFactor, width, height) {
    canvas.width = width / scaleFactor;
    canvas.height = height / scaleFactor;
    if (!Number.isInteger(scaleFactor) || scaleFactor < 1) {
        throw new Error(
            "Scale factor must be a positive integer (e.g., 2, 3, 4)."
        );
    }

    const newWidth = Math.floor(width / scaleFactor);
    const newHeight = Math.floor(height / scaleFactor);
    const output = new Uint8ClampedArray(newHeight * newWidth * 4);

    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            let oldX = Math.floor(x * scaleFactor);
            let oldY = Math.floor(y * scaleFactor);
            let oldIndex = (oldY * width + oldX) * 4;
            let newIndex = (y * newWidth + x) * 4;

            output[newIndex] = pixels[oldIndex]; // R
            output[newIndex + 1] = pixels[oldIndex + 1]; // G
            output[newIndex + 2] = pixels[oldIndex + 2]; // B
            output[newIndex + 3] = pixels[oldIndex + 3]; // A
        }
    }
    return output;
}

function rgbaToDesaturated(r, g, b, a) {
    return (r + g + b) / 3;
}
function rgbaToLuminance(r, g, b, a) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgbaToLuminChar(r, g, b, a) {
    return (Math.ceil(0.2126 * r + 0.7152 * g + 0.0722 * b) * 9) / 255;
}
    