// Database componenti — Renault Clio IV (X98) 2016, 1.5 dCi 75 CV (K9K 612 Euro 5 / K9K 628 Euro 6)
// ATTENZIONE: dati indicativi a scopo didattico. Intervalli, capacità e codici OEM vanno sempre
// verificati con il libretto di manutenzione o con il telaio (VIN) presso un ricambista/officina.
// oem: [nome, codice, daVerificare]

export const VEHICLE = {
  name: 'Renault Clio IV 1.5 dCi 75',
  specs: [
    ['Motore', 'K9K 612 (Euro 5) / K9K 628 (Euro 6) — 4 cilindri in linea, 8 valvole, SOHC'],
    ['Cilindrata', '1461 cm³ (alesaggio 76 × corsa 80,5 mm)'],
    ['Potenza', '55 kW (75 CV) a 4000 giri/min'],
    ['Coppia', '200 Nm a 1750 giri/min'],
    ['Alimentazione', 'Common rail, turbo a geometria fissa con intercooler'],
    ['Cambio', 'Manuale 5 marce (JR5), trazione anteriore'],
    ['Dimensioni', '4062 × 1732 × 1448 mm, passo 2589 mm'],
    ['Massa a vuoto', 'circa 1.070–1.150 kg'],
    ['Serbatoio', '45 litri'],
    ['Bagagliaio', '300 litri (1.146 con sedili abbattuti)'],
    ['Prestazioni', 'circa 168 km/h, 0–100 in ~14 s'],
    ['Consumo misto', 'circa 3,6 l/100 km (omologato NEDC)'],
  ],
};

export const CATEGORIES = ['Motore', 'Alimentazione gasolio', 'Aspirazione e turbo', 'Raffreddamento e clima', 'Scarico', 'Impianto elettrico', 'Trasmissione', 'Freni', 'Sospensioni e sterzo', 'Ruote', 'Carrozzeria', 'Luci e vetri', 'Abitacolo'];

const D = {};
const P = (id, name, cat, desc, o = {}) => { D[id] = { id, name, cat, desc, ...o }; };

// ================= MOTORE =================
P('motore', 'Motore K9K 1.5 dCi', 'Motore',
  'Il cuore dell\'auto: un turbodiesel 4 cilindri in linea montato trasversalmente. Dal basso verso l\'alto si vedono la coppa dell\'olio, il monoblocco in ghisa, la testata in alluminio con un solo albero a camme (8 valvole) e il coperchio punterie. È uno dei diesel più diffusi d\'Europa (Renault, Dacia, Nissan, Mercedes).',
  {
    where: 'Al centro del vano motore, leggermente spostato verso destra; il cambio è attaccato sul lato sinistro.',
    specs: [['Sigla', 'K9K 612 / 628'], ['Cilindrata', '1461 cm³'], ['Potenza', '75 CV (55 kW) a 4000 giri'], ['Coppia', '200 Nm a 1750 giri'], ['Rapporto di compressione', 'circa 15,5:1'], ['Ordine di accensione', '1-3-4-2'], ['Olio', '5W-30 ACEA C4 (norma Renault RN0720)'], ['Quantità olio', 'circa 4,4–4,5 litri con filtro']],
    maint: ['Cambio olio e filtro: ogni 30.000 km o 2 anni da libretto; molti meccanici consigliano 15.000 km / 1 anno per proteggere bronzine e turbo.', 'Controllare il livello olio ogni 1.000–2.000 km.', 'Scaldare il motore prima di tirare e lasciarlo girare qualche secondo al minimo prima di spegnerlo dopo l\'autostrada.'],
    faults: ['Usura bronzine di biella (soprattutto con cambi olio troppo lunghi): rumore metallico di battito.', 'Trafilaggi dal coperchio punterie o dal paraolio albero motore.', 'Fumosità e cali di potenza legati a EGR/iniettori sporchi.'],
    oem: [['Olio motore 5W-30 RN0720 (es. Elf Solaris DPF)', '—', false]],
  });
P('coperchio_motore', 'Coperchio motore (copri-motore)', 'Motore',
  'Carter estetico e fonoassorbente in plastica che copre testata, iniettori e rail. Si rimuove tirandolo verso l\'alto: è tenuto da gommini a pressione. Nascondilo con il pulsante «Nascondi» per vedere cosa c\'è sotto.',
  { where: 'Sopra il motore, è la prima cosa che si vede aprendo il cofano.', maint: ['Nessuna manutenzione: controllare solo che i gommini di fissaggio siano integri.'] });
P('tappo_olio', 'Tappo rifornimento olio', 'Motore',
  'Da qui si aggiunge l\'olio motore. Se sotto il tappo trovi una «maionese» chiara può esserci condensa (tragitti brevi) o, nei casi gravi, acqua nell\'olio.',
  { where: 'Sul coperchio punterie, lato destro del motore.', specs: [['Olio', '5W-30 ACEA C4 RN0720'], ['Tra MIN e MAX', 'circa 1,5 litri']], maint: ['Rabboccare a motore spento e in piano, poco alla volta, controllando con l\'astina.'] });
P('astina_olio', 'Astina livello olio', 'Motore',
  'Asta metallica con impugnatura gialla per controllare il livello dell\'olio. Il livello va letto a motore spento da almeno 5–10 minuti, con l\'auto in piano.',
  { where: 'Sul lato anteriore del motore, verso il centro.', maint: ['Estrarre, pulire, reinserire a fondo ed estrarre di nuovo: il livello deve stare tra le due tacche.'] });
