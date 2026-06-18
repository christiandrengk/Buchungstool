import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// SQLite kennt keine Enums – wir nutzen Stringkonstanten.
type ResourceKind = "PLACE" | "DEVICE";
type UnavailableReason = "SOCKEL" | "PUFFER";
const SOCKEL: UnavailableReason = "SOCKEL";
const PUFFER: UnavailableReason = "PUFFER";

/**
 * Seed-Daten für den Forschungsraum.
 *
 * Abteilungen: die 11 echten Abteilungen des Instituts. Die Kürzel (shortName)
 * sind frei wählbar und werden in Badges/Listen kompakt angezeigt – bei Bedarf
 * anpassen und neu seeden.
 */
const DEPARTMENTS: { name: string; shortName: string }[] = [
  { name: "Allgemeine Behindertenpädagogik und -soziologie", shortName: "ABS" },
  { name: "Sachunterricht und Inklusive Didaktik", shortName: "Sachunterricht" },
  { name: "Inklusive Deutschdidaktik", shortName: "Deutsch" },
  { name: "Sonderpädagogische Psychologie", shortName: "Psychologie" },
  { name: "Sprach-Pädagogik und -Therapie", shortName: "Sprache" },
  { name: "Inklusive Mathematikdidaktik", shortName: "Mathe" },
  { name: "Inklusive Schulentwicklung", shortName: "Schulentwicklung" },
  { name: "Pädagogik der Teilhabe an beruflichen Übergängen", shortName: "Berufl. Übergänge" },
  { name: "Pädagogik bei Beeinträchtigungen des Lernens", shortName: "Lernen" },
  { name: "Pädagogik bei Beeinträchtigungen der emotionalen und sozialen Entwicklung", shortName: "ESE" },
  { name: "Pädagogik im Kontext geistiger Behinderung", shortName: "Geistige Entwicklung" },
];

