# Carbon Footprint Analyzer

A web application that analyzes images to determine the carbon footprint of objects in the image.

## Features

- **Image Upload**: Upload images from your device to analyze their carbon footprint
- **Camera Capture**: Use your device's camera to take photos for analysis
- **Sample Images**: Browse and select from a collection of sample images to analyze
- **Improved Camera Functionality**: Enhanced camera switching between front and back cameras on mobile devices
- **Detailed Analysis**: Get detailed information about the carbon footprint of objects in your images
- **Carbon Footprint Visualization**: Visual representation of carbon impact

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Google Gemini API for image analysis

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Google Gemini API key:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Choose one of the three options:
   - Upload an image from your device
   - Capture an image using your camera
   - Select a sample image
2. Wait for the analysis to complete
3. View the detailed carbon footprint information for objects in the image

## Mobile Camera Tips

If you experience issues with camera switching on mobile devices:
1. Try stopping the camera first, then starting it again
2. Make sure you've granted camera permissions to the application
3. Some devices may require multiple attempts to switch cameras

## License

This project is licensed under the MIT License - see the LICENSE file for details. 