P('filtro_olio', 'Filtro olio', 'Motore',
  'Trattiene le impurità dell\'olio. Sul K9K di questa generazione è una cartuccia in carta dentro un bicchiere in plastica, avvitato sul davanti del blocco motore.',
  { where: 'Davanti al monoblocco, in basso; si raggiunge dall\'alto o da sotto.', maint: ['Sostituire a ogni cambio olio insieme agli O-ring del bicchiere.', 'Coppia di serraggio del bicchiere: circa 25 Nm (è stampata sul coperchio).'], oem: [['Filtro olio (cartuccia)', '15 20 939 20R', true], ['Alternativo vecchio tipo a vite', '82 00 768 927', true]] });
P('distribuzione', 'Cinghia di distribuzione', 'Motore',
  'Sotto questo carter c\'è la cinghia dentata che sincronizza albero motore e albero a camme e trascina anche la pompa ad alta pressione. Se si rompe, valvole e pistoni si toccano: danno gravissimo.',
  { where: 'Lato destro del motore (lato passeggero), dietro al carter in plastica.', specs: [['Tipo', 'Cinghia dentata con tenditore automatico'], ['Fasatura', 'Si esegue con spine di bloccaggio su albero motore e camme']],
    maint: ['Sostituzione kit completo (cinghia + tenditore): circa 150.000 km o 6 anni — verificare sul libretto dell\'esemplare.', 'Sostituire insieme pompa acqua e cinghia servizi.'],
    faults: ['Rottura per mancata sostituzione o tenditore grippato.', 'Fischi o ronzii dal lato distribuzione = tenditore o pompa acqua a fine vita.'],
    oem: [['Kit distribuzione', '13 0C 175 29R', true], ['Kit distribuzione + pompa acqua', '77 01 477 028 / 13 0C 175 29R + 21 01 052 96R', true]] });
P('pompa_acqua', 'Pompa acqua', 'Raffreddamento e clima',
  'Fa circolare il liquido refrigerante tra motore e radiatore. È trascinata dalla cinghia di distribuzione, per questo si cambia insieme ad essa.',
  { where: 'Sul lato destro del blocco, dietro al carter distribuzione.', maint: ['Sostituire con la distribuzione.'], faults: ['Perdite di liquido rosa/verde dal lato distribuzione.', 'Cuscinetto rumoroso.'], oem: [['Pompa acqua', '21 01 052 96R', true]] });
P('cinghia_servizi', 'Cinghia servizi (poli-V)', 'Motore',
  'Cinghia scanalata che prende il moto dalla puleggia dell\'albero motore e fa girare alternatore e compressore del clima. Un tendicinghia automatico la mantiene tesa.',
  { where: 'Estremità destra del motore, davanti al carter distribuzione.', maint: ['Sostituzione con il kit distribuzione (o prima se screpolata).', 'Mai far entrare pezzi di cinghia servizi rotta nella distribuzione: sul K9K è un classico che distrugge il motore.'], faults: ['Cigolii a freddo, sfilacciamenti.', 'Puleggia albero motore (damper) con gomma scollata.'], oem: [['Kit cinghia servizi con tenditore', '11 72 013 81R', true]] });
P('alternatore', 'Alternatore', 'Impianto elettrico',
  'Trasforma parte della potenza del motore in corrente per ricaricare la batteria e alimentare tutti gli utilizzatori. Sulle versioni Stop&Start / Energy è pilotato dalla centralina per recuperare energia in rilascio.',
  { where: 'Davanti al motore, in alto a destra.', specs: [['Tensione di ricarica', '13,5–14,8 V'], ['Corrente', 'circa 110–125 A']], faults: ['Spia batteria accesa, luci che calano.', 'Puleggia a ruota libera rumorosa.'], oem: [['Alternatore', '23 10 032 22R', true]] });
P('compressore_clima', 'Compressore climatizzatore', 'Raffreddamento e clima',
  'Comprime il gas refrigerante dell\'aria condizionata. È trascinato dalla cinghia servizi e si innesta con una frizione elettromagnetica.',
  { where: 'Davanti al motore, in basso a destra, sotto l\'alternatore.', specs: [['Gas', 'R134a o R1234yf secondo data di produzione (vedi etichetta sotto il cofano)'], ['Quantità', 'circa 450–500 g']], maint: ['Accendere il clima qualche minuto anche in inverno per lubrificare le guarnizioni.', 'Ricarica/controllo ogni 2–3 anni.'], oem: [['Compressore A/C', '92 60 018 83R', true]] });
P('condensatore', 'Condensatore clima', 'Raffreddamento e clima',
  'È il «radiatore» dell\'aria condizionata: raffredda il gas compresso e lo fa tornare liquido. È il primo scambiatore dietro il paraurti, quindi il più esposto a sassi e insetti.',
  { where: 'Davanti al radiatore motore, subito dietro la calandra.', faults: ['Forature da pietrisco → perdita di gas, clima che non raffredda.'], oem: [['Condensatore', '92 10 020 96R', true]] });
P('radiatore', 'Radiatore motore', 'Raffreddamento e clima',
  'Scambiatore in alluminio che cede all\'aria il calore del liquido refrigerante. Il liquido entra caldo dall\'alto e torna al motore più freddo dal basso.',
  { where: 'Dietro la calandra, tra condensatore e ventola.', specs: [['Liquido', 'Glaceol RX Type D (già miscelato)'], ['Capacità circuito', 'circa 5,5–6 litri']], maint: ['Sostituzione liquido: circa ogni 4–5 anni (verificare libretto).', 'Tenere pulite le alette da foglie e insetti.'], oem: [['Radiatore acqua', '21 41 000 78R', true]] });
P('ventola', 'Elettroventola radiatore', 'Raffreddamento e clima',
  'Ventola elettrica che aspira aria attraverso radiatore e condensatore quando l\'auto è ferma o lenta, oppure quando il clima è acceso.',
  { where: 'Dietro il radiatore, verso il motore.', faults: ['Motore elettrico bruciato o resistenza guasta: surriscaldamento in coda.'], oem: [['Gruppo elettroventola', '21 48 159 99R', true]] });
