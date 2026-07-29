export const tripImages = {
  yahangala: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
  wangedigala: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85',
  nuwaragala: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=85',
}

export const trips = [
  { id: 'yahangala', name: 'Yahangala', status: 'upcoming', location: 'Udugumbara, Sri Lanka', date: 'Jul 14–18, 2025', people: 6, readiness: 72, days: 14, image: tripImages.yahangala },
  { id: 'wangedigala', name: 'Wangedigala', status: 'planning', location: 'Kandy, Sri Lanka', date: 'Aug 2–4, 2025', people: 4, readiness: 45, days: 33, image: tripImages.wangedigala },
  { id: 'nuwaragala', name: 'Nuwaragala', status: 'planning', location: 'Ampara, Sri Lanka', date: 'Sep 5–10, 2025', people: 3, readiness: 28, days: 68, image: tripImages.nuwaragala },
]

export const checklistGroups = [
  { title: 'Shelter', progress: '2/4', icon: '⛺', items: [['4-person tent', true, 'Jordan Kim'], ['Sleeping bags × 4', true, 'Alex K.'], ['Sleeping pads', false, 'Maya R.'], ['Tarp / rain fly', false, 'Jordan Kim']] },
  { title: 'Food & Water', progress: '2/5', icon: '🔥', items: [['Camp stove + fuel', true, 'Jordan Kim'], ['Water filter', true, 'Alex K.'], ['Cookware set', false, 'Maya R.'], ['3-day meal plan', false, ''], ['Cooler + ice packs', false, '']] },
  { title: 'Clothing', progress: '2/3', icon: '🧥', items: [['Rain jacket', true, 'Jordan Kim'], ['Hiking boots', true, ''], ['Merino wool layers', false, '']] },
  { title: 'Safety', progress: '1/4', icon: '🩹', items: [['First-aid kit', true, 'Jordan Kim']] },
]
