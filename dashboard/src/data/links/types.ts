/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LENKEKATALOGEN — typer
 *
 *  Kjernegrepet: velg lærested, og hele lenkesettet bytter. En student ved UiB
 *  skal ikke se NTNU-lenker.
 *
 *  Tre valg i typen som er verdt å begrunne:
 *
 *  `note` er påkrevd, ikke valgfri. Halvparten av lærestedenes systemer har
 *  navn som ikke sier noe — «Inspera», «Leganto», «Oria», «TP» — og en lenke
 *  uten forklaring er en lenke man ikke tør trykke på. Kravet håndheves av
 *  typen, ikke av god vilje.
 *
 *  `reviewed` ligger på lærestedet. En lenkekatalog råtner, og den råtner
 *  stille. Datoen gjør råtningen synlig: har ingen sett på UiT siden i fjor,
 *  står det på siden at ingen har sett på UiT siden i fjor.
 *
 *  `warning` finnes fordi systemer byttes ut midt i semesteret, og da er «dette
 *  er i ferd med å endre seg» den nyttigste opplysningen på hele siden.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Bilingual } from '../bilingual.ts'

export interface Link {
  /** Navnet slik lærestedet selv bruker det. Ikke oversatt — «Inspera» er «Inspera». */
  label: string
  url: string
  /** Hva det faktisk er til. Påkrevd. */
  note: Bilingual
  /**
   * Ord som ikke står i navnet, men som folk søker etter.
   * «Inspera» finnes ved å søke «eksamen» fordi det står her.
   */
  keywords?: string[]
  /** Noe som er i endring akkurat nå. Vises tydelig, ikke som fotnote. */
  warning?: Bilingual
}

export const GROUP_IDS = ['studies', 'practical', 'library', 'campus', 'life'] as const
export type GroupId = (typeof GROUP_IDS)[number]

export const GROUP_LABEL: Record<GroupId, Bilingual> = {
  studies: { nb: 'Studier', en: 'Studies' },
  practical: { nb: 'Praktisk', en: 'Practical' },
  library: { nb: 'Bibliotek', en: 'Library' },
  campus: { nb: 'Campus', en: 'Campus' },
  life: { nb: 'Studentliv', en: 'Student life' },
}

export interface LinkGroup {
  id: GroupId
  links: Link[]
}

export interface Institution {
  id: string
  name: string
  shortName: string
  /** Studiestedene. Skiller NTNU i Gjøvik fra NTNU i Trondheim i velgeren. */
  city: string[]
  /**
   * ISO-dato for siste gjennomgang.
   *
   * «Gjennomgått» betyr at lenkene er kontrollert mot lærestedets egne sider,
   * ikke at en maskin har pinget dem. Det er en ærligere påstand, og den er
   * den som betyr noe: en lenke kan svare 200 og likevel peke på et system
   * som ble lagt ned i fjor.
   */
  reviewed: string
  groups: LinkGroup[]
}

/** Ett oppslag i søket: en lenke pluss hvor den kommer fra. */
export interface LinkEntry {
  link: Link
  group: GroupId
  /** Lærestedets kortnavn, eller null for de nasjonale lenkene. */
  institution: string | null
}
