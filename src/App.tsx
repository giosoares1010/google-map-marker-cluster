import { useState, useEffect } from 'react';
import Map from './GoogleMap';
import './App.css'

import clients from './resources/Dialer_Export_1716925317652.json'

export interface IMarkerData {
    lat: number,
    lng: number,
    name: string,
    address: string
}

function App() {
    
    const [markersData, setMarkersData] = useState<IMarkerData[]>([]);

    useEffect(() => {
        const newMarkersData: IMarkerData[] = [];
        
        for (const client of clients) {
            if (client.geolocation) {
                const clientName = client.FirstName + " " + client.LastName;
                const address = client.Address + ", " + client.City + ", " + client.State;
                const newMarker: IMarkerData = {
                    lat: client.geolocation.lat,
                    lng: client.geolocation.lng,
                    name: clientName,
                    address: address
                }
                newMarkersData.push(newMarker);
            }
        }
        
        setMarkersData(newMarkersData);
    }, []);
    
    return (
        <>
        <Map markersData={markersData} />
        </>
        );
    }
    
    export default App
    