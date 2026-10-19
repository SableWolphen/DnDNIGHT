import { ABILITIES, SKILLS, CATALOG, modifier, signed, money, newCharacter, load, persist, validateState, trade, integer, STORAGE_KEY } from './model.js';

const app = document.querySelector('#app');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let state, disk, storageError = '', category = 'All items', query = '', storeMode = 'buy';
try { state = load(localStorage); disk = localStorage.getItem(STORAGE_KEY); }
catch { storageError = 'Your saved campaign could not be read. Export a backup before importing a valid campaign. Existing data has been preserved.'; }
let noticeTimer;
function notify(message) { clearTimeout(noticeTimer); document.querySelector('#notice').textContent = message; noticeTimer = setTimeout(() => { document.querySelector('#notice').textContent = ''; }, 7000); }
function commit(next) {
  if (localStorage.getItem(STORAGE_KEY) !== disk) throw new Error('This campaign changed in another tab. Reload before saving.');
  state = persist(localStorage, next); disk = localStorage.getItem(STORAGE_KEY);
}
function updateCharacter(updated) { const next = structuredClone(state); next.characters = next.characters.map(c => c.id === updated.id ? updated : c); commit(next); }
const current = () => state.characters.find(c => c.id === state.selectedId);
const route = () => location.hash.startsWith('#/store') ? 'store' : 'characters';
function field(label, key, value, type = 'text', extras = '') { return `<label>${label}<input name="${key}" type="${type}" value="${esc(value)}" ${extras}></label>`; }
function number(label, key, value, min = 0, max = 9999) { return field(label, key, value, 'number', `min="${min}" max="${max}" step="1" required`); }
function wallet(c) { return `<div class="wallet"><span class="coin">✦</span><div><small>YOUR COIN PURSE</small><strong>${money(c.wallet)}</strong></div></div>`; }
function render() {
  document.querySelectorAll('[data-route]').forEach(a => { const active = a.dataset.route === route(); a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (!state) { app.innerHTML = `<main id="main"><div class="panel"><h1>Let’s recover your campaign</h1><p>${esc(storageError)}</p><p>Use the backup controls below to recover your data.</p></div></main>`; return; }
  const c = current();
  app.innerHTML = `<div class="layout"><aside class="sidebar"><p class="eyebrow">THE ADVENTURING PARTY</p><h2>Your characters <span>${state.characters.length}</span></h2><div class="party">${state.characters.map((p,i) => `<button class="party-card ${p.id === c.id ? 'selected' : ''}" data-select="${esc(p.id)}" aria-pressed="${p.id === c.id}"><span class="avatar hue-${i%4}">${esc(p.name.trim().slice(0,1).toUpperCase())}</span><span><strong>${esc(p.name)}</strong><small>Level ${p.level} · ${esc(p.className)}</small></span><span class="chevron">›</span></button>`).join('')}</div><button class="button outline wide" data-action="create">＋ Create character</button><div class="sidebar-note"><span>✧</span><h3>A story in the making</h3><p>Every great adventure starts with a character. Make yours memorable.</p></div><p class="device-note">● Browser-local saves<br>No account required. Export backups to take your party with you.</p></aside><main id="main">${route() === 'store' ? store(c) : sheet(c)}</main></div><dialog id="modal"></dialog>`;
  if (route() === 'store') bindSearch();
}
function sheet(c) {
  const proficiency = 2 + Math.floor((c.level - 1) / 4);
  const weight = c.inventory.reduce((sum,i) => sum + i.quantity * i.weight, 0);
  return `<div class="page-heading"><div><p class="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h1>Character sheets</h1><p>The heroes, the misfits, and everyone in between.</p></div><a class="button outline" href="#/store">Visit marketplace ↗</a></div>
  <section class="hero"><div class="hero-mark" aria-hidden="true">✧</div><div><p class="eyebrow">READY FOR ADVENTURE</p><h2>${esc(c.name)}</h2><p>${esc(c.ancestry)} ${esc(c.className)} <span>·</span> Level ${c.level}${c.background ? ` <span>·</span> ${esc(c.background)}` : ''}</p></div><div class="hero-actions"><button class="button light" data-action="identity">Edit character</button><button class="text-button danger-light" data-action="delete" ${state.characters.length === 1 ? 'disabled title="Keep at least one character"' : ''}>Delete character</button></div></section>
  <form id="sheet-form"><div class="section-title"><h2>At a glance</h2><span>Proficiency bonus <b>${signed(proficiency)}</b> · Initiative <b>${signed(modifier(c.abilities.Dexterity))}</b></span></div><section class="combat-grid">${number('Current HP','hp',c.hp)}${number('Maximum HP','maxHp',c.maxHp,1)}${number('Temporary HP','tempHp',c.tempHp)}${number('Armor class','ac',c.ac,0,100)}${number('Speed (ft)','speed',c.speed,0,1000)}${number('Experience','xp',c.xp,0,1000000000)}</section>
  <div class="sheet-columns"><section class="panel"><div class="section-title"><h2>Ability scores</h2><span>The foundation of your hero</span></div><div class="abilities">${ABILITIES.map(a => `<label class="ability"><span>${a}</span><strong>${signed(modifier(c.abilities[a]))}</strong><input aria-label="${a} score" type="number" name="ability-${a}" min="1" max="30" required value="${c.abilities[a]}"></label>`).join('')}</div><p class="hint">Modifiers update when you save your sheet.</p><h3>Skills & proficiencies</h3><p class="hint">Check the skills you’re proficient in.</p><div class="skills">${Object.entries(SKILLS).map(([s,a]) => `<label><input type="checkbox" name="skill" value="${s}" ${c.skills.includes(s) ? 'checked' : ''}><span>${s}</span><b>${signed(modifier(c.abilities[a]) + (c.skills.includes(s) ? proficiency : 0))}</b></label>`).join('')}</div></section>
  <section class="panel"><div class="section-title"><h2>Coin purse</h2><span>1 gp = 10 sp = 100 cp</span></div>${wallet(c)}<div class="currency-inputs">${number('Gold','gold',Math.floor(c.wallet/100),0,10000000)}${number('Silver','silver',Math.floor(c.wallet%100/10),0,9)}${number('Copper','copper',c.wallet%10,0,9)}</div><p class="hint">Track rewards here. Store purchases use this balance.</p><div class="section-title inventory-title"><h2>Inventory</h2><button type="button" class="text-button" data-action="add-item">＋ Add item</button></div><p class="hint">${c.inventory.reduce((s,i) => s+i.quantity,0)} items · ${weight.toLocaleString(undefined,{maximumFractionDigits:2})} lb carried</p>${inventory(c)}<a class="store-link" href="#/store">Find something for your next adventure <span>↗</span></a></section></div>
  <section class="panel journal"><h2>Your story, your way</h2><div class="journal-grid"><label>Features & traits<textarea name="features" rows="5" maxlength="20000" placeholder="Class features, feats, and what makes you different…">${esc(c.features)}</textarea></label><label>Spells & resources<textarea name="spells" rows="5" maxlength="20000" placeholder="Known spells, spell slots, and daily resources…">${esc(c.spells)}</textarea></label><label>Adventure notes<textarea name="notes" rows="5" maxlength="20000" placeholder="Allies, unfinished quests, and suspicious tavern keepers…">${esc(c.notes)}</textarea></label></div></section><div class="save-bar"><span id="dirty-state">Changes are saved when you choose Save sheet.</span><button class="button primary" type="submit">Save sheet</button></div></form>`;
}
function inventory(c) { return c.inventory.length ? `<div class="inventory-list">${c.inventory.map(i => `<div class="inventory-row"><span class="item-glyph">${i.catalogId ? CATALOG.find(p=>p.id === i.catalogId)?.icon : '◇'}</span><div><strong>${esc(i.name)}</strong><small>Qty ${i.quantity} · ${i.equipped ? 'Equipped' : 'In pack'} · ${money(i.price)} value</small></div><button type="button" class="text-button" data-edit-item="${esc(i.id)}" aria-label="Edit ${esc(i.name)}">Edit</button></div>`).join('')}</div>` : `<div class="empty"><span>◇</span><h3>A pack full of possibilities</h3><p>Add your starting gear or explore the marketplace.</p></div>`; }
function store(c) { return `<div class="page-heading"><div><p class="eyebrow">PROVISIONS FOR THE ROAD AHEAD</p><h1>The marketplace</h1><p>Good gear. Fair coin. Better stories.</p></div>${wallet(c)}</div><section class="market-banner"><div><p class="eyebrow">THE WANDERING MERCHANT</p><h2>Every adventure needs<br>a little preparation.</h2><p>Stock up for the journey, or lighten your pack.</p></div><span aria-hidden="true">⚖</span></section><div class="store-toolbar"><div class="tabs" role="group" aria-label="Transaction type"><button data-mode="buy" class="${storeMode === 'buy' ? 'active' : ''}" aria-pressed="${storeMode === 'buy'}">Buy items</button><button data-mode="sell" class="${storeMode === 'sell' ? 'active' : ''}" aria-pressed="${storeMode === 'sell'}">Sell from inventory</button></div><p>Trading as <strong>${esc(c.name)}</strong></p></div><div class="filters"><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Search for equipment…" aria-label="Search items" value="${esc(query)}"></label><label class="category-label">Category<select id="category">${['All items','Weapons','Armor','Potions','Adventuring gear'].map(x=>`<option ${x === category ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div><p class="hint">${storeMode === 'buy' ? 'Campaign prices · Unlimited merchant stock · Purchases go straight to your pack.' : 'Merchant pays 50% of each unit’s value, rounded down to copper. Unequip items before selling.'}</p><div id="products" class="products">${products(c)}</div><div class="market-footnote">✧ <span>Equipping armor does not change AC automatically. Update your sheet for your character’s rules.</span></div>`; }
function products(c) {
  const items = storeMode === 'buy' ? CATALOG : c.inventory;
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()) && (category === 'All items' || (i.category || CATALOG.find(p=>p.id === i.catalogId)?.category || 'Custom gear') === category));
  return filtered.length ? filtered.map(i => {
    const price = storeMode === 'buy' ? i.price : Math.floor(i.price/2);
    const disabled = storeMode === 'buy' ? c.wallet < price : i.equipped;
    return `<article class="product"><div class="product-art art-${esc(i.category || 'gear').split(' ')[0].toLowerCase()}" aria-hidden="true">${i.icon || '◇'}</div><div class="product-body"><p class="eyebrow">${esc(i.category || 'YOUR INVENTORY')}</p><h3>${esc(i.name)}</h3><p>${esc(i.description || `${i.quantity} owned · ${i.weight} lb each${i.equipped ? ' · Equipped' : ''}`)}</p><div class="product-bottom"><strong>${money(price)} <small>/ each</small></strong><button class="button ${storeMode === 'buy' ? 'primary' : 'outline'}" data-trade="${esc(i.id)}" ${disabled ? 'disabled' : ''}>${disabled ? (storeMode === 'buy' ? 'Need more coin' : 'Equipped') : (storeMode === 'buy' ? 'Buy' : 'Sell')}</button></div></div></article>`;
  }).join('') : '<div class="empty"><h3>No items here yet</h3><p>Try a different search or category, or add items to your character’s pack.</p></div>';
}
function bindSearch() {
  document.querySelector('#search').addEventListener('input', e => { query = e.target.value; document.querySelector('#products').innerHTML = products(current()); });
  document.querySelector('#category').addEventListener('change', e => { category = e.target.value; document.querySelector('#products').innerHTML = products(current()); });
}
function modal(title, content, formId, submitLabel = 'Save changes') {
  const dialog = document.querySelector('#modal');
  dialog.innerHTML = `<form id="${formId}"><div class="section-title"><h2>${title}</h2><button type="button" class="text-button" data-action="close" aria-label="Close dialog">✕</button></div>${content}<p class="form-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button outline" data-action="close">Cancel</button><button class="button primary">${submitLabel}</button></div></form>`;
  dialog.showModal();
}
let editingId = null, tradeId = null;
document.addEventListener('click', e => {
  const trigger = e.target.closest('a[href^="#/"], button[data-action], button[data-select], button[data-mode], button[data-edit-item], button[data-trade]');
  if (!trigger || document.querySelector('#dirty-state')?.textContent !== 'You have unsaved changes.') return;
  if (!confirm('Leave your unsaved sheet changes? Choose Cancel to save your sheet first.')) { e.preventDefault(); e.stopPropagation(); }
  else document.querySelector('#dirty-state').textContent = 'Changes are saved when you choose Save sheet.';
}, true);
app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    const c = current(), action = b.dataset.action;
    if (b.dataset.select) { const next = structuredClone(state); next.selectedId = b.dataset.select; commit(next); render(); }
    if (b.dataset.mode) { storeMode = b.dataset.mode; category = 'All items'; render(); }
    if (action === 'close') document.querySelector('#modal').close();
    if (action === 'create' || action === 'identity') {
      editingId = action === 'create' ? null : c.id;
      const p = editingId ? c : newCharacter();
      modal(editingId ? 'Edit character' : 'Meet your next hero', `<div class="form-grid">${field('Character name','name', editingId ? p.name : '', 'text','required maxlength="100" autofocus')}${field('Ancestry','ancestry',p.ancestry,'text','maxlength="100"')}${field('Class','className',p.className,'text','maxlength="100"')}${number('Level','level',p.level,1,20)}${field('Background','background',p.background,'text','maxlength="200"')}${field('Alignment','alignment',p.alignment,'text','maxlength="100"')}</div>${editingId ? '' : '<p class="hint">New characters start with 100 gp, 12 HP, and ability scores of 10. Customize these on your sheet.</p>'}`, 'identity-form', editingId ? 'Save character' : 'Create character');
    }
    if (action === 'delete') modal('Retire this adventurer?', `<p>Delete ${esc(c.name)} and their inventory? This cannot be undone. Export a backup first if you want to keep them.</p>`, 'delete-form', 'Delete character');
    if (action === 'add-item' || b.dataset.editItem) {
      editingId = b.dataset.editItem || null;
      const i = c.inventory.find(i=>i.id === editingId) || {name:'',quantity:1,price:0,weight:0,equipped:false};
      modal(editingId ? 'Edit inventory item' : 'Add to your pack', `<div class="form-grid">${field('Item name','name',i.name,'text',`required maxlength="200" ${i.catalogId ? 'readonly' : ''}`)}${number('Quantity','quantity',i.quantity,1)}${number('Unit value (cp)','price',i.price,0,1000000000).replace('<input', `<input ${i.catalogId ? 'readonly' : ''}`)}${field('Unit weight (lb)','weight',i.weight,'number',`required min="0" max="100000" step="0.01" ${i.catalogId ? 'readonly' : ''}`)}</div><label class="check"><input type="checkbox" name="equipped" ${i.equipped ? 'checked' : ''}> Equipped</label><p class="hint">Manual inventory edits track loot and starting gear without moving coin.</p>${editingId ? '<button type="button" class="text-button danger" data-action="remove-item">Remove item from pack</button>' : ''}`, 'item-form');
    }
    if (action === 'remove-item') { modal('Remove this item?', '<p>This removes the entire stack without receiving coin. Sell it in the marketplace to receive payment.</p>', 'remove-form', 'Remove item'); }
    if (b.dataset.trade) {
      tradeId = b.dataset.trade;
      const i = (storeMode === 'buy' ? CATALOG : c.inventory).find(i=>i.id === tradeId);
      const price = storeMode === 'buy' ? i.price : Math.floor(i.price / 2);
      const max = storeMode === 'buy' ? Math.min(9999,Math.floor(c.wallet/i.price),9999-(c.inventory.find(x=>x.catalogId===i.id)?.quantity || 0)) : i.quantity;
      if (max < 1) throw new Error('Inventory quantity limit reached.');
      modal(`${storeMode === 'buy' ? 'Buy' : 'Sell'} ${esc(i.name)}`, `<p>${money(price)} per item · Trading as ${esc(c.name)}</p>${number('Quantity','quantity',1,1,max)}<p class="trade-total">Total: <strong id="trade-total">${money(price)}</strong></p><p class="hint">Coin purse: ${money(c.wallet)}</p>`, 'trade-form', storeMode === 'buy' ? 'Confirm purchase' : 'Confirm sale');
      document.querySelector('#trade-form [name="quantity"]').addEventListener('input', e => { document.querySelector('#trade-total').textContent = Number.isSafeInteger(Number(e.target.value)) && Number(e.target.value)>0 ? money(price*Number(e.target.value)) : '—'; });
    }
  } catch (error) { notify(error.message); }
});
app.addEventListener('input', e => { if (e.target.closest('#sheet-form')) document.querySelector('#dirty-state').textContent = 'You have unsaved changes.'; });
app.addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target, data = new FormData(form), c = structuredClone(current());
  const n = (key,min=0,max=9999) => integer(data.get(key),min,max,key);
  try {
    if (form.id === 'sheet-form') {
      for (const k of ['hp','tempHp']) c[k] = n(k);
      c.maxHp=n('maxHp',1); c.ac=n('ac',0,100); c.speed=n('speed',0,1000); c.xp=n('xp',0,1000000000);
      for (const a of ABILITIES) c.abilities[a]=n(`ability-${a}`,1,30);
      c.wallet=n('gold',0,10000000)*100+n('silver',0,9)*10+n('copper',0,9);
      c.skills=data.getAll('skill'); for(const k of ['notes','features','spells']) c[k]=data.get(k);
      updateCharacter(c); notify('Character sheet saved.');
    } else if (form.id === 'identity-form') {
      const p = editingId ? c : newCharacter();
      for (const k of ['name','ancestry','className','background','alignment']) p[k]=data.get(k).trim();
      p.level=n('level',1,20);
      if (editingId) updateCharacter(p);
      else { const next=structuredClone(state); next.characters.push(p); next.selectedId=p.id; commit(next); }
      notify('Character saved.');
    } else if (form.id === 'item-form') {
      const existing = c.inventory.find(i=>i.id===editingId);
      const i = { ...existing, id: editingId || crypto.randomUUID(), name: data.get('name').trim(), quantity:n('quantity',1), price:n('price',0,1000000000), weight:Number(data.get('weight')), equipped:data.has('equipped') };
      if (existing) c.inventory=c.inventory.map(x=>x.id===editingId ? i : x); else c.inventory.push(i);
      updateCharacter(c); notify('Inventory saved.');
    } else if (form.id === 'trade-form') { updateCharacter(trade(c,tradeId,n('quantity',1),storeMode)); notify(storeMode === 'buy' ? 'Purchase complete. Your gear is in your pack.' : 'Sale complete. Coin added to your purse.'); }
    else if (form.id === 'remove-form') { c.inventory=c.inventory.filter(i=>i.id!==editingId); updateCharacter(c); notify('Item removed.'); }
    else if (form.id === 'delete-form') { if(state.characters.length<2) throw new Error('Keep at least one character.'); const next=structuredClone(state); next.characters=next.characters.filter(p=>p.id!==c.id); next.selectedId=next.characters[0].id; commit(next); notify('Character deleted.'); }
    render();
  } catch(error) { const output=form.querySelector('.form-error'); if(output) output.textContent=error.message; else notify(error.message); }
});
window.addEventListener('hashchange', render);
window.addEventListener('beforeunload', e => { if(document.querySelector('#dirty-state')?.textContent === 'You have unsaved changes.') { e.preventDefault(); e.returnValue=''; } });
window.addEventListener('storage', e => { if(e.key===STORAGE_KEY) notify('Campaign changed in another tab. Reload to use its latest saved version.'); });
document.querySelector('#export').addEventListener('click', () => {
  try {
    const blob=new Blob([localStorage.getItem(STORAGE_KEY) || JSON.stringify(state)],{type:'application/json'});
    const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download='dndnight-campaign.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); notify('Campaign backup exported.');
  } catch { notify('Browser storage is unavailable. Allow local storage to save or export campaigns.'); }
});
document.querySelector('#import').addEventListener('change', async e => {
  const file=e.target.files[0]; if(!file) return;
  try {
    if(file.size>5000000) throw new Error('Backup is too large (maximum 5 MB).');
    const incoming=validateState(JSON.parse(await file.text()));
    if(!confirm('Replace this browser’s campaign with the imported backup? Export your current campaign first if you want to keep it.')) return;
    if(!state) disk=localStorage.getItem(STORAGE_KEY);
    commit(incoming); render(); notify('Campaign restored.');
  } catch(error) { notify(`Could not import: ${error.message}`); }
  finally { e.target.value=''; }
});
render();
