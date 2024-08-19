import React, { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import haversine from 'haversine-distance';
import { IMarkerData } from './App';

import './App.css'

const containerStyle = {
    width: '100%',
    height: '100%'
};

const center = {
    lat: 44.8,
    lng: -90.000
};

const options = {
  zoom: 6,
  maxZoom: 12,
  minZoom: 4,
  center
};

export interface IClient {
    EMPI: number,
    FirstName: string,
    LastName: string,
    Address: string,
    City: string,
    County: string,
    State: string,
    Zip: number,
    geolocation?: {
        lat: number,
        lng: number
    }
}



interface Props {
    markersData: IMarkerData[]
}

const Map: React.FC<Props> = ({markersData}) => {
    
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: ''
    });

    const [selectedMiles, setSelectedMiles] = useState<number>(20);
    const [selectedCluster, setSelectedCluster]= useState<IMarkerData[]>([]);
    const markersRef = useRef<google.maps.Marker[]>([]);

    const [map, setMap] = useState<google.maps.Map | null>(null);
    
    const getClusterIcon = (clusterSize: number) => {
        const color1 = clusterSize < 10 ? '#024948dd' : clusterSize < 100 ? '#392fefdd' : '#e52323dd';
        const color2 = clusterSize < 10 ? '#02494866' : clusterSize < 100 ? '#392fef66' : '#e5232366';
        const color3 = clusterSize < 10 ? '#02494833' : clusterSize < 100 ? '#392fef33' : '#e5232333';
        const size = 44; // Fixed size for simplicity
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" height="${size}" width="${size}" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="22" fill="${color3}" />
            <circle cx="22" cy="22" r="19" fill="${color2}" />
            <circle cx="22" cy="22" r="16" fill="${color1}" />
            </svg>
        `;
        return {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
            scaledSize: new google.maps.Size(size, size),
        };
    };

    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        mapInstance.setOptions(options);
        setMap(mapInstance);
    }, []);


    const onUnmount = useCallback(() => {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        setMap(null);
    }, []);
    

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        clearMarkers();
        setSelectedMiles(parseInt(event.target.value));
    };

    useEffect(() => {
        if (map) {
            const newClusters: IMarkerData[][] = [];

            markersData.forEach((m: IMarkerData) => {
                let addedToCluster = false;

                for (const cluster of newClusters) {
                    const clusterPoint = cluster[0];
                    const distance = haversine(
                        { lat: m.lat, lng: m.lng },
                        { lat: clusterPoint.lat, lng: clusterPoint.lng }
                    );

                    const maxDistance = selectedMiles * 1609.34;

                    if (distance <= maxDistance) {
                        cluster.push({
                            lat: m.lat,
                            lng: m.lng,
                            name: m.name,
                            address: m.address
                        });
                        addedToCluster = true;
                        break;
                    }
                }

                if (!addedToCluster) {
                    newClusters.push([{
                        lat: m.lat,
                        lng: m.lng,
                        name: m.name,
                        address: m.address
                    }]);
                }
            });

            // Creating markers only once and not changing them on zoom
            const clusterMarkers: google.maps.Marker[] = newClusters.map((cluster) => {
                const lat = cluster.reduce((acc, val) => acc + val.lat, 0) / cluster.length;
                const lng = cluster.reduce((acc, val) => acc + val.lng, 0) / cluster.length;

                const marker = new google.maps.Marker({
                    position: { lat, lng },
                    map,
                    label: {
                        text: String(cluster.length),
                        color: 'white',
                        fontSize: '12px'
                    },
                    icon: getClusterIcon(cluster.length),
                    clickable: true
                });

                marker.addListener('click', () => {
                    setSelectedCluster(cluster);
                });

                return marker;
            });

            // Add markers to the map
            clusterMarkers.forEach(marker => marker.setMap(map));
            markersRef.current = clusterMarkers;

            // Cleanup function to remove markers
            return () => {
                clusterMarkers.forEach(marker => marker.setMap(null));
                markersRef.current = [];
            };
        }
    }, [selectedMiles, map]);


    const clearMarkers = () => {
         markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        setSelectedCluster([])
    };

    if (!isLoaded) {
        return <>
            <p className="read-the-docs">
                Loading maps...
            </p>
        </>;
    }
    

    return (
        <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
            <div style={{width: '25%', height: '100%', float: 'left'}}>
                <div style={{width: '100%', marginTop: '20px'}}>
                    <label style={{marginRight: '20px'}}>Distance : </label>
                    <select value={selectedMiles} onChange={handleSelectChange}>
                        <option value="20">20 Miles</option>
                        <option value="30">30 Miles</option>
                        <option value="50">50 Miles</option>
                    </select>
                </div>
                <div style={{width: '100%', marginTop: '20px'}}>
                    <label>Client list of Cluster </label>
                    <div className='table-wrapper'>
                        <table>
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Name</th>
                                    <th>Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedCluster.map((client, idx) => (
                                    <tr key={idx}>
                                        <td>{idx+1}</td>
                                        <td>{client.name}</td>
                                        <td>{client.address}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div style={{width: '75%', height: '100%', float: 'left'}}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={5}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    >
                </GoogleMap>
            </div>
        </div>
    );
}
    
export default Map
    