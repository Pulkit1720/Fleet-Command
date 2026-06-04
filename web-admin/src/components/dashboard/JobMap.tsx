'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { Job } from '@/types';

interface JobMapProps {
    jobs: Job[];
    selectedJob?: Job | null;
    onSelectJob?: (job: Job) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function JobMap({ jobs, selectedJob, onSelectJob }: JobMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || !MAPBOX_TOKEN) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [-97.7431, 30.2672], // Austin, TX default
            zoom: 11,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
            setMapLoaded(true);
        });

        return () => {
            map.current?.remove();
        };
    }, []);

    // Update markers when jobs change
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Clear existing markers
        markers.current.forEach((marker) => marker.remove());
        markers.current = [];

        // Add new markers
        const jobsWithCoords = jobs.filter((job) => job.lat && job.lng);

        jobsWithCoords.forEach((job) => {
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.width = '32px';
            el.style.height = '32px';
            el.style.borderRadius = '50%';
            el.style.cursor = 'pointer';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            el.style.border = '3px solid white';

            // Color based on priority
            switch (job.priority) {
                case 'Emergency':
                    el.style.backgroundColor = '#e11d48';
                    break;
                case 'Normal':
                    el.style.backgroundColor = '#4f46e5';
                    break;
                default:
                    el.style.backgroundColor = '#64748b';
            }
            el.style.transition = 'transform 150ms ease';

            // Highlight selected job
            if (selectedJob?.id === job.id) {
                el.style.transform = 'scale(1.3)';
                el.style.zIndex = '10';
            }

            const marker = new mapboxgl.Marker(el)
                .setLngLat([job.lng!, job.lat!])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="min-width: 200px;">
              <p style="font-weight: 600; margin-bottom: 4px;">${job.client_name}</p>
              <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">#${job.job_number}</p>
              <p style="font-size: 13px; color: #334155;">${job.site_address}</p>
            </div>
          `)
                )
                .addTo(map.current!);

            el.addEventListener('click', () => {
                onSelectJob?.(job);
            });

            markers.current.push(marker);
        });

        // Fit bounds to show all markers
        if (jobsWithCoords.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            jobsWithCoords.forEach((job) => {
                bounds.extend([job.lng!, job.lat!]);
            });
            map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
        }
    }, [jobs, mapLoaded, selectedJob, onSelectJob]);

    // Fly to selected job
    useEffect(() => {
        if (!map.current || !selectedJob?.lat || !selectedJob?.lng) return;

        map.current.flyTo({
            center: [selectedJob.lng, selectedJob.lat],
            zoom: 15,
            duration: 1000,
        });
    }, [selectedJob]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-ink-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-200">
                    <MapPin className="h-6 w-6 text-ink-400" />
                </div>
                <div className="text-center">
                    <p className="font-medium text-ink-700">Map unavailable</p>
                    <p className="mt-1 text-sm text-ink-400">
                        Set <code className="rounded bg-ink-200 px-1 py-0.5 font-mono text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the live map.
                    </p>
                </div>
            </div>
        );
    }

    return <div ref={mapContainer} className="h-full w-full" />;
}