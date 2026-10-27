# SPIC asmeninės pagalbos prototipas

## Talpinimas

Išarchyvuokite paketą ir įkelkite index.html, .nojekyll ir README.md į GitHub saugyklos pagrindinį katalogą. Settings → Pages → Deploy from a branch → main → /(root).

## Demonstravimo eiga

1. Koordinatoriaus apžvalga ir gavėjo kortelė.
2. Vaizdas Asistentas → pasirinkti paskyrą → Mano gavėjai → Pradėti.
3. Pažymėti tik gavėjui leistinas veiklas → užbaigti → pasirašyti.
4. Koordinatorius → įrašas → grąžinti taisyti.
5. Asistentas → įrašas → pataisyti laiką, veiklas ir pastabas → pateikti naują versiją ir pasirašyti iš naujo.
6. Koordinatorius patvirtina patikrą.
7. Suvestinės: mėnesio / metų filtrai, gavėjų grupės, CSV ir PDF per spausdinimą.
8. Mokėjimo pranešimas: generuoti → peržiūrėti → patvirtinti → gavėjo ir teikėjo parašai.
9. Administratorius: paskyros, pradinis CSV importas, priminimų nustatymai, pasirenkami GPS ir offline scenarijai.

## Skaičiavimas

Mokėjimo demonstracinė taisyklė R1: gavėjo mokestis = min(bendra paslaugų kaina, įvesta kompensacija × procentas / 100). Formulė tik iliustracinė, nėra patvirtinta teisinė apskaitos taisyklė. Pavyzdys: 152 val. × 12,13 = 1843,76 Eur; 547,50 × 20% = 109,50 Eur; kompensuojama dalis 1734,26 Eur.

## Ribos

Vieno HTML failo demonstracija. Nėra tikro serverio, autentifikacijos, šifruoto duomenų saugojimo, serverio audito, automatinių laiškų, kopijų ar elektroninio parašo teisinės atitikties realizacijos. Rolės, GPS ir sinchronizavimas imituojami. Nenaudoti tikrų asmens duomenų.

Registrų importui demonstracijoje naudojamas CSV. Eksportas Excel – CSV. PDF – naršyklės spausdinimas. Failo naršyklėje saugomi duomenys gali būti išvalyti. HTML atsisiuntimas išsaugo dabartinę demonstracijos būseną.

Pagrindiniame variante nėra planavimo, transporto ar pagalbos į namus modulių. Mėnesio dokumentai saugo duomenų momentinę kopiją. Pasikeitus įtrauktų apsilankymų versijoms ar atrankai, rodomas perspėjimas generuoti naują dokumentą.