async function main() {
  console.log("→ Lösche bestehende Daten …");
  // Reihenfolge wegen Fremdschlüsseln
  await prisma.booking.deleteMany();
  await prisma.resourceItem.deleteMany();
  await prisma.resourceCategory.deleteMany();
  await prisma.department.deleteMany();

  console.log("→ Lege Abteilungen an …");
  const departments: Record<string, number> = {};
  for (const d of DEPARTMENTS) {
    const dep = await prisma.department.create({ data: d });
    departments[d.shortName] = dep.id;
  }

  // "Mathe" = Inklusive Mathematikdidaktik (Eigentümerin von Kameras, Stativen, iPads).
  const mathe = departments["Mathe"];
  // Im ursprünglichen Auftrag "PKGB" genannt = "Pädagogik im Kontext geistiger
  // Behinderung": Eigentümerin von 3D-Brille, Sony-Kameras und Mikrofonen.
  const pkgb: number | null = departments["Geistige Entwicklung"];

  // Hilfsfunktion: Kategorie + Exemplare anlegen.
  async function createCategory(opts: {
    name: string;
    kind: ResourceKind;
    description?: string;
    sortOrder: number;
    studentsAllowed?: boolean;
    studentsInRoomOnly?: boolean;
    ownerDepartmentId?: number | null;
    items: {
      label: string;
      note?: string;
      unavailableReason?: UnavailableReason;
      ownerDepartmentId?: number | null;
    }[];
  }) {
    const category = await prisma.resourceCategory.create({
      data: {
        name: opts.name,
        kind: opts.kind,
        description: opts.description,
        sortOrder: opts.sortOrder,
        studentsAllowed: opts.studentsAllowed ?? true,
        studentsInRoomOnly: opts.studentsInRoomOnly ?? false,
        ownerDepartmentId: opts.ownerDepartmentId ?? null,
      },
    });
    for (const item of opts.items) {
      await prisma.resourceItem.create({
        data: {
          label: item.label,
          note: item.note,
          unavailableReason: item.unavailableReason,
          ownerDepartmentId:
            item.ownerDepartmentId !== undefined
              ? item.ownerDepartmentId
              : opts.ownerDepartmentId ?? null,
          categoryId: category.id,
        },
      });
    }
  }

  console.log("→ Lege Plätze an …");
  await createCategory({
    name: "Testplatz",
    kind: "PLACE",
    description:
      "Platz für Testpersonen: Tisch, Trennwand, Laptop, Dockingstation, Bildschirm, Tastatur, Maus, Noise-Cancelling-Kopfhörer.",
    sortOrder: 1,
    items: [1, 2, 3, 4].map((n) => ({ label: `Testplatz ${n}` })),
  });

  await createCategory({
    name: "Arbeitsplatz",
    kind: "PLACE",
    description:
      "Arbeitsplatz für Testleitung/Mitarbeitende: Laptop, Dockingstation, Bildschirm, Tastatur, Maus.",
    sortOrder: 2,
    items: [1, 2].map((n) => ({ label: `Arbeitsplatz ${n}` })),
  });

  console.log("→ Lege ausleihbare Geräte an …");

  // Meeting Owl – hochpreisig; Studierende nur zur Nutzung im Raum.
  await createCategory({
    name: "Meeting Owl",
    kind: "DEVICE",
    description: "Konferenzkamera für digitale Meetings (hochpreisig, 1.149 €).",
    sortOrder: 10,
    studentsInRoomOnly: true,
    items: [{ label: "Meeting Owl", note: "Hochpreisig – sorgsam behandeln." }],
  });

  // 3D-Brille – sensibles Einzelstück (PKGB); Studierende nur Nutzung im Raum.
  await createCategory({
    name: "3D-Brille",
    kind: "DEVICE",
    description: "Sensibles Einzelstück der Abteilung PKGB.",
    sortOrder: 11,
    studentsInRoomOnly: true,
    ownerDepartmentId: pkgb,
    items: [{ label: "3D-Brille", note: "Einzelstück – nur nach Absprache." }],
  });

  // Video-Kameras (~12): Mathe Panasonic VX11/V777, PKGB Sony HDR-CX405.
  // 2 Exemplare als Sockel (bleiben im Raum), 1 als Puffer.
  await createCategory({
    name: "Video-Kamera",
    kind: "DEVICE",
    description: "Camcorder für Aufnahmen (verschiedene Modelle, Mathe & PKGB).",
    sortOrder: 12,
    items: [
      { label: "Panasonic HC-VX11 #1", ownerDepartmentId: mathe, unavailableReason: SOCKEL, note: "Fester Sockel – bleibt im Raum." },
      { label: "Panasonic HC-VX11 #2", ownerDepartmentId: mathe, unavailableReason: SOCKEL, note: "Fester Sockel – bleibt im Raum." },
      { label: "Panasonic HC-VX11 #3", ownerDepartmentId: mathe },
      { label: "Panasonic HC-VX11 #4", ownerDepartmentId: mathe },
      { label: "Panasonic HC-V777 #1", ownerDepartmentId: mathe },
      { label: "Panasonic HC-V777 #2", ownerDepartmentId: mathe },
      { label: "Panasonic HC-V777 #3", ownerDepartmentId: mathe },
      { label: "Panasonic HC-V777 #4", ownerDepartmentId: mathe, unavailableReason: PUFFER, note: "Puffer – nicht vorab buchbar." },
      { label: "Sony HDR-CX405 #1", ownerDepartmentId: pkgb },
      { label: "Sony HDR-CX405 #2", ownerDepartmentId: pkgb },
      { label: "Sony HDR-CX405 #3", ownerDepartmentId: pkgb },
      { label: "Sony HDR-CX405 #4", ownerDepartmentId: pkgb },
    ],
  });

  // Stative (~10): Mathe 8 groß, 2 klein. 2 Sockel, 1 Puffer.
  await createCategory({
    name: "Stativ",
    kind: "DEVICE",
    description: "Kamerastative (8 groß, 2 klein – Abteilung Mathe).",
    sortOrder: 13,
    ownerDepartmentId: mathe,
    items: [
      { label: "Stativ groß #1", unavailableReason: SOCKEL, note: "Fester Sockel – bleibt im Raum." },
      { label: "Stativ groß #2", unavailableReason: SOCKEL, note: "Fester Sockel – bleibt im Raum." },
      { label: "Stativ groß #3" },
      { label: "Stativ groß #4" },
      { label: "Stativ groß #5" },
      { label: "Stativ groß #6" },
      { label: "Stativ groß #7" },
      { label: "Stativ groß #8", unavailableReason: PUFFER, note: "Puffer – nicht vorab buchbar." },
      { label: "Stativ klein #1" },
      { label: "Stativ klein #2" },
    ],
  });

  // iPads (20, 6. Generation, Mathe). 1 Puffer.
  await createCategory({
    name: "iPad",
    kind: "DEVICE",
    description: "iPads (6. Generation) der Abteilung Mathe.",
    sortOrder: 14,
    ownerDepartmentId: mathe,
    items: Array.from({ length: 20 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      const isPuffer = i === 19; // letztes iPad als Puffer
      return {
        label: `iPad #${n}`,
        unavailableReason: isPuffer ? PUFFER : undefined,
        note: isPuffer ? "Puffer – nicht vorab buchbar." : undefined,
      };
    }),
  });

  // Diktiergeräte (mind. 2, Sony ICD-UX570).
  await createCategory({
    name: "Diktiergerät",
    kind: "DEVICE",
    description: "Digitale Diktiergeräte (z. B. Sony ICD-UX570).",
    sortOrder: 15,
    items: [
      { label: "Sony ICD-UX570 #1" },
      { label: "Sony ICD-UX570 #2" },
    ],
  });

  // Mikrofone (Røde NT-USB+, PKGB/Lernen). 1 Sockel, 1 Puffer.
  await createCategory({
    name: "Mikrofon",
    kind: "DEVICE",
    description: "USB-Mikrofone (z. B. Røde NT-USB+).",
    sortOrder: 16,
    ownerDepartmentId: pkgb,
    items: [
      { label: "Røde NT-USB+ #1", unavailableReason: SOCKEL, note: "Fester Sockel – bleibt im Raum." },
      { label: "Røde NT-USB+ #2", unavailableReason: PUFFER, note: "Puffer – nicht vorab buchbar." },
      { label: "Røde NT-USB+ #3" },
      { label: "Røde NT-USB+ #4" },
    ],
  });

  // Kleine Übersicht ausgeben.
  const itemCount = await prisma.resourceItem.count();
  const catCount = await prisma.resourceCategory.count();
  console.log(
    `✓ Seed fertig: ${DEPARTMENTS.length} Abteilungen, ${catCount} Kategorien, ${itemCount} Exemplare.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