P('manicotti_radiatore', 'Manicotti radiatore', 'Raffreddamento e clima',
  'Tubi in gomma che collegano motore e radiatore. Quello superiore porta il liquido caldo al radiatore, quello inferiore lo riporta al motore.',
  { maint: ['Controllare che non siano gonfi, screpolati o unti; verificare le fascette.'] });
P('vaschetta_refrigerante', 'Vaschetta liquido refrigerante', 'Raffreddamento e clima',
  'Serbatoio di espansione del circuito di raffreddamento. Il livello si controlla a motore FREDDO e deve stare tra MIN e MAX. Mai aprire il tappo a motore caldo: il circuito è in pressione.',
  { where: 'In fondo al vano motore, lato destro, vicino al parafiamma.', specs: [['Liquido', 'Glaceol RX Type D (giallo/verde)'], ['Taratura tappo', 'circa 1,4 bar']], faults: ['Cali di livello = perdita (pompa acqua, radiatore, manicotti) da cercare subito.'], oem: [['Liquido refrigerante Glaceol RX D', '77 11 428 132', true]] });
P('termostato', 'Termostato', 'Raffreddamento e clima',
  'Valvola che tiene chiuso il circuito verso il radiatore finché il motore non arriva in temperatura (circa 83–89 °C), poi lo apre.',
  { where: 'Sulla testata, lato destro, dentro una scatola in plastica.', faults: ['Bloccato aperto: motore che non scalda, consumi alti, riscaldamento debole.', 'Scatola in plastica che perde.'], oem: [['Termostato con scatola', '11 06 091 25R', true]] });

// ================= ALIMENTAZIONE =================
P('filtro_gasolio', 'Filtro gasolio', 'Alimentazione gasolio',
  'Trattiene sporco e acqua presenti nel gasolio prima che arrivino a pompa e iniettori, che lavorano con tolleranze di millesimi di millimetro. Ha un sensore di presenza acqua e, accanto, la pompetta manuale di adescamento.',
  { where: 'Nel vano motore, lato destro anteriore.', maint: ['Sostituzione: ogni 60.000 km circa (ogni 2 tagliandi) o prima con gasolio di dubbia qualità.', 'Dopo la sostituzione spurgare l\'aria con la pompetta finché diventa dura.'], faults: ['Filtro intasato: vuoti in accelerazione, difficoltà di avviamento.', 'Spia acqua nel gasolio.'], oem: [['Filtro gasolio', '16 40 395 94R', true], ['In alternativa', '16 40 093 84R', true]] });
P('pompa_alta_pressione', 'Pompa alta pressione', 'Alimentazione gasolio',
  'Porta il gasolio fino a circa 1600 bar e lo manda al rail. È trascinata dalla cinghia di distribuzione e lubrificata dal gasolio stesso: per questo non bisogna mai restare a secco né usare benzina per errore.',
  { where: 'Lato destro del motore, in alto verso il parafiamma.', specs: [['Pressione massima', 'circa 1600 bar'], ['Regolazione', 'Valvola dosatrice comandata dalla centralina']], faults: ['Limatura metallica nel circuito (pompa che si usura) → danni a iniettori.', 'Regolatore di pressione difettoso: spegnimenti, avviamento difficile.'], oem: [['Pompa alta pressione', '16 70 038 20R', true]] });
P('rail', 'Rail (collettore comune)', 'Alimentazione gasolio',
  'Tubo-accumulatore in acciaio che tiene il gasolio ad altissima pressione a disposizione dei 4 iniettori: è il «common rail». Monta un sensore di pressione che la centralina legge in continuazione.',
  { where: 'Sopra la testata, lato posteriore, sotto il coperchio motore.', faults: ['Sensore pressione rail guasto: motore in recovery.', 'Mai allentare i tubi a motore acceso: getto a 1600 bar.'], oem: [['Sensore pressione rail', '—', true]] });
P('iniettori', 'Iniettori', 'Alimentazione gasolio',
  'Quattro iniettori elettronici che polverizzano il gasolio direttamente nei cilindri, con più iniezioni per ogni ciclo (pilota, principale, post). Ognuno ha un codice di taratura che va registrato in centralina quando si sostituisce.',
  { where: 'Sulla testata, uno per cilindro, sotto il coperchio motore.', specs: [['Tipo', 'Elettroiniettori common rail (Continental/Siemens VDO su Euro 5)'], ['Codifica', 'Codice individuale da inserire con la diagnosi']], faults: ['Trafilamento dalle rondelle in rame: catrame nero attorno all\'iniettore e «ciuf ciuf» al minimo.', 'Minimo irregolare, fumo, battito in testa.'], oem: [['Iniettore', '16 60 062 12R', true], ['Rondella parafiamma', '82 00 249 293', true]] });
P('candelette', 'Candelette di preriscaldamento', 'Alimentazione gasolio',
  'Quattro resistenze che scaldano le camere di combustione per aiutare l\'avviamento a freddo (la spia a «molla» gialla sul quadro). Restano accese anche qualche istante dopo la partenza per ridurre fumo e rumore.',
  { where: 'Avvitate nella testata, lato anteriore, una per cilindro.', maint: ['Controllo/sostituzione indicativa ogni 100.000–120.000 km; smontarle a motore tiepido per non spezzarle.'], faults: ['Avviamento difficile e fumo bianco a freddo, spia motore.'], oem: [['Candeletta', '11 06 571 60R', true]] });
P('serbatoio', 'Serbatoio carburante', 'Alimentazione gasolio',
  'Serbatoio in plastica da 45 litri sotto il divano posteriore. All\'interno c\'è il galleggiante del livello; il bocchettone arriva dallo sportellino sul fianco destro.',
  { where: 'Sotto il pavimento, davanti all\'assale posteriore.', specs: [['Capacità', '45 litri'], ['Carburante', 'Gasolio EN 590 (max B7; B10 dove previsto dal libretto)']] });
