# Anforderungskatalog: Buchungs- und Ausleihtool „Forschungsraum"

**Institut für Sonderpädagogik · gemeinsam genutzter Forschungsraum**

| | |
|---|---|
| Version | 1.0 (Entwurf) |
| Stand | 2026-10-07 |
| Auftraggeber | Institut für Sonderpädagogik (11 Abteilungen) |
| Zweck | Grundlage für die externe Entwicklung eines Buchungs- und Ausleihtools |
| Referenz-Prototyp | <https://github.com/christiandrengk/Buchungstool> (lauffähige Referenz-Implementierung, dient als Anschauung – keine Vorgabe für den finalen Technik-Stack) |

> **Hinweis zur Priorisierung.** Jede Anforderung ist gekennzeichnet mit
> **MUSS** (zwingend für die erste produktive Version), **SOLL** (wichtig, sobald
> möglich) oder **KANN** (wünschenswert / Ausbaustufe). Die Referenz-Implementierung
> deckt bereits einen Großteil der MUSS/SOLL-Funktionen fachlich ab, erfüllt aber
> **nicht** die nicht-funktionalen Anforderungen an Authentifizierung, Datenschutz
> und Barrierefreiheit – genau diese sind für den produktiven Einsatz zentral.

---

## 1. Ziel und Kontext

Für einen neu eingerichteten, von 11 Abteilungen gemeinsam genutzten Forschungsraum
soll ein Web-Tool die **Buchung von Arbeitsplätzen** und die **Ausleihe von Geräten**
abbilden. Ziel ist ein transparenter, fairer und konfliktfreier Zugang zu den
begrenzten Ressourcen für Mitarbeitende und Studierende.

Das Tool soll zunächst **eigenständig** betreibbar sein und später in die
**Institutswebseite integriert** werden (z. B. als eingebettete Seite/Link oder mit
gemeinsamem Login).

### 1.1 Rahmenbedingungen

- Öffentliche Einrichtung (Hochschule) → besondere Anforderungen an **Datenschutz
  (DSGVO)** und **Barrierefreiheit (BITV 2.0 / WCAG 2.1 AA)**.
- Mehrere Personen/Abteilungen buchen **parallel** → serverseitige Datenhaltung und
  Konfliktprüfung sind zwingend (kein reiner Browser-/Dateispeicher).
- Geräte werden in einem **Sicherheitsschrank** verwahrt; ein Teil ist Eigentum
  einzelner Abteilungen, bleibt aber im gemeinsamen Pool sichtbar.

---

## 2. Nutzergruppen und Rollen

| Rolle | Beschreibung | Zugang |
|---|---|---|
| **Mitarbeitende** | wissenschaftliches/administratives Personal aller 11 Abteilungen | voller Zugang zu Raum und allen Geräten, keine Ausleihbeschränkungen |
| **Studierende** | Studierende des Instituts | eingeschränkter Zugang (s. Kap. 5), nur während der Sprechzeiten der Hilfskraft |
| **Administration** | verwaltende Personen (z. B. Hilfskraft, Raumverantwortliche) | Pflege von Bestand, Kategorien, Sockel/Puffer, ggf. Buchungen |

**ROLE-01 (MUSS):** Das Datenmodell unterscheidet mindestens die Rollen
*Mitarbeitende*, *Studierende* und *Administration*; Rechte sind rollenbasiert.
**ROLE-02 (MUSS):** Die Rollenzuordnung erfolgt **verlässlich über Authentifizierung**
(siehe NF-Sicherheit), nicht über Selbstauskunft.

---

## 3. Funktionale Anforderungen – Buchung allgemein

**F-01 (MUSS):** Buchungen erfolgen **stunden-/zeitgenau** mit konkreter Start- und
Endzeit (kein grobes Tagesraster).
**F-02 (MUSS):** Auch **mehrtägige** Zeiträume sind buchbar.
**F-03 (MUSS):** In **einem** Buchungsvorgang können **mehrere** Plätze und/oder
mehrere Geräte(-Kategorien mit Anzahl) gebucht werden.
**F-04 (MUSS):** **Konfliktprüfung**: Überschneidende Buchungen desselben Platzes bzw.
desselben Geräte-Exemplars werden zuverlässig verhindert (auch über Tagesgrenzen);
Prüfung serverseitig und transaktionssicher (alles-oder-nichts bei Mehrfachbuchung).
**F-05 (MUSS):** Pflichtangaben je Buchung: **Name** und **Abteilung** (Auswahl aus
den 11 Abteilungen). **E-Mail** optional (für Benachrichtigungen, siehe F-30 ff.).
**F-06 (SOLL):** Buchungen können **storniert/geändert** werden (durch die buchende
Person bzw. Administration).
**F-07 (SOLL):** Optionales Freitextfeld **Zweck** je Buchung.
**F-08 (KANN):** Wiederkehrende Buchungen (Serientermine).

