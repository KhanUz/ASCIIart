import cv2
import numpy as np
import matplotlib.pyplot as plt


def analyze_brightness(image_path):
    # Load image in grayscale
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print("Error loading image.")
        return

    # Get image dimensions
    height, width = img.shape

    # Define block size (24x24)
    block_size = 42

    # Create a copy of the image to draw the overlay
    img_with_overlay = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    # Calculate the min and max brightness in the image
    min_brightness = np.min(img)
    max_brightness = np.max(img)

    # Map brightness to a scale of 1 to 9
    def map_brightness_to_scale(brightness, min_brightness, max_brightness):
        return int(np.interp(brightness, [min_brightness, max_brightness], [1, 99]))

    # Iterate over the image in 24x24 blocks
    for y in range(0, height, block_size):
        for x in range(0, width, block_size):
            # Get the 24x24 block
            block = img[y : y + block_size, x : x + block_size]

            # Compute the average brightness for the block
            avg_brightness = np.mean(block)

            # Map the average brightness to a scale of 1 to 9
            brightness_scale = map_brightness_to_scale(
                avg_brightness, min_brightness, max_brightness
            )

            # Overlay the brightness value (scale 1 to 9) on the image
            text = str(brightness_scale)
            position = (x + 5, y + 15)  # Slightly offset for better visibility
            cv2.putText(
                img_with_overlay,
                text,
                position,
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                1,
            )

    # Display results
    print(f"Image dimensions: {width}x{height}")
    print("Brightness overlay (1 to 9) added.")

    # Show the image with overlays
    plt.figure(figsize=(10, 10))
    plt.imshow(cv2.cvtColor(img_with_overlay, cv2.COLOR_BGR2RGB))
    plt.title("Image with Brightness Overlay (1 to 9)")
    plt.axis("off")
    plt.show()


# Example usage
analyze_brightness("./square_sample_26.png")