P('sportello_carburante', 'Sportello carburante', 'Carrozzeria',
  'Sportellino che copre il tappo del serbatoio. Si sblocca insieme alla chiusura centralizzata.',
  { where: 'Fianco posteriore destro.', specs: [['Carburante', 'Solo gasolio'], ['Capacità serbatoio', '45 litri']] });

// ================= ASPIRAZIONE / TURBO =================
P('filtro_aria', 'Scatola filtro aria', 'Aspirazione e turbo',
  'Contiene il filtro in carta che pulisce l\'aria aspirata dal motore. Un diesel aspira migliaia di litri d\'aria al minuto: un filtro sporco toglie potenza e aumenta consumi e fumo.',
  { where: 'Lato sinistro anteriore del vano motore.', maint: ['Sostituzione: ogni 30.000 km o 2 anni circa (dimezzare in zone polverose).'], oem: [['Filtro aria', '16 54 678 74R', true]] });
P('debimetro', 'Debimetro (misuratore massa aria)', 'Aspirazione e turbo',
  'Sensore a film caldo che misura quanta aria entra nel motore. La centralina usa questo dato per dosare gasolio ed EGR.',
  { where: 'Sul condotto all\'uscita della scatola filtro aria.', faults: ['Motore fiacco, fumo nero, consumi alti; spesso senza spia accesa.'], maint: ['Si può pulire con spray specifico; mai toccare l\'elemento sensibile.'], oem: [['Debimetro', '82 00 682 558', true]] });
P('manicotto_aspirazione', 'Condotto aspirazione turbo', 'Aspirazione e turbo',
  'Tubo che porta l\'aria filtrata dalla scatola filtro all\'ingresso del compressore del turbo. Vi arriva anche lo sfiato dei vapori d\'olio del motore, per questo all\'interno è normale trovare un velo d\'olio.',
  { faults: ['Crepe o fascette lente: aria non filtrata nel turbo.'] });
P('turbo', 'Turbocompressore', 'Aspirazione e turbo',
  'I gas di scarico fanno girare una turbina (lato caldo, arrugginito) collegata da un alberino a un compressore (lato freddo, in alluminio) che spinge più aria nei cilindri. Sul 75 CV è a geometria fissa con valvola wastegate comandata dall\'attuatore a depressione. Gira fino a oltre 200.000 giri/min, lubrificato dall\'olio motore.',
  { where: 'Dietro il motore, lato parafiamma, attaccato al collettore di scarico.', specs: [['Tipo', 'Geometria fissa con wastegate (BorgWarner KP35)'], ['Pressione di sovralimentazione', 'circa 1,0–1,2 bar relativi']],
    maint: ['Olio buono e cambiato spesso = turbo che dura.', 'Non spegnere subito dopo un tratto tirato.'], faults: ['Fischio forte, fumo azzurro, olio nei manicotti in quantità.', 'Wastegate bloccata: poca o troppa pressione.'], oem: [['Turbocompressore', '14 41 170 20R', true], ['Codice costruttore BorgWarner', '5435 970 0033', true]] });
P('manicotti_turbo', 'Manicotti intercooler', 'Aspirazione e turbo',
  'Tubi in gomma rinforzata che portano l\'aria compressa (calda) dal turbo all\'intercooler e da lì (raffreddata) al collettore di aspirazione.',
  { faults: ['Manicotto tagliato o sfilato: soffio forte in accelerazione, perdita di potenza e fumo nero.'], maint: ['Controllare fascette e tracce d\'olio all\'esterno.'] });
P('intercooler', 'Intercooler', 'Aspirazione e turbo',
  'Radiatore aria-aria che raffredda l\'aria compressa dal turbo: aria più fredda è più densa, quindi più ossigeno e più rendimento.',
  { where: 'Nella parte anteriore, in basso a sinistra accanto al radiatore.', faults: ['Forature o vasche laterali che perdono.'], oem: [['Intercooler', '14 46 141 61R', true]] });
P('collettore_aspirazione', 'Collettore di aspirazione', 'Aspirazione e turbo',
  'Distribuisce l\'aria (e i gas EGR ricircolati) ai 4 cilindri. Con gli anni si incrosta di morchia nera: miscela di fuliggine EGR e vapori d\'olio.',
  { where: 'Lato anteriore della testata.', maint: ['Pulizia consigliata se il motore è sporco di EGR.'] });
P('egr', 'Valvola EGR e scambiatore', 'Aspirazione e turbo',
  'Rimanda una parte dei gas di scarico in aspirazione per abbassare la temperatura di combustione e ridurre gli ossidi di azoto (NOx). I gas passano prima in un piccolo scambiatore raffreddato ad acqua.',
  { where: 'Estremità sinistra della testata, lato cambio.', faults: ['Valvola incrostata/bloccata: spia iniezione, vuoti, fumo nero, minimo irregolare. È il guasto più tipico dei diesel usati in città.'], maint: ['Fare ogni tanto tratti extraurbani a motore caldo.', 'Pulizia o sostituzione quando si blocca.'], oem: [['Valvola EGR', '14 71 000 74R', true]] });

// ================= SCARICO =================
P('collettore_scarico', 'Collettore di scarico', 'Scarico',
  'Fusione in ghisa che raccoglie i gas roventi dai 4 cilindri e li porta alla turbina del turbo. Lavora a diverse centinaia di gradi: per questo è sempre arrugginito in superficie.',
  { where: 'Lato posteriore della testata, verso il parafiamma.', faults: ['Crepe o guarnizione soffiata: soffio/ticchettio a freddo e odore di scarico.'] });