---

## 4. Funktionale Anforderungen – Platzbuchung

**F-10 (MUSS):** Buchbar sind **4 Testplätze** und **2 Arbeitsplätze** (einzeln
auswählbar). Der fest installierte **Fernseher** ist **nicht buchbar**.
**F-11 (MUSS):** Freie/belegte Plätze werden für den gewählten Zeitraum angezeigt;
nur freie Plätze sind auswählbar.
**F-12 (SOLL):** Die Ausstattung je Platz ist einsehbar (siehe Anhang A).

---

## 5. Funktionale Anforderungen – Geräteausleihe

**F-20 (MUSS):** Alle Gerätekategorien (Anhang B) sind ausleihbar; je Kategorie wird
angezeigt, **wie viele Exemplare insgesamt vorhanden** und **aktuell verfügbar** sind
(gesamt / buchbar / frei im gewählten Zeitraum).
**F-21 (MUSS):** Buchung per **Kategorie + Anzahl**; das System teilt automatisch
konkrete freie Exemplare zu (Einzel-Exemplar-Verwaltung, damit Konflikte exemplargenau
geprüft werden).
**F-22 (MUSS):** **Geräte-Eigentümerschaft** je Kategorie/Exemplar ist hinterlegt und
sichtbar (z. B. „Eigentum: Mathe/PKGB"), auch wenn das Gerät im gemeinsamen Pool bleibt.
**F-23 (MUSS):** **Nutzungsart** je Geräte-Buchung: **Ausleihe (Mitnahme)** oder
**Nutzung im Raum**.
**F-24 (MUSS):** **Sockel-/Puffer-Kennzeichnung** – Exemplare können als *Sockel*
(verlässt den Raum nie) oder *Puffer* (nicht vorab buchbar, Sicherheitsnetz für
spontane Nutzung) markiert werden; diese sind nicht buchbar und werden in der
Verfügbarkeit entsprechend ausgegraut/gekennzeichnet.
**F-25 (SOLL):** Rückgabe-Status / „zurückgegeben"-Kennzeichnung je Ausleihe.
**F-26 (KANN):** Zustands-/Schadensvermerk bei Ausgabe/Rückgabe.

### 5.1 Regeln für Studierende (rollenabhängig)

**F-27 (MUSS):** Studierende dürfen **Meeting Owl** und **3D-Brille nicht ausleihen**
(keine Mitnahme), sondern diese **nur im Raum** nutzen.
**F-28 (MUSS):** Studierende dürfen **maximal 7 Kalendertage** ausleihen/buchen.
**F-29 (SOLL):** Buchungen durch Studierende sind nur **innerhalb der Sprechzeiten
der Hilfskraft** möglich (konfigurierbare Zeitfenster).
**F-29b (MUSS):** Mitarbeitende unterliegen **keiner** dieser Beschränkungen.
**F-29c (SOLL):** Die genannten Beschränkungen sind pro Gerätekategorie
**konfigurierbar** (z. B. Flags „nur im Raum für Studierende", „nicht für Studierende"),
damit künftige sensible/hochpreisige Geräte analog geregelt werden können.

---

## 6. Funktionale Anforderungen – Benachrichtigungen

**F-30 (SOLL):** **Buchungsbestätigung per E-Mail** (sofern E-Mail angegeben) mit allen
Eckdaten inkl. **Rückgabedatum**.
**F-31 (SOLL):** **Erinnerungs-E-Mail** einen Tag **vor dem Rückgabetermin** – zumindest
bei längeren Ausleihen (z. B. ab 2 Tagen; Schwelle konfigurierbar).
**F-32 (SOLL):** Benachrichtigungen gelten für **Studierende und Mitarbeitende**
gleichermaßen.
**F-33 (KANN):** Benachrichtigung bei Stornierung/Änderung; Hinweis an Administration
bei überfälliger Rückgabe.

---

## 7. Funktionale Anforderungen – Übersicht & Transparenz

**F-40 (MUSS):** **Volle Transparenz**: Alle Nutzer:innen sehen **alle** bestehenden
Buchungen (wer, was, wann, welche Abteilung, Ausleihe/im Raum) – keine rein private
Sicht. (Datenschutzkonforme Ausgestaltung beachten, siehe NF-DSGVO.)
**F-41 (MUSS):** Bestandsübersicht je Kategorie (gesamt / buchbar / frei).
**F-42 (SOLL):** Kalender-/Zeitstrahlansicht der Belegung.
**F-43 (SOLL):** Filter/Suche (nach Abteilung, Zeitraum, Kategorie, Platz/Gerät).
**F-44 (KANN):** Export der Buchungen (z. B. CSV) für Dokumentation/Reporting.

---

## 8. Funktionale Anforderungen – Verwaltung / Administration

**F-50 (MUSS):** Pflege des **Bestands**: Geräte-Exemplare **anlegen/entfernen**
(mit Bezeichnung/Modell und optionaler Eigentümer-Abteilung).
**F-51 (MUSS):** Pflege von **Kategorien**: anlegen/bearbeiten/löschen (Name, Art
Platz/Gerät, Beschreibung, Eigentümer, Studierenden-Regeln). Löschschutz, solange noch
Exemplare/Buchungen zugeordnet sind.
**F-52 (MUSS):** **Sockel-/Puffer-Status** je Exemplar umschaltbar.
**F-53 (SOLL):** Pflege der **Abteilungen** (anlegen/umbenennen/löschen).
**F-54 (SOLL):** Administration kann Buchungen einsehen, ändern und stornieren.
**F-55 (SOLL):** Konfiguration von **Öffnungszeiten/Zeitraster** und **Sprechzeiten**.
**F-56 (KANN):** Sammelanlage mehrerer Exemplare (automatische Nummerierung).

---

## 9. Nicht-funktionale Anforderungen

### 9.1 Authentifizierung & Autorisierung

**NF-SEC-01 (MUSS):** **Login/Authentifizierung** für alle buchenden Personen –
vorzugsweise über die **bestehende Hochschul-Identität** (SSO, z. B.
Shibboleth/DFN-AAI, OIDC/SAML oder LDAP). Kein eigenes Passwort-Silo, wenn vermeidbar.
**NF-SEC-02 (MUSS):** Rollen (Mitarbeitende/Studierende/Administration) werden aus der
Authentifizierung bzw. einer gepflegten Zuordnung abgeleitet – **nicht** per
Selbstauskunft (behebt die zentrale Schwäche des Prototyps).
**NF-SEC-03 (MUSS):** Schutz der Administrationsfunktionen (nur Rolle Administration).
**NF-SEC-04 (SOLL):** Nachvollziehbarkeit, welche Person welche Buchung angelegt/geändert
hat.
**NF-SEC-05 (MUSS):** Gängige Web-Sicherheit (Schutz vor XSS/CSRF/SQL-Injection,
serverseitige Validierung, aktuelle Abhängigkeiten, TLS/HTTPS).

### 9.2 Datenschutz (DSGVO)

**NF-DSG-01 (MUSS):** Verarbeitung personenbezogener Daten (Name, Abteilung, E-Mail,
Buchungszeiten) nach **Datensparsamkeit**; nur was für den Zweck nötig ist.
**NF-DSG-02 (MUSS):** **Rechtsgrundlage** klären und dokumentieren; **Datenschutzerklärung**
im Tool; ggf. **Einwilligung** für E-Mail-Benachrichtigungen.
**NF-DSG-03 (MUSS):** **Löschkonzept/Aufbewahrungsfristen** (automatisches Löschen/
Anonymisieren alter Buchungen nach definierter Frist).
**NF-DSG-04 (MUSS):** Die „volle Transparenz" (F-40) ist datenschutzkonform zu gestalten
(z. B. keine Anzeige von E-Mail-Adressen für alle; Umfang der sichtbaren Personendaten
mit dem/der Datenschutzbeauftragten abstimmen).
**NF-DSG-05 (MUSS):** Bei externem Hosting: **Auftragsverarbeitungsvertrag (AVV)**,
Serverstandort EU; Einbindung in das **Verzeichnis von Verarbeitungstätigkeiten**.
**NF-DSG-06 (SOLL):** Betroffenenrechte (Auskunft/Löschung) umsetzbar.

### 9.3 Barrierefreiheit

**NF-A11Y-01 (MUSS):** Als Angebot einer öffentlichen Stelle: Konformität mit
**BITV 2.0 / WCAG 2.1 Level AA** (Tastaturbedienbarkeit, Kontraste, Screenreader-
Tauglichkeit, Beschriftungen). Insbesondere die Zeitraum-/Kalenderauswahl barrierefrei.
**NF-A11Y-02 (SOLL):** Erklärung zur Barrierefreiheit bereitstellen.

### 9.4 Usability & Design

**NF-UX-01 (MUSS):** Einfaches, klar verständliches, **responsives** UI (Desktop,
Tablet, Smartphone); Zielgruppe ist kein technisches Fachpublikum.
**NF-UX-02 (SOLL):** Deutschsprachige Oberfläche; klare Fehlermeldungen/Hilfetexte.
**NF-UX-03 (KANN):** Mehrsprachigkeit (z. B. Deutsch/Englisch).

### 9.5 Integration

**NF-INT-01 (SOLL):** **Einbettung in die Institutswebseite** (z. B. iframe/Link oder
tiefere Integration) ohne Funktionsverlust; konsistentes Erscheinungsbild.
**NF-INT-02 (SOLL):** Nutzung des Hochschul-SSO auch im eingebetteten Betrieb.
**NF-INT-03 (KANN):** Kalender-Export/-Abo (iCal) je Buchung.

### 9.6 Technik, Betrieb & Daten

**NF-TEC-01 (MUSS):** **Serverseitige Datenbank** (mehrbenutzerfähig, transaktional).
**NF-TEC-02 (SOLL):** **Hosting bevorzugt auf Hochschul-/Instituts-Infrastruktur**
(On-Premise) statt externer Cloud – zur Erfüllung der Datenschutzanforderungen; falls
Cloud, dann EU/DSGVO-konform mit AVV.
**NF-TEC-03 (SOLL):** Betriebsdokumentation, **Backups** und Wiederherstellung.
**NF-TEC-04 (SOLL):** Wartbarer, dokumentierter Code; einfache Pflege des Bestands ohne
Entwicklerkenntnisse (Admin-Oberfläche, siehe Kap. 8).
**NF-TEC-05 (KANN):** Mandanten-/Mehrraumfähigkeit (weitere Räume später ergänzbar).
**NF-TEC-06 (SOLL):** Protokollierung/Logging für Fehleranalyse (datenschutzkonform).

---

## 10. Datenmodell (fachlicher Überblick)

Empfohlene Kern-Entitäten (unabhängig von der konkreten Technik):

- **Abteilung** – Name, Kürzel.
- **Ressourcen-Kategorie** – Name, Art (*Platz* / *Gerät*), Beschreibung, Eigentümer-
  Abteilung (optional), Regeln für Studierende (nicht buchbar / nur im Raum).
- **Ressourcen-Exemplar** – konkretes Stück (z. B. „iPad #03"), Zugehörigkeit zur
  Kategorie, Eigentümer-Abteilung (optional), Status *buchbar / Sockel / Puffer*,
  Notiz.
- **Person/Konto** – Name, E-Mail, Abteilung, Rolle (aus Authentifizierung).
- **Buchung** – Verweis auf Exemplar, Person, Abteilung, Rolle, Nutzungsart
  (*Ausleihe / im Raum*), Zweck, Start-/Endzeit, Zeitstempel, Status
  (aktiv/storniert/zurückgegeben).

---

## 11. Abgrenzung (nicht im Umfang der ersten Version)

- Online-Bezahlung / Gebühren.
- Komplexe Priorisierungs-/Warteschlangenlogik bei Engpässen *(für spätere Ausbaustufe
  vorsehen – Datenmodell sollte es nicht verhindern)*.
- Inventarisierung/Wartungsmanagement über die Ausleihe hinaus.
- Native Mobile-App (responsives Web genügt).

---

## 12. Offene Punkte / mit Auftraggeber zu klären

1. Welches **SSO/Identitätssystem** stellt die Hochschule bereit (Shibboleth, OIDC,
   LDAP)? Wie werden Studierende vs. Mitarbeitende unterschieden?
2. **Aufbewahrungsfrist** für Buchungsdaten; Umfang der für alle sichtbaren Angaben
   (Datenschutz).
3. Verbindliche **Öffnungszeiten** des Raums und **Sprechzeiten** der Hilfskraft.
4. **Hosting**: On-Premise (Rechenzentrum der Hochschule) oder genehmigte Cloud?
5. Finaler **Sockel-/Puffer-Umfang** je Kategorie (siehe Anhang B als Ausgangswert).
6. Genaue, verbindliche Liste der **11 Abteilungen** und der **Geräte-Eigentümer**.

---

## Anhang A – Raum- und Platzausstattung

| Platz/Objekt | Anzahl | Ausstattung | Buchbar |
|---|---|---|---|
| Testplatz (für Testpersonen) | 4 | Tisch, Trennwand, Laptop, Dockingstation, Bildschirm, Tastatur, Maus, Noise-Cancelling-Kopfhörer | ja |
| Arbeitsplatz (Testleitung/Mitarbeitende) | 2 | Laptop, Dockingstation, Bildschirm, Tastatur, Maus | ja |
| Fernseher inkl. Wandhalterung | 1 | Präsentation, fest installiert | **nein** |

Geräte werden in einem **Sicherheitsschrank** verwahrt.

## Anhang B – Ausleihbare Geräte (Pool, Ausgangsbestand)

| Kategorie | Menge (ca.) | Modelle / Hinweise | Eigentümer | Besonderheit |
|---|---|---|---|---|
| Meeting Owl | 1 | Konferenzkamera, hochpreisig (1.149 €) | gemeinsam | Studierende nur im Raum |
| 3D-Brille | 1 | sensibles Einzelstück | PKGB | Studierende nur im Raum |
| Video-Kameras | ~12 | Panasonic HC-VX11 / HC-V777 (Mathe), Sony HDR-CX405 (PKGB) | Mathe / PKGB | 2–3 als Sockel, 1 Puffer |
| Stative | ~10 | 8 groß, 2 klein | Mathe | 2–3 als Sockel, 1 Puffer |
| iPads | 20 | 6. Generation | Mathe | 1 Puffer |
| Diktiergeräte | ≥ 2 | z. B. Sony ICD-UX570 | gemeinsam | |
| Mikrofone | mehrere | z. B. Røde NT-USB+ | PKGB / Lernen | 1–2 als Sockel, 1 Puffer |

**Fester „Sockel" (verlässt den Raum nie):** 2–3 Kameras, 2–3 Stative, 1–2 Mikrofone
sind für Aufnahmen/Tests im Raum reserviert. Zusätzlich je Kategorie ein kleiner
**Puffer** (z. B. 1 Exemplar) als „nicht vorab buchbar".

## Anhang C – Abteilungen (11)

Allgemeine Behindertenpädagogik und -soziologie · Sachunterricht und Inklusive Didaktik ·
Inklusive Deutschdidaktik · Sonderpädagogische Psychologie · Sprach-Pädagogik und
-Therapie · Inklusive Mathematikdidaktik · Inklusive Schulentwicklung · Pädagogik der
Teilhabe an beruflichen Übergängen · Pädagogik bei Beeinträchtigungen des Lernens ·
Pädagogik bei Beeinträchtigungen der emotionalen und sozialen Entwicklung · Pädagogik im
Kontext geistiger Behinderung

*(Geräte-Eigentümer im Ausgangsbestand: „Mathe" = Inklusive Mathematikdidaktik;
„PKGB" = Pädagogik im Kontext geistiger Behinderung.)*

## Anhang D – Referenz-Prototyp

Unter <https://github.com/christiandrengk/Buchungstool> liegt eine **lauffähige
Referenz-Implementierung** (Next.js + Prisma + SQLite), die die fachlichen MUSS/SOLL-
Funktionen (Platzbuchung, Geräteausleihe, Mehrfach-/Mehrtagesbuchung, Konfliktprüfung,
Sockel/Puffer, Nutzungsart, Studierenden-Regeln, Verwaltung) demonstriert. Sie dient
ausschließlich der **Veranschaulichung** und ist **keine** Vorgabe für Technik-Stack
oder Architektur. Die nicht-funktionalen Anforderungen (Authentifizierung, Datenschutz,
Barrierefreiheit, produktives Hosting) sind im Prototyp **nicht** umgesetzt und sind
Kern der externen Beauftragung.
