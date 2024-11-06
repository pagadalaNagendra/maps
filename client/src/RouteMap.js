import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Image URLs for dustbin icons
const fullDustbinImage = 'https://res.cloudinary.com/dxoq1rrh4/image/upload/v1729754608/Angry_Red_Recycle_Bin_Character-removebg-preview_qtul5w.png';
const notFullDustbinImage = 'https://res.cloudinary.com/dxoq1rrh4/image/upload/v1729678902/EMPTYDUSTBIN-removebg-preview_oxdgtx.png';

// Dustbin marker icons using images
const fullDustbinIcon = L.icon({
  iconUrl: fullDustbinImage,
  iconSize: [70, 70],
  iconAnchor: [35, 70]
});

const notFullDustbinIcon = L.icon({
  iconUrl: notFullDustbinImage,
  iconSize: [70, 70],
  iconAnchor: [35, 70]
});

// Dustbin locations data inside IIIT Hyderabad
const dustbinLocations = [
  { id: 1, lat: 17.443299, lng: 78.348365, isFull: true },
  { id: 2, lat: 17.44509, lng: 78.34605, isFull: true },
  { id: 3, lat: 17.444200, lng: 78.347800, isFull: true },
  { id: 4, lat: 17.445892, lng: 78.351283, isFull: false },
  { id: 5, lat: 17.445016, lng: 78.349753, isFull: true },
  { id: 6, lat: 17.446500, lng: 78.350500, isFull: true },
];

// Enhanced route component
const RoadBasedRoute = ({ coordinates }) => {
  return <Polyline positions={coordinates} color="purple" weight={4} opacity={0.6} />;
};

// Fit map bounds to dustbin locations
const FitBounds = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds);
    }
  }, [locations, map]);

  return null;
};

const DustbinMap = () => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [boardingPoints, setBoardingPoints] = useState([]);

  // Fetch route for full dustbins
  useEffect(() => {
    const fullDustbins = dustbinLocations.filter(loc => loc.isFull);
    
    if (fullDustbins.length > 1) {
      const routesPromises = fullDustbins.map((dustbin, index) => {
        if (index < fullDustbins.length - 1) {
          const start = [dustbin.lng, dustbin.lat]; // Start position (lng, lat)
          const end = [fullDustbins[index + 1].lng, fullDustbins[index + 1].lat]; // Next dustbin position (lng, lat)

          const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

          return axios.get(url)
            .then(response => {
              const route = response.data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
              return route; // Return the route for this segment
            })
            .catch(err => {
              console.error('Error fetching route from OSRM', err);
              return []; // Return empty if error occurs
            });
        }
        return Promise.resolve([]); // Skip last dustbin
      });

      // Resolve all routes and flatten the array
      Promise.all(routesPromises).then(routes => {
        const flatRoutes = [].concat(...routes); // Flatten the array of routes
        setRouteCoordinates(flatRoutes);
      });

      // Set boarding points for the full dustbins
      const boardingPoints = fullDustbins.map(dustbin => ({
        id: dustbin.id,
        lat: dustbin.lat,
        lng: dustbin.lng,
      }));
      setBoardingPoints(boardingPoints);
    }
  }, []);

  return (
    <div>
      <MapContainer
        center={[17.4455, 78.3492]}
        zoom={18}
        style={{ height: '1000px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {dustbinLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={loc.isFull ? fullDustbinIcon : notFullDustbinIcon}
          >
            {loc.isFull && (
              <Popup>
                <strong>Full Dustbin</strong>
                <p>ID: {loc.id}</p>
              </Popup>
            )}
          </Marker>
        ))}

        {boardingPoints.map(point => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={L.divIcon({ className: 'boarding-point', iconSize: [20, 20], html: '<div style="background-color: green; border-radius: 50%; width: 20px; height: 20px;"></div>' })}
          >
            <Popup>
              <strong>Boarding Point</strong>
              <p>ID: {point.id}</p>
            </Popup>
          </Marker>
        ))}

        {routeCoordinates.length > 0 && (
          <RoadBasedRoute coordinates={routeCoordinates} />
        )}

        <FitBounds locations={dustbinLocations} />
      </MapContainer>
    </div>
  );
};

export default DustbinMap;
