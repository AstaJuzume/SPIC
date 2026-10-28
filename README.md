# SPIC asmeninės pagalbos demonstracija v13

Veikiantis susitikimo prototipas pagal 2026-10-28 suderintą funkcionalumą. Sąsaja lietuvių kalba, naudojami tik pavyzdiniai asmenys ir įrašai.

Demonstracijos adresas: https://spic-pagalbos-demo.prodivi.chatgpt.site (privati demonstracija).

`examples/` kataloge pridėti mokėjimo pranešimo ir paslaugų akto pavyzdiniai PDF.

## Paleidimas

1. Išskleiskite ZIP.
2. Atidarykite `index.html` su Chrome arba Edge. Internetas ir papildomos bibliotekos nereikalingi.
3. Viršuje pasirinkite rolę: koordinatorius, asistentas arba administratorius.
4. Mygtukas `?` atidaro demonstracijos maršrutą.

Naršyklė saugo pakeitimus tame pačiame įrenginyje. Naujausi naršyklės duomenys turi pirmenybę prieš HTML pradinę kopiją. HTML failo pervadinimas ar atidarymas kitoje naršyklėje gali sukurti kitą vietinio saugojimo aplinką. Perdavimui naudokite **Nustatymai → Eksportuoti pilną JSON kopiją** ir **Atkurti iš JSON kopijos**.

## Įkėlimas į GitHub Pages

1. Į repozitorijos pagrindinį katalogą įkelkite išskleistus failus. `index.html`, `sw.js` ir `.nojekyll` turi būti pagrindiniame kataloge.
2. GitHub atidarykite **Settings → Pages → Deploy from a branch → main → / (root)**.
3. Atidarykite GitHub pateiktą svetainės nuorodą. Atskiro Node serverio nereikia.

Jokių slaptažodžių ar serverio prisijungimo duomenų projekte nėra. Prototipo rolės perjungiklis skirtas demonstravimui. Viešai talpinant naudokite tik demonstracinius duomenis.

## Pagrindinės eigos

### Asistentas

- Mato savo gavėjus, registruoja vizitą arba planuoja dieną ir atvykimo laiką. Planuojamos trukmės lauko nėra.
- Perkelia ir atšaukia savo planą su priežastimi. Ateities plano negalima pradėti kaip šiandienos vizito.
- Vienu metu turi vieną vykstantį vizitą; užbaigdamas pažymi aktyvias gavėjui priskirtas veiklas ir pastabą.
- Renka gavėjo parašą ekrane arba nurodo, kodėl parašas negautas.
- Prašo leidimo taisyti konkretų užbaigtą įrašą. Kol leidimas nepatvirtintas, duomenys nekoreguojami.
- Gavęs leidimą pataiso vieną įrašo versiją. Išsaugoma ankstesnė versija ir pakeitimo autorius, laikas bei priežastis. Gavėjo patvirtinimas gaunamas iš naujo.
- Formuoja savo faktiškai suteiktų paslaugų aktą pasirinktam laikotarpiui. Kitų asistentų vizitai į jo aktą neįtraukiami.

### Koordinatorius

- Administruoja gavėjus, sprendimus, sutartis, priskyrimus, valandų planų ir mokėjimo parametrų istoriją.
- Mato komandos vizitų planą, faktines paslaugas, trūkstamus patvirtinimus ir persidengiančius laikus.
- Patvirtina arba atmeta taisymų prašymus; gali grąžinti konkretų įrašą taisyti.
- Rengia mėnesio ir metų ataskaitas pagal gavėją, asistentą, laikotarpį, negalios pobūdį bei amžiaus grupę.
- Formuoja mokėjimo pranešimus ir paslaugų aktus, peržiūri bei patvirtina galutinę spausdinamą versiją.

### Administratorius

- Atlieka koordinatoriaus veiksmus, administruoja asistentų paskyrų pavyzdžius.
- Kuria, pervadina ir išjungia leistinas veiklas. Ankstesnių vizitų veiklų pavadinimai išsaugomi.
- Importuoja asistentų ar gavėjų CSV registrą tik po viso rinkinio patikros. Esant klaidai, niekas neįrašoma.
- Nustato priminimų laiką ir valandų įspėjimo slenkstį, įjungia pasirenkamus scenarijus, eksportuoja bei atkuria JSON kopiją.

## Dokumentai

**Mokėjimo pranešimas** remiasi pateikta SPIC forma. Įrašomas gavėjas, sutartis, mėnuo, valandos, įkainis, visa, kompensuojama ir mokėtina suma. Gavėjas ir paslaugos teikėjas pasirašo ranka atspausdintą dokumentą.

