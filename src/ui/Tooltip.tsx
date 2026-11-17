import { useEffect, useState } from 'react';
import type { ViewerEvents } from '../viewer/viewer';
import { usePartCard } from './usePartCard';
import { useViewer } from './ViewerContext';

/** Name of the part under the mouse, next to the pointer. */
export function Tooltip() {
  const { viewer, vehicle } = useViewer();
  const partCard = usePartCard(vehicle);
  const [hover, setHover] = useState<ViewerEvents['hover']>(null);
  useEffect(() => viewer.events.on('hover', setHover), [viewer]);
  return (
    <div id="tip" hidden={!hover} style={hover ? { left: hover.x, top: hover.y } : undefined}>
      {hover && partCard(hover.id)?.name}
    </div>
  );
}
