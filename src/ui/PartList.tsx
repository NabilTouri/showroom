import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartCard, useVehicleLocale } from './usePartCard';
import { useViewer, useViewerState } from './ViewerContext';

interface Item {
  id: string;
  name: string;
  description: string;
}

/** Searchable list of the vehicle's parts, grouped by category. */
export function PartList(props: {
  open: boolean;
  onPick: (id: string) => void;
  onVehicleCard: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { viewer, vehicle } = useViewer();
  const state = useViewerState(viewer);
  const locale = useVehicleLocale(vehicle);
  const partCard = usePartCard(vehicle);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set([vehicle.initialCategory]),
  );
  const items = useRef(new Map<string, HTMLButtonElement>());

  const groups = useMemo(() => {
    if (!state.ready) return [];
    const byCategory: Record<string, Item[]> = {};
    for (const id of Object.keys(viewer.model.parts)) {
      const card = partCard(id);
      if (card)
        (byCategory[card.card.category] ??= []).push({
          id,
          name: card.name,
          description: card.text.description,
        });
    }
    return vehicle.categories
      .filter((c) => byCategory[c])
      .map((c) => ({
        id: c,
        items: byCategory[c].sort((a, b) => a.name.localeCompare(b.name, i18n.resolvedLanguage)),
      }));
  }, [state.ready, viewer, vehicle, partCard, i18n.resolvedLanguage]);

  const matcher = (query: string) => {
    const q = query.trim().toLowerCase();
    return (it: Item) =>
      !q || it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q);
  };
  const matches = matcher(query);

  const search = (value: string) => {
    setQuery(value);
    // while searching, exactly the categories with matches are expanded
    if (value.trim()) {
      const m = matcher(value);
      setExpanded(new Set(groups.filter((g) => g.items.some(m)).map((g) => g.id)));
    }
  };

  // the selected part's category opens and the part scrolls into view
  const [shownSelection, setShownSelection] = useState<string | null>(null);
  if (state.selected !== shownSelection) {
    setShownSelection(state.selected);
    const category = state.selected && partCard(state.selected)?.card.category;
    if (category && !expanded.has(category)) setExpanded(new Set(expanded).add(category));
  }
  useLayoutEffect(() => {
    if (state.selected) items.current.get(state.selected)?.scrollIntoView({ block: 'nearest' });
  }, [state.selected]);

  const classOf = (id: string) =>
    ['item', state.selected === id && 'sel', state.hidden.has(id) && 'hid']
      .filter(Boolean)
      .join(' ');

  return (
    <aside id="list" className={props.open ? 'open' : undefined}>
      <div className="list-head">
        <input
          id="search"
          type="search"
          placeholder={t('list.search')}
          autoComplete="off"
          value={query}
          onChange={(e) => search(e.target.value)}
        />
        <button id="btn-vehicle" title={t('list.vehicleCardTitle')} onClick={props.onVehicleCard}>
          {t('list.vehicleCard')}
        </button>
      </div>
      <div id="cats">
        {groups.map((g) => (
          <details
            key={g.id}
            open={expanded.has(g.id)}
            style={g.items.some(matches) ? undefined : { display: 'none' }}
            onToggle={(e) => {
              const open = e.currentTarget.open;
              setExpanded((s) => {
                if (s.has(g.id) === open) return s;
                const next = new Set(s);
                if (open) next.add(g.id);
                else next.delete(g.id);
                return next;
              });
            }}
          >
            <summary>
              {locale.categories[g.id]}{' '}
              <span style={{ marginLeft: 'auto', marginRight: 8, opacity: 0.6 }}>
                {g.items.length}
              </span>
            </summary>
            {g.items.map((it) => (
              <button
                key={it.id}
                ref={(el) => {
                  if (el) items.current.set(it.id, el);
                  else items.current.delete(it.id);
                }}
                className={classOf(it.id)}
                data-id={it.id}
                style={matches(it) ? undefined : { display: 'none' }}
                onClick={() => props.onPick(it.id)}
              >
                {it.name}
              </button>
            ))}
          </details>
        ))}
      </div>
    </aside>
  );
}
