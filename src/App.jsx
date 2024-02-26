import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";
import { BrowserRouter, Route, useNavigate } from "react-router-dom";
import Homepage from "./Homepage";

export function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const navigate = useNavigate();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    startVideo();
    videoRef && loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => {
      faceMyDetect();
    });
  };

  const faceMyDetect = () => {
    let isNavigated = false;
  
    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
  
      if (detections.length > 0 && !isNavigated) {
        const firstDetection = detections[0];
        if (isFaceStraight(firstDetection) && isFaceFullyVisible(firstDetection)) {
          handleNavigateToHomepage();
          isNavigated = true;
        }
      }
      
      // Drawing detections on canvas
      canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
      faceapi.matchDimensions(canvasRef.current, {
        width: 940,
        height: 650,
      });
  
      const resized = faceapi.resizeResults(detections, {
        width: 940,
        height: 650,
      });
  
      faceapi.draw.drawDetections(canvasRef.current, resized);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
      faceapi.draw.drawFaceExpressions(canvasRef.current, resized);
    }, 1000);
  };

  const isFaceStraight = (detection) => {
    if (
      detection &&
      detection.annotations &&
      detection.annotations.face &&
      detection.annotations.face[0]
    ) {
      const faceAnnotation = detection.annotations.face[0];
      if (faceAnnotation && faceAnnotation.roll !== undefined) {
        const { roll } = faceAnnotation;
        return roll >= -10 && roll <= 10;
      }
    }
    return false;
  };

  const isFaceFullyVisible = (detection) => {
    return (
      detection.landmarks.getLeftEye() &&
      detection.landmarks.getRightEye() &&
      detection.landmarks.getNose() &&
      detection.landmarks.getMouth()
    );
  };
  
  return (
    <div className="myapp">
      <h1>Face Detection</h1>
      <div className="appvide">
        <video crossOrigin="anonymous" ref={videoRef} autoPlay></video>
      </div>
      <canvas
        ref={canvasRef}
        width="940"
        height="650"
        className="appcanvas"
      />
    </div>
  );
}

export function Router() {
  return (
    <BrowserRouter>
      <Route path="/" element={<App />} />
      <Route path="/Homepage" element={<Homepage />} />
    </BrowserRouter>
  );
}