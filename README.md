# Clio IV 1.5 dCi 75 — Esploratore 3D

Webapp che mostra in 3D una Renault Clio IV (2016) diesel 1.5 dCi 75 CV (motore K9K 612/628).

- Ruota, zooma e sposta la vista (mouse o touch).
- Apri e chiudi cofano, porte, portellone e sportello carburante (doppio clic sul pannello, menu **Aperture** o **Apri tutto**).
- Clicca un componente (o sceglilo dall'elenco a sinistra) per vedere di lato il pezzo isolato e la sua scheda: a cosa serve, dove si trova, dati tecnici, manutenzione, guasti tipici e codici ricambio OEM.
- Resa da showroom: studio scuro con riflessi, pavimento lucido, ombre morbide, vernici Renault metallizzate (menu **Colore**), luci dell'auto accendibili (menu **Luci**) e tre livelli di **Qualità** (Alta, Media, Bassa; scelta automatica all'avvio, forzabile anche con `?q=alta` nell'indirizzo).
- **Raggi X** rende trasparente la carrozzeria; **Esplodi motore** separa i componenti del vano motore; **Nascondi** toglie un pezzo per vedere cosa c'è sotto.

## Avvio

```bash
npm install
npm run dev      # sviluppo, http://localhost:5173
npm run build    # sito statico in dist/
```

## Struttura

- `public/models/clio_mk4.glb` — modello 3D della carrozzeria e degli interni (vedi `CREDITS.md`)
- `src/car/body.js` — carica il modello, collega ogni pezzo alla sua scheda e monta porte, cofano e portellone sui perni
- `src/car/engine.js` — vano motore K9K, trasmissione, scarico, sospensioni (ricostruiti in codice)
- `src/car/wheels.js`, `src/car/interior.js` — ruote e componenti nascosti
- `src/data/parts.js` — schede dei componenti
- `src/scene/` — showroom (ambiente, pavimento, ombre), post-produzione e livelli di qualità
- `src/car/materials.js`, `textures.js`, `lights.js` — vernice e materiali, texture procedurali, luci accendibili
- `src/main.js` — scena, interazione e interfaccia

## Note

La carrozzeria è il modello «Renault Clio MK4 2012-2020» di Merc_TV (CC BY 4.0). Vano motore e meccanica sono
ricostruzioni semplificate fatte in codice. I dati tecnici, gli intervalli di manutenzione e soprattutto i
codici OEM sono indicativi: quelli marcati «da verificare» vanno controllati con il numero di telaio.
