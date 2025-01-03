import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import Webcam from 'react-webcam';
import './PlantIdentifier.css';

const PlantIdentifier = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [plantDetails, setPlantDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [usingCamera, setUsingCamera] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const webcamRef = useRef(null);

  const onDrop = (acceptedFiles) => {
    setSelectedFile(acceptedFiles[0]);
    setError('');
  };

  const handleRetry = () => {
    setRetryCount(retryCount + 1);
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('images', selectedFile);
    formData.append('organs', 'leaf');

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://api.plant.id/v2/identify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Api-Key': 'JQttwtqyrVZXxI1Tyg30LdPFepEZjVrRTK0dqzNELLrUD6zWtR',
        },
      });

      setPlantDetails(response.data.suggestions[0].plant_details);
    } catch (error) {
      if (retryCount < 2) {
        handleRetry();
      } else {
        console.error('Error identifying the plant:', error);
        setError('Failed to identify the plant. Please try again.');
        setPlantDetails(null);
      }
    } finally {
      setLoading(false);
      setRetryCount(0);
    }
  };

  const handleSave = () => {
    const savedPlants = JSON.parse(localStorage.getItem('savedPlants')) || [];
    savedPlants.push(plantDetails);
    localStorage.setItem('savedPlants', JSON.stringify(savedPlants));
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "captured_image.jpg", { type: blob.type });
        setSelectedFile(file);
        setUsingCamera(false);
      });
  }, [webcamRef]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="container">
      <h1>Plant Identifier</h1>
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop a plant image here, or click to select one</p>
      </div>
      <button onClick={() => setUsingCamera(!usingCamera)}>
        {usingCamera ? 'Stop Camera' : 'Use Camera'}
      </button>
      {usingCamera && (
        <div className="camera">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
          />
          <button onClick={capture}>Capture Photo</button>
        </div>
      )}
      {selectedFile && (
        <div className="preview">
          <img src={URL.createObjectURL(selectedFile)} alt="preview" />
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <button onClick={handleSubmit}>Identify Plant</button>
      )}
      {error && <p className="error">{error}</p>}
      {plantDetails && (
        <div className="plant-details">
          <h2>Plant Details</h2>
          {plantDetails.common_names && (
            <p><strong>Common Name:</strong> {plantDetails.common_names.join(', ')}</p>
          )}
          {plantDetails.scientific_name && (
            <p><strong>Scientific Name:</strong> {plantDetails.scientific_name}</p>
          )}
          {plantDetails.description && (
            <p><strong>Description:</strong> {plantDetails.description}</p>
          )}
          <button onClick={toggleExpanded}>
            {expanded ? 'Hide Details' : 'Show More Details'}
          </button>
          {expanded && (
            <div className="additional-details">
              {plantDetails.care_tips && (
                <div>
                  <h3>Care Tips</h3>
                  <p><strong>Watering:</strong> {plantDetails.care_tips.watering}</p>
                  <p><strong>Sunlight:</strong> {plantDetails.care_tips.sunlight}</p>
                  <p><strong>Soil:</strong> {plantDetails.care_tips.soil}</p>
                  <p><strong>Temperature:</strong> {plantDetails.care_tips.temperature}</p>
                </div>
              )}
              {plantDetails.toxicity && (
                <div>
                  <h3>Toxicity Information</h3>
                  <p>{plantDetails.toxicity}</p>
                </div>
              )}
              {plantDetails.growth_details && (
                <div>
                  <h3>Growth Details</h3>
                  <p><strong>Height:</strong> {plantDetails.growth_details.height}</p>
                  <p><strong>Spread:</strong> {plantDetails.growth_details.spread}</p>
                  <p><strong>Growth Rate:</strong> {plantDetails.growth_details.growth_rate}</p>
                </div>
              )}
              {plantDetails.images && plantDetails.images.length > 0 && (
                <div className="additional-images">
                  <h3>Additional Images</h3>
                  {plantDetails.images.map((image, index) => (
                    <img key={index} src={image.url} alt={`Plant ${index}`} />
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={handleSave}>Save to My Plants</button>
        </div>
      )}
    </div>
  );
};

export default PlantIdentifier;