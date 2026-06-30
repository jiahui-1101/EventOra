const obsoleteStorageKeys = [
  'eventora_public_events_v2',
  'eventora_society_events_v2',
  'eventora_ticketing_state',
  'eventora_ticketing_v2',
  'eventora_favs_v2',
  'eventora_favorites',
  'eventora_session',
  'eventora_registered_user',
  'eventora_feedbacks',
  'userRole',
]

export function clearObsoleteClientStorage() {
  if (typeof localStorage === 'undefined') return

  obsoleteStorageKeys.forEach((key) => {
    localStorage.removeItem(key)
  })
}
