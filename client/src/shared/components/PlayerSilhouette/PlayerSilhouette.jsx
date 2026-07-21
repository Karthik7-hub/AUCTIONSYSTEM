import React from 'react';

// Minimalist Sports Silhouette (Monochrome transparent watermark, inheriting theme color)

const BatsmanSilhouette = () => (
  <svg viewBox="0 0 200 240" fill="currentColor" className="player-silhouette-svg">
    {/* Motion Swing Arc Accent */}
    <path d="M 25 45 Q 100 5 185 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.3" />
    <path d="M 40 65 Q 115 25 195 50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.2" />
    
    <g>
      {/* Head & Helmet Visor */}
      <circle cx="75" cy="55" r="13" />
      <path d="M 68 53 L 88 56" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" fill="none" />
      
      {/* Tapered V-Torso */}
      <path d="M 68 70 L 98 62 C 104 62, 108 72, 104 88 L 88 118 L 70 115 Z" />
      
      {/* Front Leg Bent in Cover Drive */}
      <path d="M 88 118 L 128 150 L 148 205 L 122 205 L 105 160 Z" />
      {/* Back Leg */}
      <path d="M 70 115 L 50 160 L 32 205 L 54 205 L 72 165 Z" opacity="0.8" />
      
      {/* Raised Curved Bat & Arms */}
      <path d="M 82 72 L 122 45 C 126 42, 132 46, 128 50 L 90 82 Z" />
      <path d="M 118 44 L 175 14 Q 182 10, 188 18 Q 182 26, 125 48 Z" />
      <path d="M 172 10 L 186 3 L 192 9 L 178 16 Z" opacity="0.7" />
    </g>
  </svg>
);

const BowlerSilhouette = () => (
  <svg viewBox="0 0 200 240" fill="currentColor" className="player-silhouette-svg">
    {/* Speed Trails */}
    <g stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.3" fill="none">
      <line x1="15" y1="70" x2="65" y2="70" />
      <line x1="25" y1="110" x2="85" y2="110" />
      <line x1="20" y1="150" x2="75" y2="150" />
    </g>
    
    <g>
      {/* Head */}
      <circle cx="120" cy="40" r="13" />
      
      {/* Overhead Bowling Arm & Ball */}
      <path d="M 115 52 L 138 12 L 148 16 L 125 56 Z" />
      <circle cx="145" cy="12" r="6" opacity="0.9" />
      
      {/* Tapered Athletic Torso */}
      <path d="M 108 52 L 128 55 L 115 110 L 92 104 Z" />
      
      {/* Front Striding Leg */}
      <path d="M 92 104 L 58 150 L 30 205 L 52 208 L 80 160 Z" />
      {/* Back Trailing Leg */}
      <path d="M 115 110 L 145 152 L 170 205 L 148 208 L 125 160 Z" opacity="0.8" />
    </g>
  </svg>
);

const WicketKeeperSilhouette = () => (
  <svg viewBox="0 0 200 240" fill="currentColor" className="player-silhouette-svg">
    {/* Stadium Lighting Arcs Matrix */}
    <g fill="currentColor" opacity="0.25">
      <circle cx="40" cy="45" r="3.5" />
      <circle cx="65" cy="35" r="4" />
      <circle cx="100" cy="30" r="4.5" />
      <circle cx="135" cy="35" r="4" />
      <circle cx="160" cy="45" r="3.5" />
    </g>
    
    <g>
      {/* Head */}
      <circle cx="100" cy="70" r="13" />
      
      {/* Crouched Athletic Torso */}
      <path d="M 88 84 Q 100 78 112 84 L 120 125 Q 100 132 80 125 Z" />
      
      {/* Gloves Extended */}
      <path d="M 88 92 L 58 108 L 40 102 L 38 118 L 60 120 Z" />
      <path d="M 112 92 L 142 108 L 160 102 L 162 118 L 140 120 Z" />
      <circle cx="39" cy="110" r="7" opacity="0.6" />
      <circle cx="161" cy="110" r="7" opacity="0.6" />
      
      {/* Deep Crouched Legs */}
      <path d="M 80 125 L 45 150 L 50 205 L 75 205 L 78 160 Z" />
      <path d="M 120 125 L 155 150 L 150 205 L 125 205 L 122 160 Z" opacity="0.8" />
    </g>
  </svg>
);

const AllRounderSilhouette = () => (
  <svg viewBox="0 0 200 240" fill="currentColor" className="player-silhouette-svg">
    {/* Energy Arc Ring */}
    <circle cx="100" cy="110" r="72" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" opacity="0.3" />
    
    <g>
      {/* Head */}
      <circle cx="100" cy="42" r="13" />
      
      {/* V-Torso */}
      <path d="M 80 56 L 120 56 L 112 112 L 88 112 Z" />
      
      {/* Bat on Shoulder */}
      <path d="M 82 58 L 58 78 L 48 68 M 46 64 L 20 15 L 26 12 L 52 61 Z" fill="currentColor" />
      
      {/* Ball in Hand */}
      <path d="M 118 58 L 142 80 L 155 75 Z" />
      <circle cx="160" cy="74" r="7" opacity="0.9" />
      
      {/* Confident Legs */}
      <path d="M 88 112 L 72 165 L 66 215 L 88 215 L 94 165 Z" />
      <path d="M 112 112 L 128 165 L 134 215 L 112 215 L 106 165 Z" opacity="0.8" />
    </g>
  </svg>
);

const DefaultPlayerSilhouette = () => (
  <svg viewBox="0 0 200 240" fill="currentColor" className="player-silhouette-svg">
    {/* Soft Dot Grid Background */}
    <g opacity="0.2" fill="currentColor">
      <circle cx="50" cy="60" r="2" /><circle cx="70" cy="60" r="2" /><circle cx="90" cy="60" r="2" /><circle cx="110" cy="60" r="2" /><circle cx="130" cy="60" r="2" /><circle cx="150" cy="60" r="2" />
      <circle cx="50" cy="90" r="2" /><circle cx="70" cy="90" r="2" /><circle cx="90" cy="90" r="2" /><circle cx="110" cy="90" r="2" /><circle cx="130" cy="90" r="2" /><circle cx="150" cy="90" r="2" />
    </g>
    
    <g>
      {/* Head */}
      <circle cx="100" cy="45" r="13" />
      
      {/* Crossed Arms & Torso */}
      <path d="M 80 60 L 120 60 L 114 118 L 86 118 Z" />
      <path d="M 76 66 Q 100 90 124 66" stroke="rgba(0,0,0,0.3)" strokeWidth="8" strokeLinecap="round" fill="none" />
      
      {/* Athletic Legs */}
      <path d="M 86 118 L 74 168 L 70 218 L 92 218 L 95 168 Z" />
      <path d="M 114 118 L 124 168 L 130 218 L 108 218 L 105 168 Z" opacity="0.8" />
    </g>
  </svg>
);

export default function PlayerSilhouette({ role }) {
  const norm = (role || '').toUpperCase();
  if (norm.includes('BAT')) return <BatsmanSilhouette />;
  if (norm.includes('BOWL')) return <BowlerSilhouette />;
  if (norm.includes('KEEP') || norm.includes('WICKET')) return <WicketKeeperSilhouette />;
  if (norm.includes('ALL') || norm.includes('ROUND')) return <AllRounderSilhouette />;
  return <DefaultPlayerSilhouette />;
}
