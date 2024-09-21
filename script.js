let img;
let canvas;
let processedImg;
let originalFilename = '';

function setup() {
    canvas = createCanvas(0, 0);
    canvas.parent('canvasContainer');
    background(248, 249, 250);
    noLoop(); // Disable continuous looping
}

function draw() {
    if (processedImg) {
        image(processedImg, 0, 0, width, height);
    } else if (img) {
        image(img, 0, 0, width, height);
    }
}

function applyDithering() {
    if (!img) {
        console.log("No image loaded");
        return; // Exit if no image is loaded
    }

    console.log("Applying dithering");
    let contrast = parseFloat(document.getElementById('contrast').value);
    let threshold = parseInt(document.getElementById('threshold').value);
    let effectScale = parseInt(document.getElementById('scale').value);
    let algorithm = document.getElementById('ditheringAlgorithm').value;

    processedImg = createImage(img.width, img.height);
    processedImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    processedImg.filter(GRAY);

    applyContrast(processedImg, contrast);
    
    processedImg.loadPixels();
    
    switch (algorithm) {
        case 'floydSteinberg':
            floydSteinbergDithering(processedImg, threshold, effectScale);
            break;
        case 'atkinson':
            atkinsonDithering(processedImg, threshold, effectScale);
            break;
        case 'ordered':
            orderedDithering(processedImg, threshold, effectScale);
            break;
        case 'bayer':
            bayerDithering(processedImg, threshold, effectScale);
            break;
        case 'sierra':
            sierraDithering(processedImg, threshold, effectScale);
            break;
    }

    processedImg.updatePixels();
    redraw(); // Force p5.js to redraw the canvas
}

function resizeCanvasToFit(img) {
    let containerWidth = document.getElementById('canvasContainer').clientWidth;
    let containerHeight = document.getElementById('canvasContainer').clientHeight;
    let imgAspect = img.width / img.height;
    let containerAspect = containerWidth / containerHeight;

    if (imgAspect > containerAspect) {
        resizeCanvas(containerWidth, containerWidth / imgAspect);
    } else {
        resizeCanvas(containerHeight * imgAspect, containerHeight);
    }
    console.log("Canvas resized to", width, height);
}

function applyContrast(img, amount) {
    img.loadPixels();
    for (let i = 0; i < img.pixels.length; i += 4) {
        let gray = img.pixels[i];
        let newVal = constrain((gray - 128) * amount + 128, 0, 255);
        img.pixels[i] = img.pixels[i + 1] = img.pixels[i + 2] = newVal;
    }
    img.updatePixels();
}

function floydSteinbergDithering(img, threshold, scale) {
    for (let y = 0; y < img.height; y += scale) {
        for (let x = 0; x < img.width; x += scale) {
            let index = (x + y * img.width) * 4;
            let oldPixel = img.pixels[index];
            let newPixel = oldPixel < threshold ? 0 : 255;
            
            for (let dy = 0; dy < scale && y + dy < img.height; dy++) {
                for (let dx = 0; dx < scale && x + dx < img.width; dx++) {
                    let idx = ((x + dx) + (y + dy) * img.width) * 4;
                    img.pixels[idx] = img.pixels[idx + 1] = img.pixels[idx + 2] = newPixel;
                }
            }
            
            let error = oldPixel - newPixel;
            distributeError(img, x, y, error, 7/16, 3/16, 5/16, 1/16, scale);
        }
    }
}

function atkinsonDithering(img, threshold, scale) {
    for (let y = 0; y < img.height; y += scale) {
        for (let x = 0; x < img.width; x += scale) {
            let index = (x + y * img.width) * 4;
            let oldPixel = img.pixels[index];
            let newPixel = oldPixel < threshold ? 0 : 255;
            
            for (let dy = 0; dy < scale && y + dy < img.height; dy++) {
                for (let dx = 0; dx < scale && x + dx < img.width; dx++) {
                    let idx = ((x + dx) + (y + dy) * img.width) * 4;
                    img.pixels[idx] = img.pixels[idx + 1] = img.pixels[idx + 2] = newPixel;
                }
            }
            
            let error = (oldPixel - newPixel) / 8;
            distributeError(img, x, y, error, 1, 1, 1, 1, 1, 1, scale);
        }
    }
}

function orderedDithering(img, threshold, scale) {
    let matrix = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ];

    for (let y = 0; y < img.height; y += scale) {
        for (let x = 0; x < img.width; x += scale) {
            let index = (x + y * img.width) * 4;
            let oldPixel = img.pixels[index];
            let matrixValue = matrix[(y / scale) % 4][(x / scale) % 4];
            let scaledThreshold = threshold + (matrixValue - 8) * 16;
            let newPixel = oldPixel < scaledThreshold ? 0 : 255;
            
            for (let dy = 0; dy < scale && y + dy < img.height; dy++) {
                for (let dx = 0; dx < scale && x + dx < img.width; dx++) {
                    let idx = ((x + dx) + (y + dy) * img.width) * 4;
                    img.pixels[idx] = img.pixels[idx + 1] = img.pixels[idx + 2] = newPixel;
                }
            }
        }
    }
}

