import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';
import { useVehicleLocale } from './usePartCard';
import { useViewer, useViewerState } from './ViewerContext';

type MenuId = 'openables' | 'lights' | 'colors';

export function TopBar({ onToggleList }: { onToggleList: () => void }) {
  const { t, i18n } = useTranslation();
  const { viewer, vehicle } = useViewer();
  const state = useViewerState(viewer);
  const locale = useVehicleLocale(vehicle);
  const [menu, setMenu] = useState<MenuId | null>(null);
  const allOpen = vehicle.openables.every((id) => state.open[id]);

  // a press anywhere outside the menus closes them
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest('.menu')) setMenu(null);
    };
    addEventListener('pointerdown', close);
    return () => removeEventListener('pointerdown', close);
  }, []);

  const menuProps = (id: MenuId) => ({
    open: menu === id,
    onToggle: () => setMenu((m) => (m === id ? null : id)),
  });

  return (
    <header id="topbar">
      <div className="brand">
        <span className="logo">◆</span>
        <div>
          <b>{vehicle.brand}</b>
          <small>{locale.subtitle}</small>
        </div>
      </div>
      <div className="tools">
        <div className="group" id="views">
          {vehicle.views.map((v) => (
            <button key={v.id} onClick={() => viewer.goView(v.id)}>
              {locale.views[v.id]}
            </button>
          ))}
        </div>
        <div className="group">
          <button
            id="btn-openall"
            title={t('toolbar.openAllTitle')}
            data-all={allOpen ? '1' : ''}
            onClick={() => viewer.setAllOpen(!allOpen)}
          >
            {allOpen ? t('toolbar.closeAll') : t('toolbar.openAll')}
          </button>
          <Menu id="openables" label={t('toolbar.openables')} {...menuProps('openables')}>
            {vehicle.openables.map((id) => (
              <label key={id}>
                <span>{locale.openables[id]}</span>
                <input
                  type="checkbox"
                  data-id={id}
                  checked={!!state.open[id]}
                  onChange={(e) => viewer.setOpen(id, e.target.checked)}
                />
              </label>
            ))}
          </Menu>
          <Menu id="lights" label={t('toolbar.lights')} {...menuProps('lights')}>
            {vehicle.lights.switches.map((s) => (
              <label key={s.id}>
                <span>{locale.lights[s.id]}</span>
                <input
                  type="checkbox"
                  checked={!!state.lights[s.id]}
                  onChange={(e) => viewer.setLight(s.id, e.target.checked)}
                />
              </label>
            ))}
          </Menu>
        </div>
        <div className="group">
          <button
            id="btn-xray"
            className={state.xray ? 'on' : undefined}
            title={t('toolbar.xrayTitle')}
            onClick={() => viewer.setXray(!state.xray)}
          >
            {t('toolbar.xray')}
          </button>
          <button
            id="btn-explode"
            className={state.exploded ? 'on' : undefined}
            title={t('toolbar.explodeTitle')}
            onClick={() => viewer.setExploded(!state.exploded)}
          >
            {t('toolbar.explode')}
          </button>
          <button
            id="btn-showall"
            hidden={state.hidden.size === 0}
            onClick={() => viewer.showAll()}
          >
            {t('toolbar.showAll')}
          </button>
          <button
            id="btn-quality"
            title={t('toolbar.qualityTitle')}
            data-level={state.quality}
            onClick={() => viewer.nextQuality()}
          >
            {t('toolbar.quality', { level: t(`quality.${state.quality}`) })}
          </button>
        </div>
        <div className="group">
          <Menu id="colors" label={t('toolbar.colour')} {...menuProps('colors')}>
            {vehicle.paints.map((p) => (
              <button
                key={p.id}
                className={p.id === state.paint ? 'cl on' : 'cl'}
                onClick={() => viewer.setPaint(p.id)}
              >
                <i style={{ background: `#${p.hex.toString(16).padStart(6, '0')}` }} />
                <span>{p.name}</span>
                <small>{t(`finish.${p.finish}`)}</small>
              </button>
            ))}
          </Menu>
        </div>
        <div className="group" id="language" role="group" aria-label={t('language')}>
          {LANGUAGES.map((lng) => (
            <button
              key={lng}
              lang={lng}
              className={i18n.resolvedLanguage === lng ? 'on' : undefined}
              aria-pressed={i18n.resolvedLanguage === lng}
              onClick={() => void i18n.changeLanguage(lng)}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <button
        id="btn-list"
        className="only-mobile"
        aria-label={t('toolbar.partList')}
        onClick={onToggleList}
      >
        ☰
      </button>
    </header>
  );
}

const MENU_BUTTON: Record<MenuId, string> = {
  openables: 'btn-openmenu',
  lights: 'btn-lightmenu',
  colors: 'btn-colormenu',
};

/** Drop-down menu of the top bar; only one is open at a time. */
function Menu(props: {
  id: MenuId;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={props.open ? 'menu open' : 'menu'}>
      <button id={MENU_BUTTON[props.id]} onClick={props.onToggle}>
        {`${props.label} ▾`}
      </button>
      <div className="pop" id={props.id}>
        {props.children}
      </div>
    </div>
  );
}
