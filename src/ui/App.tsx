import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exposeDebugHandle } from '../debug';
import type { VehicleDefinition } from '../vehicles/types';
import { Viewer } from '../viewer/viewer';
import { Panel } from './Panel';
import { PartList } from './PartList';
import { Tooltip } from './Tooltip';
import { TopBar } from './TopBar';
import { usePartCard } from './usePartCard';
import { ViewerContext, useViewer, useViewerState } from './ViewerContext';

/** The full-window 3D view of a vehicle with its interface. */
export function App({ vehicle }: { vehicle: VehicleDefinition }) {
  const { t } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  useEffect(() => {
    const v = new Viewer(canvas.current!, vehicle);
    setViewer(v);
    void v.load();
    return () => {
      v.dispose();
      setViewer(null);
    };
  }, [vehicle]);

  useEffect(() => {
    document.title = t('title', { vehicle: vehicle.shortName });
  }, [t, vehicle]);

  return (
    <>
      <canvas id="view" ref={canvas} />
      {viewer ? (
        <ViewerContext value={{ viewer, vehicle }}>
          <Interface />
        </ViewerContext>
      ) : (
        <div id="loading">{t('loading')}</div>
      )}
    </>
  );
}

function Interface() {
  const { t } = useTranslation();
  const { viewer, vehicle } = useViewer();
  const state = useViewerState(viewer);
  const partCard = usePartCard(vehicle);
  const [listOpen, setListOpen] = useState(false);
  const [vehicleCard, setVehicleCard] = useState(false);
  const panelOpen = state.selected !== null || vehicleCard;

  // a selected part replaces the vehicle card
  const [shownSelection, setShownSelection] = useState(state.selected);
  if (state.selected !== shownSelection) {
    setShownSelection(state.selected);
    if (state.selected) setVehicleCard(false);
  }

  // keeps the vehicle centred in the area left free by the list and the panel
  useLayoutEffect(() => {
    const layout = () => {
      const w = innerWidth,
        h = innerHeight;
      if (w <= 900) viewer.setViewOffset(0, panelOpen ? h * 0.24 : 0);
      else viewer.setViewOffset((panelOpen ? 192 : 0) - 135, 0);
    };
    layout();
    addEventListener('resize', layout);
    return () => removeEventListener('resize', layout);
  }, [viewer, panelOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && viewer.select(null);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [viewer]);

  useEffect(() => {
    if (state.ready) exposeDebugHandle({ viewer, partName: (id) => partCard(id)?.name ?? null });
  }, [state.ready, viewer, partCard]);

  return (
    <>
      <TopBar onToggleList={() => setListOpen((o) => !o)} />
      <PartList
        open={listOpen}
        onPick={(id) => {
          viewer.select(id, { focus: true });
          setListOpen(false);
        }}
        onVehicleCard={() => {
          viewer.select(null);
          setVehicleCard(true);
          setListOpen(false);
        }}
      />
      <Panel
        open={panelOpen}
        onClose={() => {
          viewer.select(null);
          setVehicleCard(false);
        }}
      />
      <Tooltip />
      <div id="hint">{t('hint')}</div>
      <div id="loading" className={state.ready ? 'done' : undefined}>
        {t('loading')}
      </div>
    </>
  );
}
