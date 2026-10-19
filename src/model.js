export const ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
export const SKILLS = { Athletics: 'Strength', Acrobatics: 'Dexterity', 'Sleight of Hand': 'Dexterity', Stealth: 'Dexterity', Arcana: 'Intelligence', History: 'Intelligence', Investigation: 'Intelligence', Nature: 'Intelligence', Religion: 'Intelligence', 'Animal Handling': 'Wisdom', Insight: 'Wisdom', Medicine: 'Wisdom', Perception: 'Wisdom', Survival: 'Wisdom', Deception: 'Charisma', Intimidation: 'Charisma', Performance: 'Charisma', Persuasion: 'Charisma' };
export const CATALOG = [
  { id: 'longsword', name: 'Longsword', category: 'Weapons', price: 1500, weight: 3, icon: '⚔', description: 'A trusted steel blade. 1d8 slashing; versatile (1d10).' },
  { id: 'shortbow', name: 'Shortbow', category: 'Weapons', price: 2500, weight: 2, icon: '➶', description: 'Strike from the shadows. 1d6 piercing; range 80/320.' },
  { id: 'dagger', name: 'Dagger', category: 'Weapons', price: 200, weight: 1, icon: '†', description: 'Small, sharp, indispensable. 1d4 piercing; finesse, thrown.' },
  { id: 'leather', name: 'Leather armor', category: 'Armor', price: 1000, weight: 10, icon: '♜', description: 'Supple protection for the road. AC 11 + Dexterity modifier.' },
  { id: 'shield', name: 'Shield', category: 'Armor', price: 1000, weight: 6, icon: '◈', description: 'Hold the line. Grants +2 AC while wielded.' },
  { id: 'healing', name: 'Potion of healing', category: 'Potions', price: 5000, weight: 0.5, icon: '♜', description: 'A little courage in a bottle. Restores 2d4 + 2 hit points.' },
  { id: 'rope', name: 'Hempen rope', category: 'Adventuring gear', price: 100, weight: 10, icon: '∞', description: 'Fifty feet of possibility. For climbing, tying, and clever plans.' },
  { id: 'torch', name: 'Torch', category: 'Adventuring gear', price: 1, weight: 1, icon: '♧', description: 'Keep the dark at bay. Burns for one hour.' },
  { id: 'rations', name: 'Rations (1 day)', category: 'Adventuring gear', price: 50, weight: 2, icon: '❧', description: 'Trail bread, dried fruit, and something almost like cheese.' },
  { id: 'bedroll', name: 'Bedroll', category: 'Adventuring gear', price: 100, weight: 7, icon: '▱', description: 'A familiar comfort beneath unfamiliar stars.' }
];
export const modifier = score => Math.floor((score - 10) / 2);
export const signed = n => n >= 0 ? `+${n}` : String(n);
export function integer(value, min, max, label = 'Value') {
  const n = !['number', 'string'].includes(typeof value) || typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return n;
}
export function money(copper) {
  const gp = Math.floor(copper / 100), sp = Math.floor(copper % 100 / 10), cp = copper % 10;
  return [gp && `${gp.toLocaleString()} gp`, sp && `${sp} sp`, cp && `${cp} cp`].filter(Boolean).join(' · ') || '0 gp';
}
export function newCharacter(id = crypto.randomUUID()) {
  return { id, name: 'New adventurer', ancestry: 'Human', className: 'Fighter', background: '', alignment: '', level: 1, hp: 12, maxHp: 12, tempHp: 0, ac: 12, speed: 30, xp: 0, abilities: Object.fromEntries(ABILITIES.map(a => [a, 10])), skills: [], wallet: 10000, inventory: [], notes: '', features: '', spells: '' };
}
export function initialState() { const c = newCharacter(); return { version: 1, selectedId: c.id, characters: [c] }; }
export function validateState(state) {
  const text = (v, max = 20000) => typeof v === 'string' && v.length <= max;
  if (!state || state.version !== 1 || !Array.isArray(state.characters) || state.characters.length > 100 || state.characters.length < 1) throw new Error('Invalid campaign backup.');
  const ids = new Set();
  for (const c of state.characters) {
    if (!c || !text(c.id, 100) || !c.id || ids.has(c.id)) throw new Error('Invalid or duplicate character.');
    ids.add(c.id);
    for (const key of ['name', 'ancestry', 'className', 'background', 'alignment', 'notes', 'features', 'spells']) if (!text(c[key]) || key === 'name' && !c[key].trim()) throw new Error('Invalid character text.');
    for (const [key, min, max] of [['level',1,20],['hp',0,9999],['maxHp',1,9999],['tempHp',0,9999],['ac',0,100],['speed',0,1000],['xp',0,1000000000],['wallet',0,1000000000]]) { if(typeof c[key] !== 'number') throw new Error(`Invalid ${key}.`); integer(c[key], min, max, key); }
    if (c.hp > c.maxHp) throw new Error('Current HP cannot exceed maximum HP.');
    for (const a of ABILITIES) { if(typeof c.abilities?.[a] !== 'number') throw new Error(`Invalid ${a}.`); integer(c.abilities[a], 1, 30, a); }
    if (!Array.isArray(c.skills) || c.skills.some(s => !Object.hasOwn(SKILLS, s)) || new Set(c.skills).size !== c.skills.length) throw new Error('Invalid skills.');
    if (!Array.isArray(c.inventory) || c.inventory.length > 1000) throw new Error('Invalid inventory.');
    const itemIds = new Set();
    for (const i of c.inventory) {
      if (!i || !text(i.id,100) || !i.id || itemIds.has(i.id) || !text(i.name,200) || !i.name.trim() || typeof i.equipped !== 'boolean' || !Number.isFinite(i.weight) || i.weight < 0 || i.weight > 100000) throw new Error('Invalid inventory item.');
      itemIds.add(i.id); if(typeof i.quantity !== 'number' || typeof i.price !== 'number') throw new Error('Invalid item numbers.'); integer(i.quantity,1,9999,'Quantity'); integer(i.price,0,1000000000,'Price');
      if (i.catalogId != null && !CATALOG.some(p => p.id === i.catalogId && p.price === i.price && p.name === i.name && p.weight === i.weight)) throw new Error('Invalid catalog item.');
    }
  }
  if (!ids.has(state.selectedId)) throw new Error('Selected character is missing.');
  return structuredClone(state);
}
export function trade(character, itemId, quantity, direction) {
  const c = structuredClone(character);
  const qty = integer(quantity, 1, 9999, 'Quantity');
  if (!['buy', 'sell'].includes(direction)) throw new Error('Unknown transaction.');
  if (direction === 'buy') {
    const item = CATALOG.find(i => i.id === itemId);
    if (!item) throw new Error('Item unavailable.');
    const cost = item.price * qty;
    if (c.wallet < cost) throw new Error('Not enough coin for this purchase.');
    const owned = c.inventory.find(i => i.catalogId === itemId);
    if (owned && owned.quantity + qty > 9999) throw new Error('Inventory quantity limit reached.');
    c.wallet -= cost;
    if (owned) owned.quantity += qty;
    else c.inventory.push({ id: crypto.randomUUID(), catalogId: item.id, name: item.name, price: item.price, weight: item.weight, quantity: qty, equipped: false });
  } else {
    const item = c.inventory.find(i => i.id === itemId);
    if (!item || item.quantity < qty) throw new Error('You do not own that quantity.');
    if (item.equipped) throw new Error('Unequip this item before selling it.');
    const proceeds = Math.floor(item.price / 2) * qty;
    integer(c.wallet + proceeds, 0, 1000000000, 'Wallet');
    c.wallet += proceeds; item.quantity -= qty;
    c.inventory = c.inventory.filter(i => i.quantity > 0);
  }
  return c;
}
export const STORAGE_KEY = 'dndnight.campaign.v1';
export function load(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? initialState() : validateState(JSON.parse(raw));
}
export function persist(storage, state) { const valid = validateState(state); storage.setItem(STORAGE_KEY, JSON.stringify(valid)); return valid; }