P('fap', 'Catalizzatore e filtro antiparticolato (FAP)', 'Scarico',
  'Subito dopo il turbo ci sono il catalizzatore ossidante e il filtro antiparticolato, che intrappola la fuliggine. Periodicamente la centralina la brucia con una «rigenerazione» (post-iniezioni di gasolio, circa 600 °C). Due tubicini portano la pressione a monte e a valle a un sensore differenziale. La versione Euro 6 (K9K 628) aggiunge una trappola per gli NOx.',
  { where: 'Dietro il motore, in verticale contro il parafiamma.', maint: ['Tratti di 15–20 minuti a velocità costante sopra i 2.000 giri aiutano le rigenerazioni.', 'Usare solo olio «low SAPS» (ACEA C4).'], faults: ['Intasamento con uso solo urbano: spia, potenza ridotta, livello olio che sale (gasolio in coppa).', 'Sensore di pressione differenziale difettoso.'], oem: [['Sensore pressione differenziale FAP', '22 77 107 56R', true]] });
P('scarico', 'Tubo di scarico e silenziatore', 'Scarico',
  'Porta i gas dal FAP al retro dell\'auto, passando sotto il pavimento; il silenziatore posteriore attenua il rumore. Sulla Clio dCi il terminale è nascosto e rivolto verso il basso.',
  { where: 'Sotto il pianale, dal vano motore al paraurti posteriore.', faults: ['Corrosione del silenziatore, gommini di sostegno rotti (vibrazioni).'] });

// ================= ELETTRICO =================
P('batteria', 'Batteria 12 V', 'Impianto elettrico',
  'Fornisce la corrente per l\'avviamento e stabilizza l\'impianto. Con Stop&Start serve una batteria EFB, più robusta. Il polo positivo (+) è coperto dal cappuccio rosso.',
  { where: 'Lato sinistro del vano motore, sotto un coperchio in plastica.', specs: [['Tensione a riposo', '12,4–12,8 V'], ['Capacità', '60–70 Ah, 600–720 A (EFB con Stop&Start)'], ['Formato', 'L2 / L3 (verificare misure)']], maint: ['Durata tipica 4–6 anni.', 'Scollegare sempre prima il negativo (−), ricollegarlo per ultimo.'], faults: ['Avviamento lento, Stop&Start che non interviene, spie casuali.'], oem: [['Batteria 70 Ah EFB', '24 41 039 96R', true]] });
P('centralina_motore', 'Centralina motore (ECU)', 'Impianto elettrico',
  'Il computer che gestisce iniezione, turbo, EGR, rigenerazione FAP e preriscaldo leggendo decine di sensori. È collegata alla presa diagnosi OBD sotto la plancia.',
  { where: 'Accanto alla batteria, lato sinistro.', faults: ['Raramente si guasta: più spesso sono ossidati i connettori o le masse.'] });
P('scatola_fusibili', 'Scatola fusibili e relè vano motore', 'Impianto elettrico',
  'Contiene i fusibili di potenza e i relè (ventola, preriscaldo candelette, pompa, luci). Una seconda scatola fusibili è nell\'abitacolo, a sinistra del volante.',
  { where: 'Lato sinistro del vano motore, vicino alla batteria.', maint: ['Sostituire un fusibile sempre con uno dello stesso amperaggio (colore).'] });
P('motorino_avviamento', 'Motorino di avviamento', 'Impianto elettrico',
  'Motore elettrico che fa girare il volano per mettere in moto. Con Stop&Start è rinforzato per sopportare molti più avviamenti.',
  { where: 'In basso dietro il motore, sulla campana del cambio.', faults: ['«Clac» senza avviamento (elettromagnete), giri lenti (spazzole).'], oem: [['Motorino avviamento', '23 30 008 71R', true]] });

// ================= TRASMISSIONE =================
P('cambio', 'Cambio manuale JR5 (5 marce)', 'Trasmissione',
  'Cambio manuale a 5 rapporti con differenziale integrato, comandato da due cavi. È imbullonato al lato sinistro del motore; dentro la campana c\'è la frizione.',
  { where: 'A sinistra del motore.', specs: [['Tipo', 'JR5, 5 marce + RM'], ['Olio', 'Tranself NFJ 75W-80'], ['Quantità', 'circa 2,5–2,8 litri']], maint: ['Renault lo considera «a vita»; molti meccanici lo cambiano attorno ai 100.000–120.000 km.'], faults: ['Cuscinetti rumorosi, innesti duri a freddo, paraoli semiassi che trasudano.'], oem: [['Olio cambio Tranself NFJ 75W-80', '—', false]] });
P('frizione', 'Frizione e volano', 'Trasmissione',
  'Disco, spingidisco e cuscinetto reggispinta collegano e scollegano motore e cambio quando premi il pedale. Il comando è idraulico (stesso liquido dei freni).',
  { where: 'Tra motore e cambio, dentro la campana.', specs: [['Diametro disco', 'circa 215 mm']], faults: ['Slittamento in salita con marce alte, pedale duro, vibrazioni in partenza.'], maint: ['Durata tipica 120.000–200.000 km secondo lo stile di guida.'], oem: [['Kit frizione', '30 20 500 14R', true]] });
P('semiassi', 'Semiassi e giunti omocinetici', 'Trasmissione',
  'Due alberi che portano la coppia dal differenziale alle ruote anteriori. I giunti omocinetici, protetti da cuffie in gomma piene di grasso, permettono di sterzare e di seguire il movimento delle sospensioni.',
  { faults: ['Cuffia tagliata: il grasso esce, entra sporco e il giunto fa «tac-tac» in sterzata.'], maint: ['Ispezionare le cuffie a ogni tagliando.'] });

