import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Layers, MapPin, Plus, Minus } from "lucide-react";

export function SeizureActivityMap() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapMode, setMapMode] = useState<"standard" | "satellite">("standard");

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.2, 1.6));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.2, 0.9));
  const toggleMapMode = () => setMapMode((m) => (m === "standard" ? "satellite" : "standard"));

  return (
    <section className="dashboard-map-card app-card" aria-label="Seizure activity map">
      <div className="dashboard-card-head">
        <h2 className="dashboard-card-title">Seizure activity map</h2>
        <Link to="/audit" className="dashboard-card-link">
          View map <ArrowUpRight size={13} className="inline ml-0.5" />
        </Link>
      </div>

      <div className="dashboard-map-canvas">
        <div
          className="dashboard-map-scaler"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Stylized Vector Map of New Delhi */}
          <svg
            viewBox="0 0 500 320"
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.6" opacity="0.6" />
              </pattern>
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </linearGradient>
            </defs>

            {/* Base land */}
            <rect width="500" height="320" fill={mapMode === "standard" ? "#F8FAFC" : "#E2E8F0"} />
            <rect width="500" height="320" fill="url(#mapGrid)" />

            {/* Green zones / parks (Ridge, Lodhi, Central Secretariat) */}
            <path
              d="M 40 80 Q 80 50 130 90 T 110 180 Q 70 200 40 160 Z"
              fill="#DCFCE7"
              opacity="0.8"
            />
            <path
              d="M 280 190 Q 320 180 350 220 T 310 270 Q 270 280 260 230 Z"
              fill="#DCFCE7"
              opacity="0.8"
            />
            <path
              d="M 200 130 Q 230 120 250 145 T 230 170 Q 200 165 200 130 Z"
              fill="#DCFCE7"
              opacity="0.7"
            />

            {/* Yamuna River Curve */}
            <path
              d="M 360 0 Q 380 90 350 150 T 400 250 T 430 320"
              fill="none"
              stroke="url(#riverGrad)"
              strokeWidth="18"
              strokeLinecap="round"
              opacity="0.85"
            />
            <text x="382" y="80" fill="#0284C7" fontSize="9" fontWeight="600" opacity="0.7" transform="rotate(75 382 80)">
              Yamuna River
            </text>

            {/* Major Arterial Roads / Ring Roads */}
            {/* Outer Ring Road */}
            <circle cx="230" cy="160" r="140" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <circle cx="230" cy="160" r="140" fill="none" stroke="#CBD5E1" strokeWidth="2.5" />

            {/* Inner Ring Road */}
            <circle cx="230" cy="160" r="85" fill="none" stroke="#FFFFFF" strokeWidth="6" />
            <circle cx="230" cy="160" r="85" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 3" />

            {/* Radial Arteries */}
            <path d="M 0 160 L 500 160" stroke="#FFFFFF" strokeWidth="7" />
            <path d="M 0 160 L 500 160" stroke="#CBD5E1" strokeWidth="2" />

            <path d="M 230 0 L 230 320" stroke="#FFFFFF" strokeWidth="7" />
            <path d="M 230 0 L 230 320" stroke="#CBD5E1" strokeWidth="2" />

            <path d="M 50 40 L 410 280" stroke="#FFFFFF" strokeWidth="5" />
            <path d="M 50 40 L 410 280" stroke="#CBD5E1" strokeWidth="1.5" />

            <path d="M 40 280 L 420 50" stroke="#FFFFFF" strokeWidth="5" />
            <path d="M 40 280 L 420 50" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* City Landmarks / Neighborhood Labels */}
            <text x="230" y="195" fill="#334155" fontSize="13" fontWeight="700" textAnchor="middle" letterSpacing="0.05em">
              New Delhi
            </text>
            <text x="140" y="125" fill="#64748B" fontSize="9" fontWeight="600">
              Karol Bagh
            </text>
            <text x="230" y="145" fill="#64748B" fontSize="9" fontWeight="600" textAnchor="middle">
              Connaught Place
            </text>
            <text x="300" y="240" fill="#64748B" fontSize="9" fontWeight="600">
              Lajpat Nagar
            </text>
            <text x="120" y="240" fill="#64748B" fontSize="9" fontWeight="600">
              Chanakyapuri
            </text>

            {/* Green Pin (Karol Bagh / West) */}
            <g transform="translate(150, 115)">
              <circle cx="0" cy="0" r="14" fill="#16A34A" fillOpacity="0.2" />
              <circle cx="0" cy="0" r="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
              <path d="M 0 0 L 0 10" stroke="#16A34A" strokeWidth="2" />
            </g>

            {/* Blue Pin (South Delhi) */}
            <g transform="translate(320, 220)">
              <circle cx="0" cy="0" r="14" fill="#0284C7" fillOpacity="0.2" />
              <circle cx="0" cy="0" r="6" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
              <path d="M 0 0 L 0 10" stroke="#0284C7" strokeWidth="2" />
            </g>

            {/* Red Pin (Gate 3, New Delhi - Center Location) */}
            <g transform="translate(270, 135)">
              <circle cx="0" cy="0" r="18" fill="#DC2626" fillOpacity="0.2" className="animate-pulse" />
              <circle cx="0" cy="0" r="7" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2.5" />
              <path d="M 0 0 L 0 12" stroke="#DC2626" strokeWidth="2.5" />
            </g>
          </svg>
        </div>

        {/* Hovering / Active Callout Overlay above Gate 3 */}
        <div className="dashboard-map-callout">
          <div className="map-callout-icon">
            <MapPin size={13} className="text-white" />
          </div>
          <div className="map-callout-text">
            <strong>Gate 3, New Delhi</strong>
            <span>3 tests · 1 positive</span>
          </div>
        </div>

        {/* Zoom & Layer Controls */}
        <div className="dashboard-map-controls" aria-label="Map controls">
          <button
            type="button"
            onClick={handleZoomIn}
            className="map-ctrl-btn"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="map-ctrl-btn"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={toggleMapMode}
            className={`map-ctrl-btn ${mapMode === "satellite" ? "active" : ""}`}
            title="Toggle layer"
            aria-label="Toggle map layer"
          >
            <Layers size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
