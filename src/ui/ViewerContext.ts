import { createContext, useContext, useSyncExternalStore } from 'react';
import type { VehicleDefinition } from '../vehicles/types';
import type { Viewer, ViewerState } from '../viewer/viewer';

export interface ViewerContextValue {
  viewer: Viewer;
  vehicle: VehicleDefinition;
}

export const ViewerContext = createContext<ViewerContextValue | null>(null);

export function useViewer() {
  const value = useContext(ViewerContext);
  if (!value) throw new Error('useViewer must be used inside <ViewerContext>');
  return value;
}

/** The viewer's state, re-rendering on every change. */
export function useViewerState(viewer: Viewer): ViewerState {
  return useSyncExternalStore(viewer.store.subscribe, viewer.store.get);
}