// ================= FRENI =================
P('servofreno', 'Servofreno e pompa freni', 'Freni',
  'Il servofreno (il grande «piatto» nero) usa la depressione di una pompa a vuoto per moltiplicare la forza del piede; la pompa freni davanti ad esso manda il liquido in pressione alle ruote.',
  { where: 'Sul parafiamma, lato sinistro, davanti al guidatore.', faults: ['Pedale duro = manca depressione; pedale spugnoso = aria nel circuito.'] });
P('vaschetta_freni', 'Vaschetta liquido freni', 'Freni',
  'Serbatoio del liquido freni (alimenta anche il comando frizione). Il livello scende lentamente con il consumo delle pastiglie: un calo rapido indica una perdita.',
  { where: 'In fondo a sinistra, sopra la pompa freni.', specs: [['Liquido', 'DOT 4']], maint: ['Sostituzione completa ogni 2–3 anni: il liquido assorbe umidità e perde efficacia.'] });
P('abs', 'Gruppo ABS / ESP', 'Freni',
  'Blocco idraulico con elettrovalvole e centralina che modula la pressione su ogni ruota per evitare il bloccaggio in frenata (ABS) e correggere le sbandate (ESP). Legge i sensori di velocità delle 4 ruote.',
  { where: 'In basso a sinistra, vicino al parafiamma.', faults: ['Spie ABS/ESP accese: spesso un sensore ruota o il suo cablaggio.'] });
const frenoAnt = { specs: [['Dischi', 'Autoventilanti Ø 258 × 22 mm'], ['Spessore minimo disco', '19,8 mm'], ['Pinza', 'Flottante a un pistoncino']], maint: ['Pastiglie: controllo a ogni tagliando (durata tipica 30.000–50.000 km).', 'Dischi: di solito ogni 2 cambi pastiglie.'], faults: ['Vibrazioni al volante in frenata (dischi ovalizzati), fischi, pinza che resta frenata.'], oem: [['Pastiglie anteriori', '41 06 084 81R', true], ['Dischi anteriori Ø258', '40 20 641 51R', true]] };
P('freno_ant', 'Freno a disco anteriore', 'Freni', 'Disco autoventilante solidale alla ruota, stretto dalle pastiglie montate nella pinza flottante. I freni anteriori fanno circa il 70% del lavoro di frenata.', frenoAnt);
P('freno_post', 'Freno a tamburo posteriore', 'Freni', 'Sulla dCi 75 i freni posteriori sono a tamburo: due ganasce si allargano contro l\'interno del tamburo. Qui agisce anche il freno a mano, tramite cavo. Nel mozzo c\'è il cuscinetto ruota con l\'anello del sensore ABS.',
  { specs: [['Tamburo', 'Ø 203 mm (8")']], maint: ['Ganasce: durano molto (spesso oltre 100.000 km); pulizia e registrazione periodica.'], faults: ['Freno a mano con corsa lunga, cilindretto che perde.'], oem: [['Kit ganasce posteriori', '44 06 000 08R', true], ['Tamburo con cuscinetto', '43 20 020 67R', true]] });

// ================= SOSPENSIONI / STERZO =================
P('sospensione_ant', 'Sospensione anteriore McPherson', 'Sospensioni e sterzo',
  'Schema McPherson: l\'ammortizzatore con la molla attorno fa anche da elemento di guida della ruota; in basso c\'è il braccio triangolare con la testina sferica. In alto il supporto con cuscinetto permette alla ruota di sterzare.',
  { maint: ['Ammortizzatori: controllo dagli 80.000 km; sostituirli sempre a coppie.', 'Controllare testine, silent-block e biellette barra.'], faults: ['Colpi sulle buche (biellette, supporti), auto che ondeggia, usura irregolare gomme.', 'Molle spezzate sull\'ultima spira.'], oem: [['Ammortizzatore anteriore', '54 30 269 83R', true], ['Braccio oscillante', '54 50 046 86R', true]] });
P('sospensione_post', 'Molla e ammortizzatore posteriore', 'Sospensioni e sterzo',
  'Dietro, molla e ammortizzatore sono separati e lavorano sul ponte torcente.',
  { maint: ['Sostituire gli ammortizzatori a coppie.'], faults: ['Trasudamenti d\'olio dall\'ammortizzatore, rimbalzi.'], oem: [['Ammortizzatore posteriore', '56 21 008 28R', true]] });
P('ponte_posteriore', 'Ponte torcente posteriore', 'Sospensioni e sterzo',
  'Assale semi-indipendente: due bracci longitudinali uniti da una traversa che si torce quando una ruota sale rispetto all\'altra. Soluzione semplice, robusta e poco ingombrante.',
  { faults: ['Silent-block anteriori del ponte usurati: retrotreno «ballerino» e colpi.'] });
P('sterzo', 'Scatola sterzo e piantone', 'Sospensioni e sterzo',
  'Cremagliera che trasforma la rotazione del volante nello spostamento laterale dei tiranti. Il servosterzo è elettrico (motore sul piantone, in abitacolo): non c\'è olio idroguida da controllare.',
  { where: 'Dietro il motore, in basso, fissata alla culla.', specs: [['Servosterzo', 'Elettrico (EPS) sul piantone'], ['Diametro di sterzata', 'circa 10,6 m']], faults: ['Testine e tiranti con gioco: sterzo impreciso, rumori.'], maint: ['Convergenza da controllare dopo urti o cambio gomme con usura anomala.'] });
P('barra_stabilizzatrice', 'Barra stabilizzatrice', 'Sospensioni e sterzo',
  'Barra d\'acciaio che collega le due sospensioni anteriori e limita il rollio in curva.',
  { faults: ['Biellette e gommini usurati: «toc toc» sulle sconnessioni.'] });
P('culla_motore', 'Culla motore (telaietto)', 'Sospensioni e sterzo',
  'Telaietto in acciaio imbullonato alla scocca che sostiene motore/cambio (tramite il supporto inferiore antibeccheggio), bracci sospensione, sterzo e barra stabilizzatrice.',
  {});

