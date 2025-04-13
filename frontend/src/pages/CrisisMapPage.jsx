import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMapGL, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl'; // Use the default export ReactMapGL
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '../services/api';
import CrisisCard from '../components/Crisis/CrisisCard'; // Create this component

// Make sure Mapbox token is set in your .env file
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN; // For Vite
// const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN; // For CRA


function CrisisMapPage() {
    const [crises, setCrises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCrisis, setSelectedCrisis] = useState(null);
    const [filters, setFilters] = useState({ type: '', severity: '' }); // Basic filters
    const [viewport, setViewport] = useState({
        latitude: 20.5937, // Centered on India approx.
        longitude: 78.9629,
        zoom: 4,
        pitch: 0,
        bearing: 0
    });

    const mapRef = useRef();

    const fetchCrises = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch from your backend proxy endpoint
            const { data } = await api.get('/crises/feed');
            // --- IMPORTANT ---
            // Adapt this based on the *actual* structure of the data
            // returned by localhost:3040/api
            // Assuming it's an array of objects with latitude, longitude, etc.
            // Example: Assuming data has { id, location: { coordinates: [lon, lat] }, disasterType, severityLevel, ... }
             if (Array.isArray(data)) {
                const formattedCrises = data
                    .map((item, index) => ({
                        // Generate a temporary unique key if no ID is present
                        id: item.id || `crisis-${index}-${Date.now()}`,
                        // Ensure location and coordinates exist and are numbers
                        latitude: parseFloat(item.location?.coordinates?.[1]),
                        longitude: parseFloat(item.location?.coordinates?.[0]),
                        type: item.disasterType || 'Unknown',
                        severity: item.severityLevel || 1, // Default severity if missing
                        // Include other fields needed for popup/card
                        userName: item.userName,
                        post: item.post,
                        date: item.date,
                        time: item.time,
                        // ...other fields from your API
                    }))
                    .filter(c => !isNaN(c.latitude) && !isNaN(c.longitude)); // Filter out items without valid coordinates

                setCrises(formattedCrises);
            } else {
                 console.error("Received non-array data from crisis feed:", data);
                 setError("Unexpected data format received from server.");
                 setCrises([]); // Clear crises if format is wrong
            }

        } catch (err) {
            console.error("Error fetching crisis feed:", err);
            setError(err.response?.data?.message || err.message || 'Failed to load crisis data.');
             setCrises([]); // Clear crises on error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCrises();
    }, [fetchCrises]); // Fetch on component mount

    // Filter logic (basic example)
    const filteredCrises = crises.filter(crisis => {
        const typeMatch = filters.type ? crisis.type.toLowerCase().includes(filters.type.toLowerCase()) : true;
        const severityMatch = filters.severity ? crisis.severity === parseInt(filters.severity) : true;
        return typeMatch && severityMatch;
    });

    // Helper to determine marker color based on severity
    const getMarkerColor = (severity) => {
        switch (severity) {
            case 5: return 'red';    // High
            case 4: return 'orange';
            case 3: return 'yellow';
            case 2: return 'lightblue';
            case 1: return 'green';  // Low
            default: return 'gray';
        }
    };


    return (
        <div className="h-[70vh] relative"> {/* Ensure map container has height */}
            <h2 className="text-2xl font-bold mb-4 text-center">Real-time Crisis Map</h2>

             {/* Filter Controls - Basic Example */}
             <div className="mb-4 flex flex-wrap gap-4 justify-center p-2 bg-gray-100 rounded">
                 <input
                     type="text"
                     placeholder="Filter by Type (e.g., Flood)"
                     value={filters.type}
                     onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                     className="px-2 py-1 border rounded"
                 />
                 <select
                     value={filters.severity}
                     onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                     className="px-2 py-1 border rounded"
                 >
                     <option value="">All Severities</option>
                     <option value="5">5 (High)</option>
                     <option value="4">4</option>
                     <option value="3">3</option>
                     <option value="2">2</option>
                     <option value="1">1 (Low)</option>
                 </select>
                 <button onClick={fetchCrises} disabled={loading} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50">
                    {loading ? 'Refreshing...' : 'Refresh Map'}
                 </button>
             </div>

             {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <ReactMapGL
                {...viewport}
                ref={mapRef}
                width="100%"
                height="100%"
                mapStyle="mapbox://styles/mapbox/streets-v11" // Use a Mapbox style
                mapboxAccessToken={MAPBOX_TOKEN}
                onMove={evt => setViewport(evt.viewState)} // Use onMove for react-map-gl v7+
                // onViewportChange is deprecated, use onMove instead
                // onViewportChange={nextViewport => setViewport(nextViewport)}
            >
                <NavigationControl position="top-right" />
                <GeolocateControl position="top-right" trackUserLocation={true} />

                {filteredCrises.map(crisis => (
                    <Marker
                        key={crisis.id}
                        latitude={crisis.latitude}
                        longitude={crisis.longitude}
                        offsetLeft={-20}
                        offsetTop={-10}
                    >
                        {/* Simple colored circle marker */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // prevent map click event
                                setSelectedCrisis(crisis);
                            }}
                            className="cursor-pointer border-none bg-transparent p-0"
                             title={`Type: ${crisis.type}, Severity: ${crisis.severity}`}
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: getMarkerColor(crisis.severity),
                                borderRadius: '50%',
                                border: '1px solid black',
                                opacity: 0.8
                            }}></div>
                        </button>
                    </Marker>
                ))}

                {selectedCrisis && (
                    <Popup
                        latitude={selectedCrisis.latitude}
                        longitude={selectedCrisis.longitude}
                        closeButton={true}
                        closeOnClick={false} // Keep popup open when map is clicked
                        onClose={() => setSelectedCrisis(null)}
                        anchor="top"
                        offset={15} // Adjust offset as needed
                         maxWidth="300px"
                    >
                         {/* Display basic crisis info in popup */}
                         {/* You can use the CrisisCard component here if designed for popups */}
                        <div>
                            <h3 className="text-md font-semibold mb-1">{selectedCrisis.type} (Severity: {selectedCrisis.severity})</h3>
                            <p className="text-sm text-gray-600">User: {selectedCrisis.userName || 'N/A'}</p>
                            <p className="text-sm text-gray-700">{selectedCrisis.post?.substring(0, 100) || 'No description'}{selectedCrisis.post?.length > 100 ? '...' : ''}</p>
                            <p className="text-xs text-gray-500">Time: {selectedCrisis.time} on {new Date(selectedCrisis.date).toLocaleDateString()}</p>
                            {/* Add Link to detailed view */}
                             <Link to={`/crisis/${selectedCrisis.id}`} className="text-blue-500 hover:underline text-sm mt-1 block">
                                View Details
                            </Link>
                        </div>
                    </Popup>
                )}
            </ReactMapGL>

            {loading && !error && <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center"><p className="text-white text-xl">Loading Map Data...</p></div>}
        </div>
    );
}

export default CrisisMapPage;