import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCharacter, initialState, validateState, trade, money, modifier, persist, load, STORAGE_KEY, CATALOG } from '../src/model.js';

test('purchase and partial/full sale conserve inventory and use copper', () => {
  const original = newCharacter();
  const bought = trade(original, 'dagger', 3, 'buy');
  assert.equal(original.wallet, 10000); assert.equal(original.inventory.length, 0);
  assert.equal(bought.wallet, 9400); assert.equal(bought.inventory[0].quantity, 3);
  const partial = trade(bought, bought.inventory[0].id, 2, 'sell');
  assert.equal(partial.wallet, 9600); assert.equal(partial.inventory[0].quantity, 1);
  const sold = trade(partial, partial.inventory[0].id, 1, 'sell');
  assert.equal(sold.wallet, 9700); assert.deepEqual(sold.inventory, []);
});
test('same catalog purchase stacks; custom item does not merge with catalog', () => {
  const c = newCharacter(); c.inventory.push({id:'custom',name:'Dagger',quantity:1,price:9999,weight:1,equipped:false});
  const bought = trade(trade(c,'dagger',1,'buy'),'dagger',2,'buy');
  assert.equal(bought.inventory.length,2); assert.equal(bought.inventory[1].quantity,3);
});
test('insufficient funds, overselling and invalid quantities cannot mutate source', () => {
  const c = newCharacter(); c.wallet = 0;
  const before = structuredClone(c);
  assert.throws(()=>trade(c,'dagger',1,'buy'),/coin/);
  for (const qty of [0,-1,1.1,NaN,Infinity,10000,'']) assert.throws(()=>trade(c,'torch',qty,'buy'));
  assert.throws(()=>trade(c,'missing',1,'buy'));
  assert.throws(()=>trade(c,'missing',1,'sell'));
  assert.throws(()=>trade(c,'torch',1,'refund'));
  assert.deepEqual(c,before);
  const bought = trade(newCharacter(),'dagger',1,'buy');
  assert.throws(()=>trade(bought,bought.inventory[0].id,2,'sell'),/quantity/);
});
test('equipped items cannot be sold; resale rounds each unit down', () => {
  let c = trade(newCharacter(),'torch',3,'buy');
  c.inventory[0].equipped=true;
  assert.throws(()=>trade(c,c.inventory[0].id,1,'sell'),/Unequip/);
  c.inventory[0].equipped=false;
  const sold = trade(c,c.inventory[0].id,3,'sell');
  assert.equal(sold.wallet,c.wallet); assert.deepEqual(sold.inventory,[]);
});
test('inventory and wallet upper bounds reject the entire trade', () => {
  const c = trade(newCharacter(),'torch',9999,'buy');
  assert.throws(()=>trade(c,'torch',1,'buy'),/limit/);
  c.wallet=1000000000; c.inventory[0].price=100;
  assert.throws(()=>trade(c,c.inventory[0].id,1,'sell'),/Wallet/);
});
test('coin formatting and ability modifiers handle boundaries', () => {
  assert.equal(money(0),'0 gp'); assert.equal(money(101),'1 gp · 1 cp'); assert.equal(money(119),'1 gp · 1 sp · 9 cp');
  assert.equal(modifier(1),-5); assert.equal(modifier(9),-1); assert.equal(modifier(10),0); assert.equal(modifier(30),10);
});
test('every catalog item can be bought and resold at its advertised value', () => {
  for (const item of CATALOG) {
    const c = newCharacter(); c.wallet=item.price;
    const bought=trade(c,item.id,1,'buy'); assert.equal(bought.wallet,0);
    const sold=trade(bought,bought.inventory[0].id,1,'sell'); assert.equal(sold.wallet,Math.floor(item.price/2));
  }
});
test('save/load round trip preserves separate characters and edited fields', () => {
  const memory = new Map(), storage = {getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
  const s=initialState(); s.characters.push(newCharacter()); s.characters[0].name='Mira'; s.characters[0].notes='<script>plain text</script>';
  s.characters[0].skills=['Stealth']; s.characters[0]=trade(s.characters[0],'dagger',2,'buy');
  persist(storage,s); assert.deepEqual(load(storage),s);
  assert.equal(s.characters[1].wallet,10000); assert.equal(s.characters[1].inventory.length,0);
  memory.set(STORAGE_KEY,'broken'); assert.throws(()=>load(storage)); assert.equal(memory.get(STORAGE_KEY),'broken');
});
test('storage failures propagate rather than claiming a successful save', () => {
  assert.throws(()=>persist({setItem(){throw Error('Quota exceeded');}},initialState()),/Quota/);
});
test('malformed backups rejected before writing', () => {
  const mutations = [s=>s.version=9,s=>s.characters=[],s=>s.selectedId='missing',s=>s.characters.push(structuredClone(s.characters[0])),s=>s.characters[0].hp=999,s=>s.characters[0].abilities.Wisdom=31,s=>s.characters[0].wallet=-1,s=>s.characters[0].skills=['Bogus'],s=>s.characters[0].name=''];
  for(const mutate of mutations) { const s=initialState(); mutate(s); assert.throws(()=>validateState(s)); }
  const s=initialState(); s.characters[0]=trade(s.characters[0],'dagger',1,'buy'); s.characters[0].inventory[0].price=999;
  assert.throws(()=>validateState(s),/catalog/);
});
