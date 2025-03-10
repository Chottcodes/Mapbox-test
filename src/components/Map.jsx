import React, { useCallback, useState, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hvdHQxIiwiYSI6ImNtODJsYXprMzFncGQybW9reWNybXJ4b2wifQ.QQ-aNxCoES_RC-x8Up3ZlQ';

const MapComponent = () => {
  const [viewState, setViewState] = useState({
    latitude: 37.7577,
    longitude: -122.4376,
    zoom: 8,
    bearing: 0,
    pitch: 0
  });

  // State for current user location
  const [userLocation, setUserLocation] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [error, setError] = useState(null);
  
  // Function to handle successful position acquisition
  const handlePositionSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    setUserLocation({
      latitude,
      longitude,
      timestamp: position.timestamp
    });
    
    // Update view state to follow user's position
    if (trackingActive) {
      setViewState(prev => ({
        ...prev,
        latitude,
        longitude
      }));
    }
    
    setError(null);
  };
  
  // Function to handle geolocation errors
  const handlePositionError = (err) => {
    setError(`Error getting location: ${err.message}`);
    setTrackingActive(false);
  };
  
  // Toggle live tracking
  const toggleTracking = () => {
    if (!trackingActive) {
      startTracking();
    } else {
      stopTracking();
    }
  };
  
  // Start live tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    
    setTrackingActive(true);
  };
  
  // Stop live tracking
  const stopTracking = () => {
    setTrackingActive(false);
  };
  
  // Set up geolocation watcher when tracking is activated
  useEffect(() => {
    let watchId = null;
    
    if (trackingActive) {
      watchId = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
      
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        handlePositionError,
        { enableHighAccuracy: true }
      );
    }
    
    // Clean up by clearing the watch when component unmounts or tracking is turned off
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [trackingActive]);
  
  const onMove = useCallback(({ viewState }) => {
    setViewState(viewState);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }} className="map-container">
      {/* Tracking controls */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 1, 
        background: 'white', 
        padding: '10px', 
        borderRadius: '4px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button 
          onClick={toggleTracking}
          style={{
            padding: '8px 12px',
            background: trackingActive ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {trackingActive ? 'Stop Tracking' : 'Start Live Tracking'}
        </button>
        
        {userLocation && (
          <div style={{ fontSize: '12px' }}>
            <div>Lat: {userLocation.latitude.toFixed(6)}</div>
            <div>Lng: {userLocation.longitude.toFixed(6)}</div>
            <div>Last updated: {new Date(userLocation.timestamp).toLocaleTimeString()}</div>
          </div>
        )}
        
        {error && (
          <div style={{ color: 'red', fontSize: '12px' }}>{error}</div>
        )}
      </div>
      
      <Map
        reuseMaps
        mapLib={mapboxgl}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        {...viewState}
        onMove={onMove}
      >
        <NavigationControl position="top-right" />
        
        {/* Static marker */}
        <Marker longitude={-122.4376} latitude={37.7577}>
          <div>📍</div>
        </Marker>
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            longitude={userLocation.longitude} 
            latitude={userLocation.latitude}
          >
            <div style={{
              width: '24px',
              height: '24px',
              background: '#4285F4',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '14px'
              }}>
                📱
              </div>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
};

export default MapComponent;