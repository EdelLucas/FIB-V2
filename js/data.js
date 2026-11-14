// FIB Personalabteilung · Stammdaten: Rangliste + Standard-Mitarbeiter
const RANKS=["30. Director of FIB","29. Deputy Director of FIB","28. Assistant Director of FIB","27. Divisional Director","26. Inspector of the FIB","25. Supervisory Head Agent","24. Supervisory Agent","23. Special Agent in Charge","22. Division Chief","21. Deputy Division Chief","20. Senior Special Agent","19. Tactical Operator","18. Department Specialist","17. Commander","16. Lieutenant Commander","15. Special Senior Agent","14. Master Special Agent","13. Senior Special Agent","12. Operational Agent","11. Field Agent","10. Senior Agent","9. Agent II","8. Agent I","7. Junior Agent","6. Probationary Agent","5. Analyst","4. Associate Analyst","3. Recruit II","2. Recruit I","1. Trainee"];
const DEF=[
{id:"17450",name:"Eko Plaste",rank:"30. Director of FIB",dn:"1",div:"Leaderschaft",abt:"Chief Executive Curator",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"264694",name:"Tim Chessee",rank:"29. Deputy Director of FIB",dn:"2",div:"Leaderschaft",abt:"Deputy Executive Curator",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"240601",name:"Nils Brandenburger",rank:"28. Assistant Director of FIB",dn:"777",div:"Leaderschaft",abt:"Assistant Executive Curator",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"156935",name:"Assan Diop",rank:"28. Assistant Director of FIB",dn:"999",div:"Leaderschaft",abt:"Assistant Executive Curator",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"76002",name:"Dan Reacher",rank:"28. Assistant Director of FIB",dn:"5",div:"Leaderschaft",abt:"Assistant Executive Curator",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"85558",name:"Dimii Nevergone",rank:"28. Assistant Director of FIB",dn:"3",div:"Leaderschaft",abt:"Assistant Executive Curator",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"26412",name:"Luca Santos",rank:"28. Assistant Director of FIB",dn:"361",div:"Leaderschaft",abt:"Assistant Executive Curator",ausb:"",strike:"0/3",date:"29.05.2026",status:"Aktiv",notes:""},
{id:"6180",name:"Paul Nao",rank:"28. Assistant Director of FIB",dn:"17",div:"Leaderschaft",abt:"Assistant Executive Curator",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"102262",name:"Hakuri Schrom",rank:"28. Assistant Director of FIB",dn:"262",div:"Leaderschaft",abt:"Assistant Executive Curator",ausb:"",strike:"0/3",date:"02.06.2026",status:"Aktiv",notes:""},
{id:"135691",name:"Joachim vonWanze",rank:"27. Divisional Director",dn:"10",div:"Curator of Division",abt:"Curator | HR / FIBCO",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"157291",name:"Hugo Federov",rank:"27. Divisional Director",dn:"7",div:"Curator of Division",abt:"Curator | FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"128034",name:"Bali Nevergone",rank:"27. Divisional Director",dn:"27",div:"Curator of Division",abt:"Curator | CIRG",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"156327",name:"Falkdoc Federov",rank:"27. Divisional Director",dn:"8",div:"Curator of Division",abt:"Curator | PR / FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"295473",name:"Felix Mccalley",rank:"26. Inspector of the FIB",dn:"6",div:"High Command Lead",abt:"Head of High Command / FIBCO",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"217060",name:"Raffi Yane",rank:"25. Supervisory Head Agent",dn:"4",div:"High Command",abt:"HR Leitung / FIBCO",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"26899",name:"Amando Carillo",rank:"25. Supervisory Head Agent",dn:"31",div:"High Command",abt:"CID Stellv. Leitung",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"219213",name:"Jannick Yurr",rank:"25. Supervisory Head Agent",dn:"187",div:"High Command",abt:"CID Stellv. Leitung / FIBCO",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"34258",name:"Fynn Andreas",rank:"25. Supervisory Head Agent",dn:"11",div:"High Command",abt:"FIBCO Leitung",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"106544",name:"Marcel Gruuber",rank:"25. Supervisory Head Agent",dn:"15",div:"High Command",abt:"--",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"256009",name:"Kayne Smoker",rank:"24. Supervisory Agent",dn:"25",div:"High Command",abt:"TD Stellv. Leitung / CIRG",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"142220",name:"Simon Kellermann",rank:"24. Supervisory Agent",dn:"143",div:"High Command",abt:"FIBCO",ausb:"",strike:"0/3",date:"29.05.2026",status:"Aktiv",notes:""},
{id:"176902",name:"Filip vonWanze",rank:"23. Special Agent in Charge",dn:"32",div:"High Command",abt:"TD",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"218257",name:"Ranjid Bay",rank:"23. Special Agent in Charge",dn:"33",div:"High Command",abt:"CIRG / CID",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"135217",name:"Sebastian Kuroyama",rank:"23. Special Agent in Charge",dn:"52",div:"High Command",abt:"CID",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"264668",name:"Kai Herzog",rank:"23. Special Agent in Charge",dn:"21",div:"High Command",abt:"FIBCO / HR",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"258321",name:"Mickey Maybach",rank:"23. Special Agent in Charge",dn:"53",div:"High Command",abt:"FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"50091",name:"Syn Veno",rank:"23. Special Agent in Charge",dn:"59",div:"High Command",abt:"CID",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"244186",name:"Anton Moluda",rank:"23. Special Agent in Charge",dn:"9",div:"High Command",abt:"FIBCO Stellv. Leitung",ausb:"",strike:"0/3",date:"05.06.2026",status:"Aktiv",notes:""},
{id:"109467",name:"Felix Cunningham",rank:"23. Special Agent in Charge",dn:"12",div:"High Command",abt:"CID Leitung / HR",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"192812",name:"Nico Saito",rank:"23. Special Agent in Charge",dn:"23",div:"High Command",abt:"TD Stellv. Leitung",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"105534",name:"Akin Kaplan",rank:"23. Special Agent in Charge",dn:"71",div:"High Command",abt:"FIBCO / CID",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"257441",name:"Hugo Pinsel",rank:"23. Special Agent in Charge",dn:"16",div:"High Command",abt:"FIBCO Stellv. Leitung / HR",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"290275",name:"Tomek Dick",rank:"23. Special Agent in Charge",dn:"58",div:"High Command",abt:"PR",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"288863",name:"Bernhard Wolf",rank:"23. Special Agent in Charge",dn:"132",div:"High Command",abt:"FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"239288",name:"Noah Raiin",rank:"23. Special Agent in Charge",dn:"444",div:"High Command",abt:"FIBCO / HR",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"12263",name:"Fabi Astro",rank:"23. Special Agent in Charge",dn:"107",div:"High Command",abt:"HR Senior / FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"136176",name:"Quentin Wesh",rank:"23. Special Agent in Charge",dn:"111",div:"High Command",abt:"CIRG Stellv. Leitung / TD",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"79712",name:"Angus Newton",rank:"23. Special Agent in Charge",dn:"62",div:"High Command",abt:"FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"214462",name:"Marcel Fero",rank:"23. Special Agent in Charge",dn:"34",div:"High Command",abt:"--",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"18612",name:"Nico Schlumpf",rank:"22. Division Chief",dn:"28",div:"Division Lead",abt:"IA Leitung / FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"140883",name:"Johannes Brecher",rank:"22. Division Chief",dn:"14",div:"Division Lead",abt:"CIRG Leitung / CID",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"126465",name:"Nia vonWanze",rank:"22. Division Chief",dn:"22",div:"Division Lead",abt:"TD Leitung",ausb:"",strike:"0/3",date:"27.05.2026",status:"Aktiv",notes:""},
{id:"190803",name:"Berkoli Midnight",rank:"22. Division Chief",dn:"19",div:"Division Lead",abt:"PR Leitung",ausb:"",strike:"0/3",date:"27.05.2026",status:"Aktiv",notes:""},
{id:"200311",name:"Jonas Rak",rank:"21. Deputy Division Chief",dn:"13",div:"Division Lead",abt:"HR Stellv. Leitung",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"5545",name:"Fredo Frost",rank:"21. Deputy Division Chief",dn:"69",div:"Division Lead",abt:"CID Stellv. Leitung",ausb:"",strike:"0/3",date:"25.05.2026",status:"Aktiv",notes:""},
{id:"220186",name:"Bellobatz Dacruze",rank:"21. Deputy Division Chief",dn:"77",div:"Division Lead",abt:"CIRG Stellv. Leitung",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"155716",name:"Paul Trappler",rank:"19. Tactical Operator",dn:"122",div:"Abteilungsrang",abt:"CIRG",ausb:"",strike:"0/3",date:"06.06.2026",status:"Aktiv",notes:""},
{id:"218503",name:"Frosty Dick",rank:"19. Tactical Operator",dn:"85",div:"Abteilungsrang",abt:"CIRG",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"244882",name:"Tobi Lakiri",rank:"18. Department Specialist",dn:"48",div:"Abteilungsrang",abt:"PR",ausb:"",strike:"0/3",date:"01.06.2026",status:"Aktiv",notes:""},
{id:"9895",name:"Kalle Osbornee",rank:"18. Department Specialist",dn:"57",div:"Abteilungsrang",abt:"TD",ausb:"",strike:"0/3",date:"27.05.2026",status:"Aktiv",notes:""},
{id:"189768",name:"Kenan Kasalla",rank:"17. Commander",dn:"37",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"07.06.2026",status:"Aktiv",notes:""},
{id:"137965",name:"Nate Nays",rank:"17. Commander",dn:"121",div:"Command",abt:"HR / CID",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"14338",name:"Carlos Sandman",rank:"17. Commander",dn:"163",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"07.06.2026",status:"Aktiv",notes:""},
{id:"404",name:"Kev Error",rank:"17. Commander",dn:"404",div:"Command",abt:"CIRG",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"225755",name:"Thommy Perez",rank:"17. Commander",dn:"50",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"04.06.2026",status:"Aktiv",notes:""},
{id:"4149",name:"Atze Altin",rank:"17. Commander",dn:"49",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"192303",name:"Jonass Breitling",rank:"17. Commander",dn:"51",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"02.06.2026",status:"Aktiv",notes:""},
{id:"225011",name:"Odin Wolf",rank:"17. Commander",dn:"112",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"232642",name:"Peter Holz",rank:"17. Commander",dn:"61",div:"Command",abt:"FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"252692",name:"Jason Janee",rank:"17. Commander",dn:"155",div:"Command",abt:"CIRG",ausb:"",strike:"0/3",date:"27.05.2026",status:"Aktiv",notes:""},
{id:"52617",name:"Michi Mahoni",rank:"17. Commander",dn:"95",div:"Command",abt:"CIRG",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"203202",name:"Fernando Dick",rank:"17. Commander",dn:"66",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"286372",name:"Cengo Neverloved",rank:"17. Commander",dn:"70",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"115582",name:"Lia Kaplan",rank:"17. Commander",dn:"35",div:"Command",abt:"CID",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"251159",name:"Tim Balls",rank:"17. Commander",dn:"125",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"212921",name:"Alicee Asic",rank:"17. Commander",dn:"73",div:"Command",abt:"CIRG",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"62",name:"Kevin Done",rank:"17. Commander",dn:"63",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"27.05.2026",status:"Aktiv",notes:""},
{id:"292078",name:"Ibo Aquila",rank:"17. Commander",dn:"74",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"66603",name:"Harald Sachse",rank:"17. Commander",dn:"603",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"29.05.2026",status:"Aktiv",notes:""},
{id:"208195",name:"Vaun Deberg",rank:"17. Commander",dn:"82",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"30.05.2026",status:"Aktiv",notes:""},
{id:"301271",name:"Aure Knusper",rank:"17. Commander",dn:"80",div:"Command",abt:"CIRG",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"159846",name:"Titus Maximus",rank:"17. Commander",dn:"152",div:"Command",abt:"FIBCO",ausb:"",strike:"0/3",date:"27.05.2026",status:"Aktiv",notes:""},
{id:"174040",name:"Luca Hochreiter",rank:"17. Commander",dn:"175",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"30.05.2026",status:"Aktiv",notes:""},
{id:"257297",name:"Yuri Loveless",rank:"17. Commander",dn:"79",div:"Command",abt:"CID",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"26568",name:"Harleen Bama",rank:"17. Commander",dn:"65",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"229248",name:"Eren Almaz",rank:"17. Commander",dn:"20",div:"Command",abt:"FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"289353",name:"Raul Nuis",rank:"17. Commander",dn:"75",div:"Command",abt:"--",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
{id:"253176",name:"Gimo Jimmbo",rank:"17. Commander",dn:"707",div:"Command",abt:"FIBCO",ausb:"",strike:"0/3",date:"26.05.2026",status:"Aktiv",notes:""},
];


// Organisationen (Klassifizierung / CID) – zentral statt mehrfach im HTML/JS
const ORGAS=['FIB','LSPD','SAHP','LI','EMS','NG','GOV'];
const ORGA_COLORS={FIB:'#5b8def',LSPD:'#2f6fd6',SAHP:'#2f8f5b',LI:'#9333c4',EMS:'#dc3545',NG:'#0d9488',GOV:'#c2680a'};
const ORGA_EMOJI={FIB:'🟡',LSPD:'🔵',SAHP:'🟢',LI:'🟣',EMS:'🔴',NG:'🩵',GOV:'🟠'};

// Abteilungen mit Mitgliederliste (Kürzel = Suchbegriff in der Spalte "Abteilungen")
const DEPTS={fibco:'FIBCO',cid:'CID',td:'TD',cirg:'CIRG',law:'LAW'};

// Abteilungsübersicht auf dem Dashboard
const DASH_DEPTS=[
  ['CIRG','Critical Incident Response Group'],
  ['CID','Criminal Investigative Division'],
  ['FIBCO','Corruption Office'],
  ['HR','Human Resources'],
  ['PR','Public Relations'],
  ['TD','Training Division'],
  ['IA','Internal Affairs'],
  ['LAW','LAW Department']
];

const CASE_STATUS=['Offen','In Bearbeitung','Abgeschlossen','Archiviert'];
const LAW_STATUS=['Offen','In Bearbeitung','Vor Gericht','Abgeschlossen','Archiviert'];
const STATUS_COLORS={'Offen':'var(--wa)','In Bearbeitung':'var(--bl)','Vor Gericht':'var(--re)','Abgeschlossen':'var(--gr)','Archiviert':'var(--mu)'};

const ROLES=[
  ['hr','HR'],['fibco','FIBCO'],['cid','CID'],['td','TD'],['cirg','CIRG'],['law','LAW'],
  ['leader','Leaderschaft'],['admin','Admin']
];
