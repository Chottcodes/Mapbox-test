import React, { useCallback, useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl';
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
  
  // State for trail history
  const [trailCoordinates, setTrailCoordinates] = useState([]);
  const [showTrail, setShowTrail] = useState(true);
  
  // Create GeoJSON object for the trail
  const trailData = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: trailCoordinates
    }
  };
  
  // Function to handle successful position acquisition
  const handlePositionSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    
    // Update user location
    setUserLocation({
      latitude,
      longitude,
      timestamp: position.timestamp
    });
    
    // Add to trail if coordinates changed significantly
    if (trailCoordinates.length === 0 || 
        Math.abs(trailCoordinates[trailCoordinates.length - 1][0] - longitude) > 0.00001 ||
        Math.abs(trailCoordinates[trailCoordinates.length - 1][1] - latitude) > 0.00001) {
      
      setTrailCoordinates(prev => [...prev, [longitude, latitude]]);
    }
    
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
  
  // Toggle trail visibility
  const toggleTrail = () => {
    setShowTrail(prev => !prev);
  };
  
  // Clear the trail history
  const clearTrail = () => {
    setTrailCoordinates([]);
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
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={toggleTrail}
            style={{
              padding: '8px 12px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: showTrail ? 1 : 0.7,
              flex: 1
            }}
          >
            {showTrail ? 'Hide Trail' : 'Show Trail'}
          </button>
          
          <button 
            onClick={clearTrail}
            style={{
              padding: '8px 12px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1
            }}
            disabled={trailCoordinates.length === 0}
          >
            Clear Trail
          </button>
        </div>
        
        {userLocation && (
          <div style={{ fontSize: '12px' }}>
            <div>Lat: {userLocation.latitude.toFixed(6)}</div>
            <div>Lng: {userLocation.longitude.toFixed(6)}</div>
            <div>Last updated: {new Date(userLocation.timestamp).toLocaleTimeString()}</div>
            <div>Trail points: {trailCoordinates.length}</div>
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
        
        {/* Trail line */}
        {showTrail && trailCoordinates.length >= 2 && (
          <Source id="trail-data" type="geojson" data={trailData}>
            <Layer
              id="trail-line"
              type="line"
              paint={{
                'line-color': '#4285F4',
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}
        
        {/* Trail points */}
        {showTrail && trailCoordinates.length >= 2 && (
          <Source
            id="trail-points"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: trailCoordinates.map((coord, index) => ({
                type: 'Feature',
                properties: {
                  id: index,
                  isStart: index === 0,
                  isEnd: index === trailCoordinates.length - 1 && index !== 0
                },
                geometry: {
                  type: 'Point',
                  coordinates: coord
                }
              }))
            }}
          >
            <Layer
              id="trail-points-layer"
              type="circle"
              paint={{
                'circle-radius': [
                  'case',
                  ['==', ['get', 'isStart'], true], 6,
                  ['==', ['get', 'isEnd'], true], 6,
                  3
                ],
                'circle-color': [
                  'case',
                  ['==', ['get', 'isStart'], true], '#00FF00',
                  ['==', ['get', 'isEnd'], true], '#FF0000',
                  '#4285F4'
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF'
              }}
            />
          </Source>
        )}
        
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