// ================= RUOTE =================
P('ruota', 'Ruota e pneumatico', 'Ruote',
  'Cerchio in lega da 16" con pneumatico. Fissaggio a 4 bulloni.',
  { specs: [['Misure pneumatici', '185/65 R15 88T oppure 195/55 R16 87H'], ['Foratura', '4 × 100 mm, foro centrale 60,1 mm'], ['Coppia bulloni', '105 Nm'], ['Pressione (carico normale)', 'circa 2,2–2,4 bar ant. / 2,0–2,2 bar post. (vedi etichetta sulla porta guidatore)']], maint: ['Controllare la pressione ogni mese a gomme fredde.', 'Battistrada minimo legale 1,6 mm (consigliati 3 mm, 4 mm per invernali).', 'Invertire anteriori/posteriori ogni 10.000–15.000 km.'] });
P('ruotino', 'Ruota di scorta / kit gonfiaggio', 'Ruote',
  'Sotto il piano del bagagliaio c\'è il ruotino di scorta (o, secondo l\'allestimento, il kit con compressore e sigillante) insieme a cric e chiave.',
  { where: 'Sotto il piano di carico del bagagliaio.', specs: [['Ruotino', 'velocità massima 80 km/h'], ['Pressione ruotino', 'circa 4,2 bar']], maint: ['Controllare la pressione del ruotino almeno una volta l\'anno.', 'Il sigillante del kit ha una data di scadenza.'] });

// ================= CARROZZERIA =================
P('cofano', 'Cofano motore', 'Carrozzeria', 'Si apre tirando la leva sotto la plancia (lato sinistro) e poi sbloccando il gancio di sicurezza sotto il bordo anteriore. Si regge con un\'asta di sostegno.', { maint: ['Lubrificare ogni tanto serratura e gancio di sicurezza.'] });
P('porta_ant', 'Porta anteriore', 'Carrozzeria', 'Porta con alzacristallo elettrico, altoparlante e barra anti-intrusione. La maniglia è in tinta carrozzeria.', { maint: ['Lubrificare cerniere e tirante; pulire i fori di scolo acqua sul bordo inferiore.'] });
P('porta_post', 'Porta posteriore', 'Carrozzeria', 'Uno dei tratti di stile della Clio IV: la maniglia è nascosta nel montante nero accanto al vetro, così l\'auto sembra una 3 porte. Sul battente c\'è la sicura bambini.', {});
P('portellone', 'Portellone posteriore', 'Carrozzeria', 'Dà accesso al bagagliaio da 300 litri. È sorretto da due molle a gas; il pulsante di apertura è sopra la targa. Integra lunotto termico, tergilunotto, terza luce stop nello spoiler e la parte interna dei fanali.', { faults: ['Molle a gas scariche: il portellone non resta su.', 'Cablaggio nel soffietto che si spezza (tergilunotto, luci targa).'], specs: [['Tergilunotto', 'circa 300 mm (verificare)']] });
P('paraurti_ant', 'Paraurti anteriore', 'Carrozzeria', 'Scudo in plastica verniciata che integra calandra, presa d\'aria inferiore, luci diurne e targa. Dietro ci sono la traversa in acciaio e gli assorbitori d\'urto.', {});
P('paraurti_post', 'Paraurti posteriore', 'Carrozzeria', 'Scudo posteriore in plastica con catadiottri e fascia inferiore nera. Può ospitare i sensori di parcheggio.', {});
P('parafango', 'Parafango anteriore', 'Carrozzeria', 'Pannello imbullonato (sostituibile senza saldature) che copre la ruota anteriore. All\'interno c\'è il passaruota in plastica.', {});
P('fiancata', 'Fiancata e montanti', 'Carrozzeria', 'Parte strutturale della scocca: brancardo sotto le porte, montanti del tetto e parafango posteriore, saldati in un pezzo unico. La scalfatura bassa sulle porte è la firma stilistica della Clio IV (design Laurens van den Acker).', {});
P('tetto', 'Tetto', 'Carrozzeria', 'Padiglione in lamiera con antenna radio corta in coda.', {});
P('calandra', 'Calandra e logo', 'Carrozzeria', 'Fascia nero lucido che unisce i due fari con al centro la grande losanga Renault in verticale: il «volto» inaugurato proprio dalla Clio IV.', {});
P('specchio', 'Specchio retrovisore', 'Carrozzeria', 'Regolabile elettricamente e riscaldato; integra l\'indicatore di direzione laterale.', { oem: [['Vetro specchio', '—', true]] });

// ================= LUCI E VETRI =================
P('faro', 'Faro anteriore', 'Luci e vetri', 'Gruppo ottico alogeno con anabbagliante, abbagliante, luce di posizione e indicatore di direzione. Le lampadine si cambiano da dietro, dal vano motore.',
  { specs: [['Anabbagliante', 'H7 55 W'], ['Abbagliante', 'H1 55 W (verificare: alcune versioni H7)'], ['Indicatore', 'PY21W'], ['Posizione', 'W5W']], maint: ['Sostituire le lampadine a coppie; non toccare il bulbo con le dita.', 'Regolare l\'assetto fari con la rotella in plancia in base al carico.'] });
