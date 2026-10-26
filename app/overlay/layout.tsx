import React from 'react';
import './overlay-toolbar.css';

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay-root-wrapper bg-transparent">
      {children}
    </div>
  );
}
