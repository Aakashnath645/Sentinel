import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { WrappedQuakeMarker } from './EarthquakeMap';
import { EarthquakeFeature } from '../types';

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }: any) => <div>{children}</div>,
    TileLayer: () => null,
    CircleMarker: ({ children }: any) => <div>{children}</div>,
    Popup: ({ children }: any) => <div>{children}</div>,
    useMap: () => ({ getContainer: () => document.createElement('div') }),
    useMapEvents: () => null,
    Marker: () => null,
    Polyline: () => null,
    Circle: () => null,
    AttributionControl: () => null,
    GeoJSON: () => null,
}));

describe('WrappedQuakeMarker Optimization', () => {
    it('should be a memoized component', () => {
        // Check if the component is wrapped in React.memo
        // React.memo components have a specific symbol
        const isMemo = (WrappedQuakeMarker as any).$$typeof === Symbol.for('react.memo');
        expect(isMemo).toBe(true);
    });
});
