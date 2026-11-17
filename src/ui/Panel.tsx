import { useLayoutEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { usePartCard, useVehicleLocale } from './usePartCard';
import { useViewer, useViewerState } from './ViewerContext';

/** Side panel (bottom sheet on mobile): the selected part's card or the vehicle card. */
export function Panel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { viewer } = useViewer();
  const { selected } = useViewerState(viewer);
  const body = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (body.current) body.current.scrollTop = 0;
  }, [selected, open]);

  return (
    <aside id="panel" hidden={!open}>
      <button id="panel-close" aria-label={t('panel.close')} onClick={onClose}>
        ×
      </button>
      <div id="panel-body" ref={body}>
        {selected ? <PartDetails key={selected} id={selected} /> : open && <VehicleCard />}
      </div>
    </aside>
  );
}

function PartDetails({ id }: { id: string }) {
  const { t } = useTranslation();
  const { viewer, vehicle } = useViewer();
  const state = useViewerState(viewer);
  const locale = useVehicleLocale(vehicle);
  const card = usePartCard(vehicle)(id)!;
  const { text } = card;
  const openable = viewer.openableOf(id);
  const hidden = state.hidden.has(id);
  const oem = card.card.oem;

  return (
    <>
      <PartPreview />
      <div className="pb">
        <span className="chip">{locale.categories[card.card.category]}</span>
        <h2>{card.name}</h2>
        <div className="acts">
          {openable && (
            <button onClick={() => viewer.setOpen(openable, !state.open[openable])}>
              {t(state.open[openable] ? 'panel.closeOpenable' : 'panel.open', {
                part: (locale.openables[openable] ?? '').toLowerCase(),
              })}
            </button>
          )}
          <button onClick={() => viewer.focus(id)}>{t('panel.focus')}</button>
          <button onClick={() => viewer.setHidden(id, !hidden)}>
            {hidden ? t('panel.show') : t('panel.hide')}
          </button>
        </div>
        {text.where && (
          <>
            <h3>{t('panel.where')}</h3>
            <p className="where">{text.where}</p>
          </>
        )}
        <h3>{t('panel.description')}</h3>
        <p>{text.description}</p>
        {text.specs && (
          <>
            <h3>{t('panel.specs')}</h3>
            <SpecTable rows={text.specs} />
          </>
        )}
        {text.maintenance && (
          <>
            <h3>{t('panel.maintenance')}</h3>
            <ul>
              {text.maintenance.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </>
        )}
        {text.faults && (
          <>
            <h3>{t('panel.faults')}</h3>
            <ul className="faults">
              {text.faults.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </>
        )}
        {oem && text.oem && (
          <>
            <h3>{t('panel.oem', { make: vehicle.make })}</h3>
            {oem.map(({ code, verify }, i) => (
              <div className="oem" key={i}>
                <span>
                  {text.oem![i]}
                  {verify && code !== '—' && <span className="badge">{t('panel.verify')}</span>}
                </span>
                <code>{code}</code>
              </div>
            ))}
          </>
        )}
        <p className="note">{locale.partNote}</p>
      </div>
    </>
  );
}

/** Hosts the viewer's isolated-part preview canvas. */
function PartPreview() {
  const { t } = useTranslation();
  const { viewer } = useViewer();
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = host.current!;
    viewer.mountPreview(el);
    return () => viewer.unmountPreview(el);
  }, [viewer]);
  return (
    <div className="pv" ref={host}>
      <span>{t('panel.preview')}</span>
    </div>
  );
}

function VehicleCard() {
  const { t } = useTranslation();
  const { vehicle } = useViewer();
  const locale = useVehicleLocale(vehicle);
  const link = (href: string) => <a href={href} target="_blank" rel="noopener" />;
  return (
    <div className="pb" style={{ paddingTop: 18 }}>
      <span className="chip">{t('panel.vehicleCard')}</span>
      <h2>{vehicle.name}</h2>
      <p>{locale.card.intro}</p>
      <h3>{t('panel.specs')}</h3>
      <SpecTable rows={locale.card.specs} />
      <p className="note">{locale.card.note}</p>
      <p className="note">
        <Trans
          ns="vehicle"
          i18nKey="card.credits"
          components={{
            author: link(vehicle.credits.authorUrl),
            license: link(vehicle.credits.licenseUrl),
          }}
        />
      </p>
    </div>
  );
}

function SpecTable({ rows }: { rows: string[][] }) {
  return (
    <table className="sp">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td>{k}</td>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
