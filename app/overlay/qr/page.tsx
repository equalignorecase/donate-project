'use client';

import { useWidgets } from '../useWidgets';
import '../widgets.css';
import QrCardWidget from './QrCardWidget';

export default function QrCardOverlay() {
  const data = useWidgets();
  if (!data) return null;

  return (
    <div className="overlay-center-container">
      <QrCardWidget appearance={data.qrCardAppearance} />
    </div>
  );
}
