/**
 * Skriftene lastes fra npm og pakkes med bygget — ingen forespørsel til Google
 * Fonts, ingen tredjepart som ser brukerens IP-adresse.
 *
 * Det er ikke en teknisk detalj. Siden lover at ingenting forlater nettleseren,
 * og et løfte som brytes av en fontlenke i <head> er ikke et løfte.
 *
 * Tre skrifter, hver med én jobb:
 *   Fraunces        overskrifter og store tall — serif med karakter
 *   IBM Plex Sans   brødtekst — rolig, lesbar i små størrelser
 *   IBM Plex Mono   tall, etiketter, klokkeslett — alt som skal stå i kolonne
 *
 * Bare vektene som faktisk brukes importeres. Fraunces er en variabel font, så
 * hele vektaksen kommer i én fil.
 */

import '@fontsource-variable/fraunces'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
