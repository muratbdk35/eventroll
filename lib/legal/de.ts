import type { LegalCtx, LegalDocs } from "./types";

/*
 * The binding German texts (DECISIONS #68). English and Turkish (en.ts,
 * tr.ts) are translations for information. Drafted to describe exactly what
 * the product does; to be checked by a lawyer or a legal-text service before
 * launch. Change them together with the code.
 */

const UPDATED = "19. Oktober 2026";

export function docsDe(c: LegalCtx): LegalDocs {
  const seller = `${c.company}, ${c.address}`;
  const reach = `${seller}, Telefon: ${c.phone}, E-Mail: ${c.supportEmail}`;
  return {
    privacy: {
      title: "Datenschutzerklärung",
      updated: UPDATED,
      intro: `Diese Erklärung beschreibt, welche personenbezogenen Daten ${c.appName} verarbeitet, wenn Sie als Gastgeber ein Event anlegen, als Gast Fotos hochladen oder unsere Website besuchen, zu welchem Zweck, auf welcher Rechtsgrundlage, wie lange, und welche Rechte Sie nach der Datenschutz-Grundverordnung (DSGVO) haben.`,
      sections: [
        {
          heading: "1. Verantwortlicher",
          body: [
            `Verantwortlich ist die ${seller} („wir“, „uns“), vertreten durch die Geschäftsführerin ${c.managingDirector}. E-Mail: ${c.supportEmail}, Kontaktformular: ${c.contactUrl}.`,
            "Wir sind gesetzlich nicht verpflichtet, einen Datenschutzbeauftragten zu benennen, und haben keinen benannt.",
            "Für die Fotos in einem Event entscheidet der Gastgeber, wen er einlädt und was mit dem Album geschieht. Gegenüber den Gästen ist der Gastgeber für das Album verantwortlich; wir verarbeiten die Fotos in seinem Auftrag, um den Dienst zu erbringen. Nutzt ein Unternehmen den Dienst (zum Beispiel für eine Firmenveranstaltung), schließen wir auf Anfrage einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO ab.",
          ],
        },
        {
          heading: "2. Daten von Gastgebern",
          body: [
            [
              "Kontodaten: Ihre E-Mail-Adresse und, wenn Sie sich mit Google anmelden, Ihr Name und Profilbild. Wir nutzen sie, um Ihr Konto anzulegen und Sie mit einem einmaligen Code per E-Mail oder über Google anzumelden. Rechtsgrundlage: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).",
              "Eventdaten: Name, Art, Datum und Uhrzeit des Events sowie Ihre Einstellungen (zum Beispiel PIN, Upload-Zeiten, Limit pro Handy, Farbe der Einladungskarte). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.",
              "Zahlungsdaten: Zahlungen wickelt Stripe ab. Wir erhalten Zahlungsstatus, Betrag, Plan, Rechnungsland und Rechnungsdaten, nie Ihre vollständige Kartennummer. Rechnungen bewahren wir für die handels- und steuerrechtlichen Fristen auf (in der Regel 8 bis 10 Jahre). Rechtsgrundlage: Art. 6 Abs. 1 lit. b und c DSGVO.",
              "Bestell- und Servicemails: Bestellbestätigung, Rechnung, Hinweise zu Ihrem Event (zum Beispiel „Album fertig“ und Erinnerungen vor der Löschung). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.",
              "Schutz vor Missbrauch bei der Anmeldung: Cloudflare Turnstile prüft Ihren Browser auf Anzeichen automatisierter Zugriffe. Rechtsgrundlage: berechtigtes Interesse an der Abwehr von Missbrauch (Art. 6 Abs. 1 lit. f DSGVO).",
            ],
          ],
        },
        {
          heading: "3. Daten von Gästen",
          body: [
            "Gäste brauchen kein Konto. Wenn Sie einen Event-Link öffnen und Fotos senden, verarbeiten wir:",
            [
              "die Fotos, die Sie auswählen, als Originaldatei sowie ein kleines Vorschaubild, das Ihr Browser erstellt. Originaldateien bleiben unverändert; eingebettete Metadaten (EXIF) wie Aufnahmezeit, Kameramodell und, falls Ihr Handy sie gespeichert hat, der Aufnahmeort bleiben in der Datei, die der Gastgeber herunterlädt. Die Ortsangabe können Sie vor dem Event in den Kamera-Einstellungen abschalten. RAW-Fotos werden bereits in Ihrem Browser in das darin enthaltene JPEG umgewandelt; nur dieses wird hochgeladen;",
              "Ihren Namen, nur wenn Sie einen eingeben;",
              "eine zufällige Geräte-ID in einem Cookie für dieses Event, damit das Limit pro Handy funktioniert und der Gastgeber ein Handy sperren kann, das unerwünschte Inhalte hochlädt;",
              "einen gesalzenen, nicht umkehrbaren Hashwert aus IP-Adresse und Browserkennung, um Missbrauch zu erkennen;",
              "die Prüfung durch Cloudflare Turnstile und, falls der Gastgeber eine PIN festgelegt hat, die eingegebene PIN (wir speichern Ihre Eingabe nicht; Fehlversuche sind begrenzt);",
              "den Zeitpunkt, zu dem Sie bestätigt haben, dass Sie die Bedingungen akzeptieren und die Fotos teilen dürfen.",
            ],
            "Rechtsgrundlage: Bereitstellung des Uploads an den Gastgeber, an den Sie Fotos senden (Art. 6 Abs. 1 lit. b DSGVO), und unser berechtigtes Interesse an einem sicheren Dienst (Art. 6 Abs. 1 lit. f DSGVO).",
            "Wer Ihre Fotos sieht: nur der Gastgeber des Events. Andere Gäste sehen Ihre Fotos nie; Alben sind nicht öffentlich und werden nicht von Suchmaschinen erfasst.",
            "Wir sehen uns keine Fotos an. Speicherung, Vorschaubilder und die automatische Prüfung unten laufen, ohne dass ein Mensch die Fotos betrachtet. Eine Person in unserem Unternehmen öffnet ein Foto nur, wenn das Gesetz es verlangt, zum Beispiel um einer Meldung rechtswidriger Inhalte oder einer behördlichen Anfrage nachzugehen, oder wenn der Gastgeber uns ausdrücklich um Unterstützung bei bestimmten Fotos bittet. Ein solcher Zugriff beschränkt sich auf die betroffenen Fotos.",
            "Automatische Prüfung auf explizite Inhalte: Ein kleines Vorschaubild jedes Fotos wird automatisch auf explizite sexuelle Inhalte geprüft. Ein markiertes Foto wird nicht gelöscht; es wird aus Album und Downloads des Gastgebers herausgehalten, und der Gastgeber kann es unscharf anzeigen und entscheiden, ob er es behält. Die Prüfung identifiziert keine Personen; ihr Ergebnis wird zusammen mit dem Foto gelöscht. Rechtsgrundlage: unser berechtigtes Interesse und das des Gastgebers, Events frei von expliziten Inhalten zu halten (Art. 6 Abs. 1 lit. f DSGVO).",
            "Meldungen: Meldet ein Gastgeber ein Foto als rechtswidrig, speichern wir Zeitpunkt und Grund, verbergen das Foto für alle und werden per E-Mail mit Event- und Fotonummer informiert, nie mit dem Bild. Das Foto wird mit den übrigen Fotos des Events am Ende des Download-Zeitraums gelöscht, sofern die Behörden nicht verlangen, es länger aufzubewahren. Bei Verdacht auf eine Straftat, insbesondere Darstellungen sexuellen Kindesmissbrauchs, geben wir die Meldung und die Daten zum Upload an die zuständigen Behörden weiter. Rechtsgrundlage: rechtliche Verpflichtungen und berechtigtes Interesse am Vorgehen gegen rechtswidrige Inhalte (Art. 6 Abs. 1 lit. c und f DSGVO).",
          ],
        },
        {
          heading: "4. Besuch unserer Website",
          body: [
            "Beim Aufruf einer Seite verarbeitet unser Hosting-Anbieter technische Daten, die Ihr Browser sendet (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser und Betriebssystem), um die Seite auszuliefern und abzusichern. Diese Protokolle werden nach höchstens 30 Tagen gelöscht. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.",
            "Kontaktformular: Ihren Namen, Ihre E-Mail-Adresse und Ihre Nachricht nutzen wir nur, um Ihnen zu antworten, und löschen sie, wenn die Sache erledigt ist, spätestens nach 12 Monaten. Die Bot-Prüfung erfolgt mit Cloudflare Turnstile. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und f DSGVO.",
            `Widerrufsfunktion (${c.withdrawUrl}): Ihren Namen, die Bestellnummer und Ihre E-Mail-Adresse nutzen wir, um den Widerruf zuzuordnen, Ihnen den Eingang zu bestätigen und ihn abzuwickeln. Rechtsgrundlage: rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO, § 356a BGB). Wir bewahren die Angaben als Nachweis auf, solange Ansprüche aus dem Vertrag geltend gemacht werden können, höchstens drei Jahre.`,
            "Produktanalyse und Fehlerüberwachung: Derzeit setzen wir keine Analyse- oder Fehlerüberwachungsdienste ein. Sollten wir künftig PostHog (EU Cloud, ohne Cookies) oder Sentry nutzen, ergänzen wir diese Erklärung vorher.",
            "Schriftarten werden von unserem eigenen Server geladen; es werden keine Daten an Google Fonts übertragen.",
          ],
        },
        {
          heading: "5. Speicherdauer",
          body: [
            [
              "Fotos und Vorschaubilder: endgültig gelöscht am Ende des Download-Zeitraums Ihres Plans, gerechnet ab dem Tag, an dem das Event endet (7, 14, 21 oder 30 Tage bei Mini, Standard, Pro oder VIP; 7 Tage, solange kein Plan gewählt ist). Gastgeber können einzelne Fotos, alle Fotos eines Handys oder das ganze Event jederzeit früher löschen.",
              "Eventeinstellungen und Daten zu Gästen (Namen, Geräte-IDs, Hashwerte, Zustimmungszeitpunkte): gelöscht zusammen mit den Fotos.",
              "Kontodaten: solange Ihr Konto besteht; gelöscht innerhalb von 30 Tagen, nachdem Sie die Löschung verlangt haben, außer Daten, die wir gesetzlich aufbewahren müssen (zum Beispiel Rechnungen).",
              "Anmeldecodes: gültig 10 Minuten, nur als Hashwert gespeichert.",
            ],
          ],
        },
        {
          heading: "6. Empfänger und Übermittlung in Drittländer",
          body: [
            "Wir setzen nur Dienstleister ein, die an einen Auftragsverarbeitungsvertrag gebunden sind und Daten nach unseren Weisungen verarbeiten:",
            [
              "Vercel Inc. – Hosting der Website (EU-Region Frankfurt);",
              "Neon Inc. – Datenbank (Frankfurt);",
              "Cloudflare Inc. – Speicherung der Fotos (R2, EU-Jurisdiktion), Bot-Schutz (Turnstile) und E-Mail-Weiterleitung;",
              "Stripe Payments Europe Ltd. (Irland) – Zahlungen und Rechnungen;",
              "Resend Inc. – Versand von Anmelde-, Bestell- und Servicemails;",
              "Upstash Inc. – Begrenzung von Zugriffen (EU-Region);",
              "Sightengine SAS (Paris) – automatische Prüfung von Vorschaubildern auf explizite Inhalte; die Bilder werden nach der Prüfung nicht gespeichert;",
              "Google Ireland Ltd. – nur, wenn Sie „Mit Google anmelden“ wählen.",
            ],
            "Einige dieser Unternehmen haben ihren Sitz in den USA. Soweit Daten dorthin übermittelt werden können, stützen wir uns auf das EU-US Data Privacy Framework oder auf die Standardvertragsklauseln der EU-Kommission.",
            "Wir verkaufen keine personenbezogenen Daten und verwenden Ihre Fotos weder für Werbung noch zum Training von KI-Modellen.",
          ],
        },
        {
          heading: "7. Ihre Rechte",
          body: [
            "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Eine Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen.",
            `Wenden Sie sich dafür an ${c.supportEmail}. Als Gast können Sie die Löschung eines Fotos auch direkt beim Gastgeber verlangen; nennen Sie uns bitte den Event-Link, damit wir es finden.`,
            "Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem EU-Staat, in dem Sie wohnen oder arbeiten. Für uns zuständig ist der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit.",
          ],
        },
        {
          heading: "8. Sicherheit",
          body: [
            "Alle Verbindungen sind verschlüsselt (HTTPS). Fotos liegen in einem privaten Speicher und werden nur über kurzlebige signierte Links ausgeliefert. Der Zugang zu den Produktivsystemen ist auf die Personen beschränkt, die ihn brauchen, durch Zwei-Faktor-Authentifizierung geschützt und wird nicht genutzt, um Fotos anzusehen, außer wie in Abschnitt 3 beschrieben.",
          ],
        },
        {
          heading: "9. Kinder",
          body: [
            "Gastgeberkonten sind Personen ab 18 Jahren vorbehalten. Gäste unter 16 Jahren sollten Fotos nur mit Erlaubnis eines Elternteils oder Erziehungsberechtigten hochladen.",
          ],
        },
        {
          heading: "10. Änderungen",
          body: [
            "Wir passen diese Erklärung an, wenn sich der Dienst oder das Recht ändert. Das Datum oben zeigt die aktuelle Fassung. Bei wesentlichen Änderungen informieren wir Gastgeber per E-Mail.",
          ],
        },
      ],
    },

    terms: {
      title: "Allgemeine Geschäftsbedingungen",
      updated: UPDATED,
      intro: `Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung von ${c.appName}, einem Angebot der ${seller} („wir“). Mit dem Anlegen eines Kontos, einer Bestellung oder dem Hochladen von Fotos stimmen Sie ihnen zu.`,
      sections: [
        {
          heading: "1. Leistung",
          body: [
            `${c.appName} ermöglicht es einem Gastgeber, ein Event anzulegen und über einen QR-Code oder Link Fotos von seinen Gästen zu sammeln. Gäste laden direkt aus dem Browser ihres Handys hoch, ohne App und ohne Konto. Nur der Gastgeber sieht die Fotos; Gäste sehen nur ihre eigenen Uploads.`,
            "Das Anlegen eines Events ist kostenlos. Gäste können hochladen, sobald der Gastgeber für dieses Event einen Plan gekauft und es veröffentlicht hat. Umfang und Grenzen der Pläne (Anzahl der Fotos, Speicher, Download-Zeitraum, Druckvorlagen) ergeben sich aus der Preisübersicht zum Zeitpunkt der Bestellung.",
          ],
        },
        {
          heading: "2. Konto",
          body: [
            "Für ein Gastgeberkonto müssen Sie mindestens 18 Jahre alt sein. Schützen Sie den Zugang zu Ihrem E-Mail-Postfach, denn dorthin senden wir die Anmeldecodes. Sie sind für die Aktivitäten in Ihrem Konto verantwortlich.",
          ],
        },
        {
          heading: "3. Vertragsschluss",
          body: [
            "Die Darstellung der Pläne auf der Website ist kein bindendes Angebot. Sie wählen einen Plan, bestätigen auf der Zahlungsseite Ihre Angaben und die Erklärung zum Widerrufsrecht und werden zu unserem Zahlungsdienstleister Stripe weitergeleitet. Mit dem Klick auf die Schaltfläche zum zahlungspflichtigen Bestellen bzw. Bezahlen auf der Stripe-Seite geben Sie ein verbindliches Angebot ab. Der Vertrag kommt zustande, sobald die Zahlung erfolgreich ist; wir bestätigen ihn per E-Mail.",
            "Bis zum Absenden können Sie Ihre Eingaben jederzeit über die Zurück-Schaltflächen und die Bearbeiten-Links korrigieren oder den Vorgang abbrechen.",
            "Vertragssprachen sind Deutsch, Englisch und Türkisch; maßgeblich ist die deutsche Fassung dieser AGB. Den Vertragstext (Bestelldaten und diese AGB) senden wir Ihnen mit der Bestellbestätigung per E-Mail; die jeweils aktuelle Fassung der AGB ist auf dieser Seite abrufbar.",
          ],
        },
        {
          heading: "4. Preise, Zahlung, Upgrade",
          body: [
            [
              "Ein Plan ist eine einmalige Zahlung pro Event in Euro. Es gibt kein Abonnement; nichts verlängert sich automatisch.",
              "Alle Preise sind Endpreise und enthalten die gesetzliche Umsatzsteuer.",
              "Die Zahlung erfolgt über Stripe mit den dort angebotenen Zahlungsarten. Für jede Bestellung erhalten Sie eine Rechnung per E-Mail.",
              "Sie können ein Event jederzeit auf einen größeren Plan umstellen und zahlen nur die Differenz zum bereits bezahlten Plan.",
            ],
          ],
        },
        {
          heading: "5. Widerrufsrecht und Erstattungen",
          body: [
            "Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Die Einzelheiten und das Muster-Widerrufsformular finden Sie in der Widerrufsbelehrung.",
            "Da ein Plan sofort nutzbar ist, bitten wir Sie vor der Zahlung ausdrücklich zu verlangen, dass wir vor Ablauf der Widerrufsfrist mit der Leistung beginnen, und zu bestätigen, dass Ihnen bekannt ist, dass Ihr Widerrufsrecht erlischt, sobald wir die Leistung vollständig erbracht haben.",
            "Widerruf nach Beginn der Leistung: Haben Sie verlangt, dass wir vor Ablauf der Widerrufsfrist beginnen, und widerrufen Sie danach, zahlen Sie für die bis dahin erbrachte Leistung einen angemessenen Betrag (§ 357a Abs. 2 BGB). Den Kern der Leistung bildet das Event selbst: dass Ihre Gäste während des Event-Zeitraums Fotos in Ihr Album hochladen können. Das anschließende Download-Fenster dient nur dazu, die Fotos abzuholen. Widerrufen Sie vor Beginn des Events, erstatten wir den vollen Betrag. Widerrufen Sie nach Beginn des Events, ist der wesentliche Teil der Leistung erbracht, und die Erstattung fällt entsprechend gering aus.",
            "Freiwillige Erstattung: Solange in Ihr Event noch kein Foto hochgeladen wurde und die erste Zahlung höchstens 14 Tage zurückliegt, können Sie den Plan in den Event-Einstellungen mit einem Klick stornieren und erhalten den vollen Betrag zurück; das Event wird wieder zum Entwurf. Ist bei uns etwas schiefgegangen, schreiben Sie uns; wir erstatten ganz oder teilweise. Ihre gesetzlichen Rechte bleiben unberührt.",
          ],
        },
        {
          heading: "6. Event-Zeitraum und Löschung",
          body: [
            "Ein Event dauert höchstens 24 Stunden. Alle Fotos werden bis zum Ende des Download-Zeitraums des gewählten Plans aufbewahrt (7, 14, 21 oder 30 Tage nach Eventende bei Mini, Standard, Pro oder VIP) und danach endgültig gelöscht. Es liegt beim Gastgeber, das Album in dieser Zeit herunterzuladen. Wir erinnern vor der Löschung per E-Mail, können gelöschte Fotos aber nicht wiederherstellen.",
          ],
        },
        {
          heading: "7. Pflichten des Gastgebers",
          body: [
            "Als Gastgeber entscheiden Sie, wer den QR-Code oder Link erhält. Sie verpflichten sich,",
            [
              "den Dienst nur für echte Events zu nutzen und den Link nicht so zu veröffentlichen, dass Fremde zum Hochladen eingeladen werden;",
              "Ihre Gäste in geeigneter Weise darauf hinzuweisen, dass Fotos für Sie gesammelt werden (zum Beispiel auf der gedruckten Karte);",
              "mit den erhaltenen Fotos datenschutzkonform und unter Wahrung der Rechte der abgebildeten Personen umzugehen, insbesondere bevor Sie sie anderswo veröffentlichen;",
              "die bereitgestellten Werkzeuge (Löschen, Handy sperren, PIN, Upload-Zeiten, Melden) zu nutzen, wenn unerwünschte Inhalte hochgeladen werden.",
            ],
          ],
        },
        {
          heading: "8. Regeln für Inhalte",
          body: [
            "Wer ein Foto hochlädt, muss die Rechte daran haben oder es teilen dürfen und, soweit gesetzlich erforderlich, die Einwilligung der abgebildeten Personen haben. Nicht erlaubt sind:",
            [
              "rechtswidrige Inhalte, insbesondere jede sexuelle Darstellung Minderjähriger;",
              "Inhalte, die Urheber-, Persönlichkeits- oder Datenschutzrechte anderer verletzen;",
              "gewaltverherrlichende, hetzerische, belästigende oder pornografische Inhalte;",
              "Schadsoftware oder Dateien, die keine Fotos sind.",
            ],
            `Mit dem Upload räumt der Gast dem Gastgeber das Recht ein, die Fotos für private Zwecke im Zusammenhang mit dem Event aufzubewahren, herunterzuladen und zu nutzen. Der Gast behält seine Rechte an den Fotos. Für die Entfernung eines Fotos wenden Sie sich an den Gastgeber oder an ${c.supportEmail}.`,
          ],
        },
        {
          heading: "9. Moderation und Meldungen",
          body: [
            "Jedes hochgeladene Foto wird automatisch auf explizite sexuelle Inhalte geprüft (Sightengine). Markierte Fotos werden nicht gelöscht, sondern aus Album und Downloads herausgehalten; der Gastgeber entscheidet, ob er sie anzeigt und behält. Die Prüfung kann sich irren; sie entscheidet nicht über Sperren oder Löschungen.",
            `Gastgeber können ein Foto im Album als rechtswidrig melden; es ist dann sofort für alle verborgen, und wir prüfen die Meldung. Jede andere Person kann rechtswidrige Inhalte über ${c.contactUrl} oder an ${c.supportEmail} melden (siehe „Inhalte melden“). Wir bearbeiten Meldungen zügig, informieren die meldende Person über unsere Entscheidung und begründen Einschränkungen gegenüber dem betroffenen Gastgeber, soweit das rechtlich zulässig ist.`,
            "Bei Verstößen gegen diese AGB oder das Gesetz können wir Inhalte entfernen und Events oder Konten sperren. Darstellungen sexuellen Kindesmissbrauchs melden wir den zuständigen Behörden.",
          ],
        },
        {
          heading: "10. Unsere Rechte an Inhalten",
          body: [
            "Wir nutzen Fotos nur, um den Dienst zu erbringen: um sie zu speichern, Vorschaubilder zu erstellen und sie dem Gastgeber bereitzustellen. Wir beanspruchen kein Eigentum, sehen sie uns nicht an, zeigen sie niemandem und nutzen sie weder für Werbung noch für KI-Training. Ein Foto öffnen wir nur, wenn das Gesetz es verlangt oder der Gastgeber uns um Unterstützung bittet (siehe Datenschutzerklärung).",
          ],
        },
        {
          heading: "11. Verfügbarkeit",
          body: [
            "Wir bemühen uns, den Dienst gerade während Events verfügbar zu halten, können aber keinen unterbrechungsfreien Betrieb garantieren, etwa bei Wartung, Netzproblemen am Veranstaltungsort oder Ausfällen unserer Dienstleister.",
          ],
        },
        {
          heading: "12. Haftung",
          body: [
            "Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz. Bei leichter Fahrlässigkeit haften wir nur für die Verletzung wesentlicher Vertragspflichten (Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags erst ermöglicht und auf deren Einhaltung Sie regelmäßig vertrauen dürfen), begrenzt auf den vertragstypischen, vorhersehbaren Schaden.",
            "Für Fotos, die verloren gehen, weil sie nicht innerhalb des Download-Zeitraums heruntergeladen wurden, haften wir nicht, soweit wir rechtzeitig daran erinnert haben.",
          ],
        },
        {
          heading: "13. Änderungen dieser AGB",
          body: [
            "Wir können diese AGB für künftige Bestellungen ändern. Bereits gekaufte Pläne sind davon nicht betroffen. Über wesentliche Änderungen informieren wir Gastgeber mit Konto per E-Mail.",
          ],
        },
        {
          heading: "14. Schlussbestimmungen",
          body: [
            "Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Für Verbraucher gilt dies nur, soweit nicht zwingende Verbraucherschutzvorschriften des Staates ihres gewöhnlichen Aufenthalts entgegenstehen.",
            "Sind Sie Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand Hamburg.",
            "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
            "Sollte eine Bestimmung unwirksam sein, bleiben die übrigen Bestimmungen wirksam.",
          ],
        },
      ],
    },

    withdrawal: {
      title: "Widerrufsbelehrung",
      updated: UPDATED,
      intro:
        "Verbraucher haben ein Widerrufsrecht nach folgender Maßgabe. Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können.",
      sections: [
        {
          heading: "Widerrufsrecht",
          body: [
            "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.",
            "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.",
            `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${reach}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.`,
            `Sie können Ihr Widerrufsrecht auch online unter ${c.withdrawUrl} ausüben. Wenn Sie diese Online-Funktion nutzen, übermitteln wir Ihnen auf einem dauerhaften Datenträger (z. B. durch eine E-Mail) unverzüglich eine Eingangsbestätigung mit Informationen zum Inhalt der Widerrufserklärung sowie dem Datum und der Uhrzeit ihres Eingangs.`,
            "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
          ],
        },
        {
          heading: "Folgen des Widerrufs",
          body: [
            "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.",
            "Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.",
          ],
        },
        {
          heading: "Erlöschen des Widerrufsrechts",
          body: [
            "Das Widerrufsrecht erlischt bei einem Vertrag zur Erbringung von Dienstleistungen, wenn wir die Dienstleistung vollständig erbracht haben und mit der Ausführung der Dienstleistung erst begonnen haben, nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben haben und gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei vollständiger Vertragserfüllung durch uns verlieren.",
          ],
        },
        {
          heading: "Muster-Widerrufsformular",
          body: [
            "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)",
            [
              `An ${seller}, E-Mail: ${c.supportEmail}:`,
              "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*)",
              "Bestellt am (*)",
              "Name des/der Verbraucher(s)",
              "Anschrift des/der Verbraucher(s)",
              "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)",
              "Datum",
            ],
            "(*) Unzutreffendes streichen.",
          ],
        },
      ],
    },

    cookies: {
      title: "Cookies",
      updated: UPDATED,
      sections: [
        {
          heading: "Notwendige Cookies",
          body: [
            "Wir setzen nur Cookies, die für den Dienst technisch erforderlich sind (§ 25 Abs. 2 TDDDG). Dafür ist keine Einwilligung nötig:",
            [
              "Anmeldung (Gastgeber): hält Sie angemeldet. Läuft ab, wenn Sie sich abmelden oder nach 7 Tagen ohne Nutzung.",
              "Sprache (NEXT_LOCALE): merkt sich die gewählte Sprache.",
              "Gastgerät (erg_…): eines pro Event; enthält eine zufällige Geräte-ID und den Nachweis, dass die Bot-Prüfung (und gegebenenfalls die PIN) bestanden wurde. Der Nachweis gilt 12 Stunden, die Geräte-ID ein Jahr oder bis das Event gelöscht wird.",
            ],
            "Auf der Zahlungsseite von Stripe setzt Stripe eigene, für die Zahlung und Betrugsabwehr notwendige Cookies; dafür gilt die Datenschutzerklärung von Stripe.",
          ],
        },
        {
          heading: "Keine Analyse- oder Werbe-Cookies",
          body: [
            "Wir setzen keine Analyse-, Tracking- oder Werbe-Cookies. Sollte sich das ändern, setzen wir solche Cookies nur nach Ihrer Einwilligung über ein Cookie-Banner, die Sie jederzeit ändern können.",
          ],
        },
      ],
    },

    imprint: {
      title: "Impressum",
      updated: UPDATED,
      sections: [
        {
          heading: "Angaben gemäß § 5 DDG",
          body: [
            c.company,
            c.address,
            `Vertreten durch die Geschäftsführerin: ${c.managingDirector}`,
            `Registereintrag: ${c.register}`,
            `Telefon: ${c.phone}`,
            `E-Mail: ${c.supportEmail}`,
            `Kontaktformular: ${c.contactUrl}`,
          ],
        },
        {
          heading: "Kontaktstelle nach dem Digital Services Act",
          body: [
            `Zentrale Kontaktstelle für Behörden (Art. 11 DSA) und für Nutzerinnen und Nutzer (Art. 12 DSA): ${c.supportEmail} und ${c.contactUrl}. Sie können uns auf Deutsch, Englisch oder Türkisch schreiben.`,
          ],
        },
        {
          heading: "Verbraucherstreitbeilegung",
          body: [
            "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
          ],
        },
      ],
    },

    "dmca-report": {
      title: "Inhalte melden",
      updated: UPDATED,
      sections: [
        {
          heading: "So melden Sie Inhalte",
          body: [
            `Wenn Sie auf ${c.appName} Inhalte finden, die rechtswidrig sind, Ihre Rechte verletzen oder Sie ohne Ihre Einwilligung zeigen, schreiben Sie an ${c.supportEmail} oder nutzen Sie das Kontaktformular (${c.contactUrl}) mit:`,
            [
              "dem Event-Link (oder dem Namen und Datum des Events);",
              "einer Beschreibung des Fotos, zum Beispiel wer es wann hochgeladen hat;",
              "einer Begründung, warum Sie den Inhalt für rechtswidrig halten oder Ihre Rechte verletzt sehen;",
              "Ihrem Namen und Ihrer E-Mail-Adresse, außer bei der Meldung von Darstellungen sexuellen Kindesmissbrauchs, die anonym möglich ist;",
              "der Erklärung, dass Ihre Angaben nach bestem Wissen richtig und vollständig sind.",
            ],
            "Als Gast können Sie die Entfernung eines Fotos von Ihnen auch direkt beim Gastgeber verlangen: Gastgeber können jedes Foto jederzeit löschen.",
          ],
        },
        {
          heading: "Was dann passiert",
          body: [
            "Wir bestätigen den Eingang, prüfen jede Meldung zügig und sorgfältig und teilen Ihnen unsere Entscheidung mit. Offensichtlich rechtswidrige Inhalte entfernen wir sofort; das Event kann gesperrt werden. Den betroffenen Gastgeber informieren wir über Einschränkungen und deren Gründe, soweit das rechtlich zulässig ist. Darstellungen sexuellen Kindesmissbrauchs melden wir den zuständigen Behörden.",
          ],
        },
      ],
    },
  };
}