P('drl', 'Luci diurne LED e fendinebbia', 'Luci e vetri', 'Nelle prese d\'aria laterali del paraurti: striscia LED delle luci diurne (si accendono da sole all\'avviamento) e, sotto, il fendinebbia.', { specs: [['Diurne', 'LED (modulo non sostituibile a lampadina)'], ['Fendinebbia', 'H16 19 W (verificare)']] });
P('fanale', 'Fanale posteriore (esterno)', 'Luci e vetri', 'Parte del fanale fissata alla carrozzeria: posizione, stop e indicatore di direzione.', { specs: [['Stop/posizione', 'P21/5W'], ['Indicatore', 'PY21W']] });
P('fanale_int', 'Fanale posteriore (su portellone)', 'Luci e vetri', 'Parte del fanale montata sul portellone: retromarcia e retronebbia.', { specs: [['Retromarcia', 'W16W'], ['Retronebbia', 'P21W']] });
P('parabrezza', 'Parabrezza', 'Luci e vetri', 'Vetro stratificato incollato alla scocca: contribuisce alla rigidità e fa da appoggio all\'airbag passeggero. In alto ospita il sensore pioggia/luce (se presente).', { maint: ['Una scheggiatura piccola si ripara; se è nel campo visivo del guidatore va sostituito.'] });
P('tergicristalli', 'Tergicristalli', 'Luci e vetri', 'Due spazzole piatte (flat blade) con attacco a baionetta.', { specs: [['Lato guida', 'circa 650 mm (26")'], ['Lato passeggero', 'circa 350–400 mm (verificare)']], maint: ['Sostituire una volta l\'anno o quando lasciano strisce.'], oem: [['Kit spazzole anteriori', '28 89 019 67R', true]] });
P('vaschetta_lavavetri', 'Vaschetta liquido lavavetri', 'Luci e vetri', 'Si rabbocca dal tappo blu. Il serbatoio vero e proprio è nascosto in basso dietro il paraurti/parafango destro.', { where: 'Bocchettone con tappo blu, lato destro anteriore del vano motore.', specs: [['Capacità', 'circa 3 litri (di più con lavafari)']], maint: ['In inverno usare liquido antigelo, mai sola acqua.'] });
P('vetro_ant', 'Vetro porta anteriore', 'Luci e vetri', 'Cristallo temperato discendente con alzacristallo elettrico.', {});
P('vetro_post', 'Vetro porta posteriore', 'Luci e vetri', 'Cristallo discendente (elettrico o manuale secondo allestimento).', {});
P('lunotto', 'Lunotto termico', 'Luci e vetri', 'Vetro posteriore con resistenza di sbrinamento e tergilunotto.', {});

// ================= ABITACOLO =================
P('plancia', 'Plancia', 'Abitacolo', 'Cruscotto con schermo multimediale centrale (Media Nav o R-Link da 7"), bocchette, comandi clima e cassetto portaoggetti. La presa diagnosi OBD è in basso, lato guida.', {});
P('quadro_strumenti', 'Quadro strumenti', 'Abitacolo', 'Tachimetro digitale centrale con contagiri e livello carburante ai lati, computer di bordo e spie.', { specs: [['Spia chiave inglese', 'tagliando in scadenza'], ['Spia «molla» gialla', 'preriscaldo candelette / anomalia iniezione se lampeggia']] });
P('volante', 'Volante e airbag guidatore', 'Abitacolo', 'Volante regolabile in altezza e profondità con airbag frontale; i comandi radio sono sul satellite dietro la razza destra, quelli del regolatore di velocità sul volante.', {});
P('leva_cambio', 'Leva cambio e freno a mano', 'Abitacolo', 'Leva del cambio a 5 marce (retromarcia sollevando l\'anello sotto il pomello) e freno a mano meccanico a cavo.', {});
P('pedaliera', 'Pedaliera', 'Abitacolo', 'Frizione (idraulica), freno e acceleratore elettronico (potenziometro, senza cavo).', {});
P('sedile_ant', 'Sedile anteriore', 'Abitacolo', 'Sedile con poggiatesta regolabile e airbag laterale nello schienale; quello del guidatore è regolabile in altezza.', {});
P('divano_post', 'Divano posteriore', 'Abitacolo', 'Panca a tre posti con schienale abbattibile (frazionato 60/40 secondo allestimento) e attacchi Isofix sui posti laterali.', {});
P('cappelliera', 'Cappelliera', 'Abitacolo', 'Ripiano rigido rimovibile che copre il bagagliaio.', {});
P('filtro_abitacolo', 'Filtro abitacolo (antipolline)', 'Abitacolo', 'Filtra l\'aria che entra dalle bocchette. Si sfila lateralmente dal gruppo riscaldamento, dal vano piedi del passeggero.', { where: 'Dietro la plancia, accessibile dal lato passeggero in basso.', maint: ['Sostituzione ogni anno o 15.000–30.000 km: se intasato i vetri si appannano e il clima rende meno.'], oem: [['Filtro abitacolo', '27 27 730 16R', true]] });
P('airbag', 'Airbag passeggero', 'Abitacolo', 'Airbag frontale lato passeggero, disattivabile con la chiave (interruttore sul fianco della plancia) per montare un seggiolino contromarcia.', {});

export const PARTS = D;

const SIDE = { sx: 'sinistro', dx: 'destro' };
const SIDEF = { sx: 'sinistra', dx: 'destra' };
const FEM = new Set(['porta_ant', 'porta_post', 'ruota', 'fiancata', 'sospensione_ant', 'sospensione_post']);
const POS = { ruota_ant: 'anteriore', ruota_post: 'posteriore' };

// risolve un id della scena (es. "porta_ant_sx", "ruota_post_dx") nella scheda corrispondente
export function getPart(id) {
  if (D[id]) return { ...D[id], sceneId: id };
  let m = id.match(/^(.*)_(sx|dx)$/);
  if (m) {
    let base = m[1], extra = '';
    const r = base.match(/^ruota_(ant|post)$/);
    if (r) { base = 'ruota'; extra = r[1] === 'ant' ? ' anteriore' : ' posteriore'; }
    if (D[base]) {
      const s = (FEM.has(base) ? SIDEF : SIDE)[m[2]];
      return { ...D[base], sceneId: id, name: `${D[base].name}${extra} ${s}` };
    }
  }
  return null;
}
