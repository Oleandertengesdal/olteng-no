/**
 * Meld fra om en lenke som er feil.
 *
 * Katalogen blir bare god hvis andre kan rette den. En forhåndsutfylt
 * GitHub-issue er den korteste veien fra «denne peker feil» til at noen kan
 * gjøre noe med det — den koster ett klikk, og innholdet er allerede skrevet.
 *
 * Ingen skjemapost, ingen server, ingen e-postadresse på avveie.
 */

const REPO = 'https://github.com/Oleandertengesdal/olteng-no'

export interface ReportContext {
  institution: string
  /** Fylles ut når meldingen gjelder én bestemt lenke. */
  link?: { label: string; url: string }
}

export const reportUrl = ({ institution, link }: ReportContext): string => {
  const title = link
    ? `Lenkekatalog: ${institution} — ${link.label}`
    : `Lenkekatalog: ${institution}`

  const facts = link
    ? [`**Lærested:** ${institution}`, `**Lenke:** ${link.label}`, `**Adresse:** ${link.url}`]
    : [`**Lærested:** ${institution}`]

  const body = [
    ...facts,
    '',
    '**Hva er galt?**',
    '<!-- Peker den feil? Er systemet byttet ut? Mangler det en lenke? -->',
    '',
    '**Hva burde det stått?**',
    '',
  ].join('\n')

  const params = new URLSearchParams({ title, body, labels: 'lenkekatalog' })
  return `${REPO}/issues/new?${params}`
}
