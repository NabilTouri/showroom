// DOM user interface over the viewer (static markup in index.html).
import { qualifierWords, resolvePart } from '../vehicles/part-cards';
import type { VehicleDefinition, VehicleLocale } from '../vehicles/types';
import type { QualityLevel } from '../viewer/quality';
import type { Viewer } from '../viewer/viewer';

const QUALITY_LABEL: Record<QualityLevel, string> = { high: 'Alta', medium: 'Media', low: 'Bassa' };
const FINISH_LABEL = { solid: 'pastello', metallic: 'metallizzato', pearl: 'perlato' };

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const esc = (s: unknown) => String(s).replace(/[&<>]/g, (c) => ESC[c]);

/** Localised card of a scene part. */
export function partCard(vehicle: VehicleDefinition, locale: VehicleLocale, id: string) {
  const part = resolvePart(vehicle.cards, id);
  if (!part) return null;
  const text = locale.parts[part.cardId];
  const q = qualifierWords(locale, text, part.qualifiers);
  return { ...part, text, name: q ? `${text.name} ${q}` : text.name };
}

/** Title and brand: shown while the vehicle loads. */
export function mountBrand(vehicle: VehicleDefinition) {
  document.title = `${vehicle.shortName} — Esploratore 3D`;
  $('#brand-name').textContent = vehicle.brand;
  $('#brand-subtitle').textContent = vehicle.locales.it.subtitle;
}

