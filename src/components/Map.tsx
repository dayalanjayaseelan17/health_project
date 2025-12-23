"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Google Maps is available
    if (typeof window.google === "undefined" || typeof window.google.maps === "undefined") {
      setError("Google Maps script not loaded. Please check your API key and internet connection.");
      setLoading(false);
      return;
    }

    const initMap = (position: GeolocationPosition) => {
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      if (mapRef.current) {
        const newMap = new google.maps.Map(mapRef.current, {
          center: userLocation,
          zoom: 13,
          disableDefaultUI: true,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID, // Required for Advanced Markers
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.medical",
                stylers: [{ visibility: "on" }]
            },
          ],
        });

        // Add marker for user's location
        new google.maps.marker.AdvancedMarkerElement({
          map: newMap,
          position: userLocation,
          title: "Your Location",
        });

        const placesService = new google.maps.places.PlacesService(newMap);

        const request: google.maps.places.PlaceSearchRequest = {
          location: userLocation,
          radius: 5000, // 5km radius
          type: "hospital",
        };

        placesService.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            for (const place of results) {
              if (place.geometry?.location) {
                new google.maps.marker.AdvancedMarkerElement({
                  map: newMap,
                  position: place.geometry.location,
                  title: place.name,
                });
              }
            }
          } else {
            console.error("Places service failed with status:", status);
          }
        });
        
        setMap(newMap);
      }
      setLoading(false);
    };

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        initMap,
        (error) => {
          console.error("Geolocation error:", error);
          setError(
            "Could not get your location. Please enable location services in your browser."
          );
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, []);

  return (
    <div className="w-full h-96 rounded-lg shadow-md bg-gray-200 flex items-center justify-center">
      {loading && (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Finding nearby hospitals...</p>
        </div>
      )}
      {error && !loading && (
         <div className="text-center p-4">
            <p className="text-destructive font-semibold">Map Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
         </div>
      )}
      <div ref={mapRef} className={`w-full h-full ${loading || error ? 'hidden' : ''}`} />
    </div>
  );
};

export default Map;