**Faktiškai suteiktų asmeninės pagalbos paslaugų aktas** automatiškai užpildo laikotarpio vizitų faktinę pradžią, pabaigą, valandas ir bendrą sumą. Akte yra dvi paslaugų gavėjo vertinimo parinktys, pastabų eilutės ir gavėjo, asistento bei teikėjo rankinių parašų ir datų vietos. Kokybės vertinimas matomas ir dokumento peržiūroje.

Pasirinkus **Spausdinti / PDF**, naršyklėje nurodykite A4, 100 % mastelį ir, jei reikia, išjunkite naršyklės antraštes bei poraštes. PDF sukuriamas pasirinkus **Save as PDF / Išsaugoti PDF formatu**. Nepatvirtintas arba pasenęs dokumentas turi žymą **PROJEKTAS**. Pakeitus šaltinio įrašus, kuriama nauja dokumento versija; ankstesnė duomenų kopija išlieka.

## Demonstracijos taisyklės ir ribos

- Laikas vieną kartą apvalinamas iki artimiausios minutės kiekvienam vizitui. Ataskaitos ir dokumentai sudedami iš tų pačių minučių; piniginės sumos skaičiuojamos centais. Vizitas, trumpesnis nei pusė minutės, gali būti rodomas kaip 0,00 val. ir pažymimas patikrai.
- Mėnesio limitas taikomas tik galiojant sprendimui, sutarčiai ir valandų planui. Dalinio mėnesio limitas automatiškai proporcingai nemažinamas; tokie mėnesiai pažymimi. Galutinę dalinio mėnesio taisyklę tvirtina SPIC.
- Viršijus valandas rodomas įspėjimas. Faktinis suteiktas laikas neištrinamas ir nepakeičiamas.
- Pakeitus gavėjo asistentą, ankstesni vizitai išlaiko savo autorių; buvęs asistentas gali formuoti savo istorinių paslaugų aktą. Ateities planai automatiškai kitam asistentui neperduodami.
- Mokėjimo parametrai skirti konkrečiam gavėjui ir galiojimo mėnesiui. Galima naudoti ranka nustatytą mėnesio sumą arba demonstracines 20 % / 30 % kompensacijos taisykles, neviršijant bendros paslaugų kainos. Tai nėra pilnas teisinio mokėjimo algoritmo įgyvendinimas. Produkcijai SPIC patvirtina taisykles ir kontrolinius atvejus. Dokumento teisinis tekstas perkeltas iš pateikto šablono.
- Pavyzdinis kontrolinis skaičiavimas: 152 val. × 12,13 Eur = 1.843,76 Eur; gavėjui mokėti 109,50 Eur; kompensuojama 1.734,26 Eur.
- Excel eksportas yra CSV su UTF-8 BOM ir kabliataškiais. Jei reikia, Excel faile pasirinkite **Data → From Text/CSV**. Eksportuojami langeliai apsaugoti nuo formulių vykdymo.
- Tikras centralizuotas prisijungimas, serverio prieigos kontrolė, serverio duomenų bazė, nekintamas auditas, automatinės atsarginės kopijos, pašto siuntimas ir kelių įrenginių sinchronizavimas neprijungti.
- Darbo be ryšio parinktis saugo vietinius pakeitimus ir rodo demonstracinę eilę. Atkūrus ryšį eilė apdorojama vietoje, į serverį niekas neperduodama. HTTPS aplinkoje programos failas talpinamas į podėlį, todėl jį galima atverti be ryšio po pirmo sėkmingo apsilankymo, jei naršyklė leido podėlį.
- Vietos fiksavimas yra aiškiai pažymėtas demonstracinis scenarijus, tikrų GPS koordinačių nerenka.

## Kūrėjui

`core.mjs` – taisyklės, duomenų struktūra, migracija, importas, dokumentų momentinės kopijos ir patikros. `app.mjs` – ekranai, formos, eksportas ir dokumentų HTML. `styles.css` – adaptyvus ir spausdinimo maketas. `sw.js` – programos failo podėlis. `build.mjs` – surenka savarankišką `index.html` ir `dist/index.html` be išorinių priklausomybių.

Reikalingas Node 20 arba naujesnis:

```sh
npm test
npm run build
```

Testuose tikrinamas duomenų išlikimas, valandų galiojimas, asistento teisės, taisymų leidimai ir versijos, dokumentų sumos bei pasenimas, importo atomiškumas, darbo be ryšio eilė ir dviejų naršyklės langų konflikto apsauga.

## Pasiūlymo apimtis

Atnaujintas komercinio pasiūlymo funkcionalumo aprašymas pasiekiamas: https://chatgpt.com/space/page_00e58df1dbe4819182a0a00eaa1ca470 . Dokumente paliktas ankstesnis finansinis įvertis, pažymėtas kaip tikslintinas pagal naujausią apimtį. Prototipo atnaujinimas nėra produkcinės sistemos įdiegimas.
