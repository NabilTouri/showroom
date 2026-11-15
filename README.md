# Clio IV 1.5 dCi 75 — Esploratore 3D

Webapp che mostra in 3D una Renault Clio IV (2016) diesel 1.5 dCi 75 CV (motore K9K 612/628).

- Ruota, zooma e sposta la vista (mouse o touch).
- Apri e chiudi cofano, porte, portellone e sportello carburante (doppio clic sul pannello, menu **Aperture** o **Apri tutto**).
- Clicca un componente (o sceglilo dall'elenco a sinistra) per vedere di lato il pezzo isolato e la sua scheda: a cosa serve, dove si trova, dati tecnici, manutenzione, guasti tipici e codici ricambio OEM.
- **Raggi X** rende trasparente la carrozzeria; **Esplodi motore** separa i componenti del vano motore; **Nascondi** toglie un pezzo per vedere cosa c'è sotto.

## Avvio

```bash
npm install
npm run dev      # sviluppo, http://localhost:5173
npm run build    # sito statico in dist/
```

## Struttura

- `src/car/surface.js` — superficie parametrica della carrozzeria (quote ufficiali: 4062 × 1732 × 1448 mm, passo 2589 mm)
- `src/car/body.js` — pannelli, vetri, luci e aperture ricavati dalla superficie
- `src/car/engine.js` — vano motore K9K, trasmissione, scarico, sospensioni
- `src/car/interior.js`, `src/car/wheels.js` — abitacolo e ruote
- `src/data/parts.js` — schede dei componenti
- `src/main.js` — scena, interazione e interfaccia

## Note

Il modello è costruito interamente in codice (nessun file 3D esterno): è una ricostruzione fedele nelle
proporzioni ma semplificata nei dettagli. I dati tecnici, gli intervalli di manutenzione e soprattutto i
codici OEM sono indicativi: quelli marcati «da verificare» vanno controllati con il numero di telaio.
