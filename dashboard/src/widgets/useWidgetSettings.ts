/**
 * Innstillinger for én widget-forekomst.
 *
 * Nøkkelen er forekomstens id, ikke widgetens. To klokker på samme dashbord
 * skal kunne vise hver sin tidssone, og to nedtellinger telle mot hver sin
 * eksamen. Det er hele grunnen til at forekomster har id-er i det hele tatt.
 *
 * `validate` er påkrevd og ikke valgfri: verdien kommer fra localStorage, som
 * er et sted hvor hva som helst kan ligge. Uten validering ville en widget
 * kunne krasje på grunn av noe brukeren importerte fra en gammel fil, og en
 * widget som krasjer skal ikke kunne rive med seg dashbordet.
 */

import { ref, watch, type Ref } from 'vue'
import { KEY, read, write } from '@/data/storage.ts'

export const useWidgetSettings = <T extends object>(
  instanceId: string,
  defaults: T,
  validate: (value: unknown) => value is T,
): Ref<T> => {
  const key = KEY.widget(instanceId)
  const settings = ref<T>(read<T>(key, defaults, validate)) as Ref<T>

  watch(settings, (value) => write(key, value), { deep: true })

  return settings
}