function bayerDithering(img, threshold, scale) {
    let matrix = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ];

    for (let y = 0; y < img.height; y += scale) {
        for (let x = 0; x < img.width; x += scale) {
            let index = (x + y * img.width) * 4;
            let oldPixel = img.pixels[index];
            let matrixValue = matrix[(y / scale) % 4][(x / scale) % 4];
            let scaledThreshold = threshold + (matrixValue / 16 - 0.5) * 255;
            let newPixel = oldPixel < scaledThreshold ? 0 : 255;
            
            for (let dy = 0; dy < scale && y + dy < img.height; dy++) {
                for (let dx = 0; dx < scale && x + dx < img.width; dx++) {
                    let idx = ((x + dx) + (y + dy) * img.width) * 4;
                    img.pixels[idx] = img.pixels[idx + 1] = img.pixels[idx + 2] = newPixel;
                }
            }
        }
    }
}

function sierraDithering(img, threshold, scale) {
    for (let y = 0; y < img.height; y += scale) {
        for (let x = 0; x < img.width; x += scale) {
            let index = (x + y * img.width) * 4;
            let oldPixel = img.pixels[index];
            let newPixel = oldPixel < threshold ? 0 : 255;
            
            for (let dy = 0; dy < scale && y + dy < img.height; dy++) {
                for (let dx = 0; dx < scale && x + dx < img.width; dx++) {
                    let idx = ((x + dx) + (y + dy) * img.width) * 4;
                    img.pixels[idx] = img.pixels[idx + 1] = img.pixels[idx + 2] = newPixel;
                }
            }
            
            let error = oldPixel - newPixel;
            distributeError(img, x, y, error, 5/32, 3/32, 2/32, 4/32, 5/32, 4/32, 2/32, 2/32, 3/32, 2/32, scale);
        }
    }
}

function distributeError(img, x, y, err, ...coeffs) {
    let scale = coeffs.pop();
    let offsets = [
        [1, 0], [2, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [-2, 2], [-1, 2], [0, 2], [1, 2]
    ];
    for (let i = 0; i < coeffs.length; i++) {
        let newX = x + offsets[i][0] * scale;
        let newY = y + offsets[i][1] * scale;
        if (newX >= 0 && newX < img.width && newY >= 0 && newY < img.height) {
            let index = (newX + newY * img.width) * 4;
            img.pixels[index] = constrain(img.pixels[index] + err * coeffs[i], 0, 255);
        }
    }
}

document.getElementById('imageInput').addEventListener('change', function(e) {
    let file = e.target.files[0];
    console.log("File selected:", file.name);
    originalFilename = file.name.split('.').slice(0, -1).join('.');
    let reader = new FileReader();
    reader.onload = function(event) {
        console.log("File read successfully");
        loadImage(event.target.result, function(loadedImg) {
            console.log("Image loaded", loadedImg.width, loadedImg.height);
            img = loadedImg;
            resizeCanvasToFit(img);
            applyDithering(); // Apply dithering immediately after loading
        });
    }
    reader.readAsDataURL(file);
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    // Initialize slider values
    updateSliderValue('contrast', 'contrastValue');
    updateSliderValue('threshold', 'thresholdValue');
    updateSliderValue('scale', 'scaleValue');
});

function updateSliderValue(sliderId, valueId) {
    let slider = document.getElementById(sliderId);
    let valueDisplay = document.getElementById(valueId);
    valueDisplay.textContent = slider.value;
}

// Add event listeners for sliders and algorithm selection
document.getElementById('contrast').addEventListener('input', function() {
    updateSliderValue('contrast', 'contrastValue');
    applyDithering();
});

document.getElementById('threshold').addEventListener('input', function() {
    updateSliderValue('threshold', 'thresholdValue');
    applyDithering();
});

document.getElementById('scale').addEventListener('input', function() {
    updateSliderValue('scale', 'scaleValue');
    applyDithering();
});

document.getElementById('ditheringAlgorithm').addEventListener('change', applyDithering);

// Export functionality
document.getElementById('exportButton').addEventListener('click', function() {
    if (canvas && canvas.elt) {
        let defaultName = `${originalFilename || 'image'}_dither.png`;
        
        // Convert the canvas to a blob
        canvas.elt.toBlob(function(blob) {
            if (blob) {
                // Create a temporary URL for the blob
                let url = URL.createObjectURL(blob);
                
                // Create a temporary link element
                let downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = defaultName;
                
                // Append to the body, trigger click, and remove
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                // Release the blob URL
                URL.revokeObjectURL(url);
            } else {
                console.error('Failed to create blob from canvas');
            }
        }, 'image/png');
    } else {
        console.error('Canvas is not available');
        alert('Please load and process an image before exporting.');
    }
});

// Reset functionality
document.getElementById('resetButton').addEventListener('click', function() {
    document.getElementById('contrast').value = 1;
    document.getElementById('threshold').value = 128;
    document.getElementById('scale').value = 2;
    document.getElementById('ditheringAlgorithm').value = 'floydSteinberg';
    
    updateSliderValue('contrast', 'contrastValue');
    updateSliderValue('threshold', 'thresholdValue');
    updateSliderValue('scale', 'scaleValue');
    
    if (img) {
        applyDithering();
    }
});