export function mountDomUi(viewer: Viewer, vehicle: VehicleDefinition) {
  const locale = vehicle.locales.it;
  const card = (id: string) => partCard(vehicle, locale, id);

  const panel = $('#panel');
  const setPanel = (open: boolean) => {
    panel.hidden = !open;
    layout();
  };
  // keeps the vehicle centred in the area left free by list and panel
  const layout = () => {
    const w = innerWidth,
      h = innerHeight,
      open = !panel.hidden;
    if (w <= 900) viewer.setViewOffset(0, open ? h * 0.24 : 0);
    else viewer.setViewOffset((open ? 192 : 0) - 135, 0);
  };
  addEventListener('resize', layout);
  layout();

  // ---------- part panel ----------
  const renderPanel = (id: string) => {
    const c = card(id)!,
      p = c.text,
      body = $('#panel-body'),
      op = viewer.openableOf(id);
    const openLabel = () =>
      `${viewer.isOpen(op!) ? 'Chiudi' : 'Apri'} ${(locale.openables[op!] || '').toLowerCase()}`;
    const hidden = () => viewer.store.get().hidden.has(id);
    let h = `<div class="pv"><span>Pezzo isolato · trascina per ruotare</span></div><div class="pb">`;
    h += `<span class="chip">${esc(locale.categories[c.card.category])}</span><h2>${esc(c.name)}</h2>`;
    h += `<div class="acts">`;
    if (op) h += `<button data-act="open">${esc(openLabel())}</button>`;
    h += `<button data-act="focus">Inquadra</button><button data-act="hide">${hidden() ? 'Mostra' : 'Nascondi'}</button></div>`;
    if (p.where) h += `<h3>Dove si trova</h3><p class="where">${esc(p.where)}</p>`;
    h += `<h3>Cos'è e a cosa serve</h3><p>${esc(p.description)}</p>`;
    if (p.specs)
      h += `<h3>Dati tecnici</h3><table class="sp">${p.specs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
    if (p.maintenance)
      h += `<h3>Manutenzione</h3><ul>${p.maintenance.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (p.faults)
      h += `<h3>Guasti e sintomi tipici</h3><ul class="faults">${p.faults.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    const oem = c.card.oem;
    if (oem && p.oem)
      h += `<h3>Ricambi e codici OEM ${esc(vehicle.make)}</h3>${oem
        .map(
          ({ code, verify }, i) =>
            `<div class="oem"><span>${esc(p.oem![i])}${verify && code !== '—' ? '<span class="badge">da verificare</span>' : ''}</span><code>${esc(code)}</code></div>`,
        )
        .join('')}`;
    h += `<p class="note">${esc(locale.partNote)}</p></div>`;
    body.innerHTML = h;
    body.scrollTop = 0;
    setPanel(true);
    viewer.mountPreview(body.querySelector<HTMLElement>('.pv')!);
    body.querySelector<HTMLElement>('.acts')!.onclick = (e) => {
      const target = e.target as HTMLElement;
      const a = target.dataset.act;
      if (a === 'open' && op) {
        viewer.setOpen(op, !viewer.isOpen(op));
        target.textContent = openLabel();
      }
      if (a === 'focus') viewer.focus(id);
      if (a === 'hide') {
        viewer.setHidden(id, !hidden());
        target.textContent = hidden() ? 'Mostra' : 'Nascondi';
      }
    };
  };
  const renderVehicle = () => {
    viewer.select(null);
    const credits = esc(locale.card.credits)
      .replace(
        /&lt;author&gt;(.*?)&lt;\/author&gt;/,
        `<a href="${vehicle.credits.authorUrl}" target="_blank" rel="noopener">$1</a>`,
      )
      .replace(
        /&lt;license&gt;(.*?)&lt;\/license&gt;/,
        `<a href="${vehicle.credits.licenseUrl}" target="_blank" rel="noopener">$1</a>`,
      );
    $('#panel-body').innerHTML =
      `<div class="pb" style="padding-top:18px"><span class="chip">Scheda auto</span><h2>${esc(vehicle.name)}</h2><p>${esc(locale.card.intro)}</p><h3>Dati tecnici</h3><table class="sp">${locale.card.specs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table><p class="note">${esc(locale.card.note)}</p><p class="note">${credits}</p></div>`;
    setPanel(true);
  };
  $('#panel-close').onclick = () => {
    viewer.select(null);
    setPanel(false);
  };
  $('#btn-vehicle').onclick = () => {
    renderVehicle();
    $('#list').classList.remove('open');
  };
  $('#btn-showall').onclick = () => {
    viewer.showAll();
    const { selected } = viewer.store.get();
    if (selected) renderPanel(selected);
  };

  // ---------- toolbar ----------
  for (const v of vehicle.views) {
    const b = document.createElement('button');
    b.textContent = locale.views[v.id];
    b.onclick = () => viewer.goView(v.id);
    $('#views').append(b);
  }
  for (const id of vehicle.openables) {
    const l = document.createElement('label');
    l.innerHTML = `<span>${esc(locale.openables[id])}</span><input type="checkbox" data-id="${id}">`;
    l.querySelector('input')!.onchange = (e) =>
      viewer.setOpen(id, (e.target as HTMLInputElement).checked);
    $('#openables').append(l);
  }
  $('#btn-openall').onclick = () => viewer.setAllOpen(!$('#btn-openall').dataset.all);
  for (const b of [$('#btn-openmenu'), $('#btn-lightmenu'), $('#btn-colormenu')])
    b.onclick = (e) => {
      e.stopPropagation();
      const m = b.parentElement!,
        was = m.classList.contains('open');
      document.querySelectorAll('.menu.open').forEach((x) => x.classList.remove('open'));
      m.classList.toggle('open', !was);
    };
  for (const s of vehicle.lights.switches) {
    const l = document.createElement('label');
    l.innerHTML = `<span>${esc(locale.lights[s.id])}</span><input type="checkbox" ${s.on ? 'checked' : ''}>`;
    l.querySelector('input')!.onchange = (e) =>
      viewer.setLight(s.id, (e.target as HTMLInputElement).checked);
    $('#lights').append(l);
  }
  addEventListener('pointerdown', (e) => {
    if (!(e.target as Element).closest('.menu'))
      document.querySelectorAll('.menu.open').forEach((m) => m.classList.remove('open'));
  });
  $('#btn-xray').onclick = () => viewer.setXray(!viewer.store.get().xray);
  $('#btn-explode').onclick = () => viewer.setExploded(!viewer.store.get().exploded);
  $('#btn-quality').onclick = () => viewer.nextQuality();
  vehicle.paints.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'cl' + (c.id === vehicle.defaultPaint ? ' on' : '');
    b.dataset.id = c.id;
    b.innerHTML = `<i style="background:#${c.hex.toString(16).padStart(6, '0')}"></i><span>${esc(c.name)}</span><small>${FINISH_LABEL[c.finish]}</small>`;
    b.onclick = () => viewer.setPaint(c.id);
    $('#colors').append(b);
  });
  $('#btn-list').onclick = () => $('#list').classList.toggle('open');

  // ---------- part list ----------
  const cats = $('#cats');
  {
    const byCat: Record<string, { id: string; name: string; description: string }[]> = {};
    for (const id of Object.keys(viewer.model.parts)) {
      const c = card(id);
      if (c)
        (byCat[c.card.category] ||= []).push({ id, name: c.name, description: c.text.description });
    }
    for (const cat of vehicle.categories) {
      const items = byCat[cat];
      if (!items) continue;
      const d = document.createElement('details');
      if (cat === vehicle.initialCategory) d.open = true;
      d.innerHTML = `<summary>${esc(locale.categories[cat])} <span style="margin-left:auto;margin-right:8px;opacity:.6">${items.length}</span></summary>`;
      items.sort((a, b) => a.name.localeCompare(b.name, 'it'));
      for (const it of items) {
        const b = document.createElement('button');
        b.className = 'item';
        b.dataset.id = it.id;
        b.dataset.description = it.description.toLowerCase();
        b.textContent = it.name;
        d.append(b);
      }
      cats.append(d);
    }
    cats.onclick = (e) => {
      const b = (e.target as Element).closest<HTMLElement>('.item');
      if (!b) return;
      viewer.select(b.dataset.id!, { focus: true });
      $('#list').classList.remove('open');
    };
    $<HTMLInputElement>('#search').oninput = (e) => {
      const q = (e.target as HTMLInputElement).value.trim().toLowerCase();
      cats.querySelectorAll('details').forEach((d) => {
        let n = 0;
        d.querySelectorAll<HTMLElement>('.item').forEach((b) => {
          const ok =
            !q || b.textContent!.toLowerCase().includes(q) || b.dataset.description!.includes(q);
          b.style.display = ok ? '' : 'none';
          if (ok) n++;
        });
        d.style.display = n ? '' : 'none';
        if (q) d.open = n > 0;
      });
    };
  }

  // ---------- tooltip ----------
  const tip = $('#tip');
  viewer.events.on('hover', (h) => {
    if (!h) {
      tip.hidden = true;
      return;
    }
    tip.hidden = false;
    tip.textContent = card(h.id)!.name;
    tip.style.left = h.x + 'px';
    tip.style.top = h.y + 'px';
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') viewer.select(null);
  });

  // ---------- state -> DOM ----------
  let prev = viewer.store.get();
  const sync = () => {
    const s = viewer.store.get();
    if (s.selected !== prev.selected || s === prev) {
      document.querySelectorAll('.item.sel').forEach((e) => e.classList.remove('sel'));
      if (s.selected) {
        const it = document.querySelector<HTMLElement>(`.item[data-id="${s.selected}"]`);
        if (it) {
          it.classList.add('sel');
          const d = it.closest('details');
          if (d) d.open = true;
          it.scrollIntoView({ block: 'nearest' });
        }
        renderPanel(s.selected);
      } else if (prev.selected) {
        viewer.unmountPreview($('#panel-body').querySelector<HTMLElement>('.pv') ?? panel);
        setPanel(false);
      }
    }
    let all = true;
    document.querySelectorAll<HTMLInputElement>('#openables input').forEach((i) => {
      i.checked = !!s.open[i.dataset.id!];
      if (!i.checked) all = false;
    });
    $('#btn-openall').textContent = all ? 'Chiudi tutto' : 'Apri tutto';
    $('#btn-openall').dataset.all = all ? '1' : '';
    $('#btn-xray').classList.toggle('on', s.xray);
    $('#btn-explode').classList.toggle('on', s.exploded);
    $('#btn-showall').hidden = s.hidden.size === 0;
    document
      .querySelectorAll<HTMLElement>('.item')
      .forEach((it) => it.classList.toggle('hid', s.hidden.has(it.dataset.id!)));
    document
      .querySelectorAll<HTMLElement>('.cl')
      .forEach((b) => b.classList.toggle('on', b.dataset.id === s.paint));
    $('#btn-quality').textContent = 'Qualità: ' + QUALITY_LABEL[s.quality];
    $('#btn-quality').dataset.level = s.quality;
    prev = s;
  };
  viewer.store.subscribe(sync);
  sync();
}
