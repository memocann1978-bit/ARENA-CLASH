const test=require('node:test');
const assert=require('node:assert/strict');
const {CARDS,sanitizePlayerName,validatePlacement}=require('./game-rules');

test('all eight cards have unique ids and valid costs/stats',()=>{
 assert.equal(CARDS.length,8);
 assert.equal(new Set(CARDS.map(c=>c.id)).size,8);
 for(const c of CARDS){
  assert.ok(c.cost>0&&c.cost<=10);
  assert.ok(c.hp>0);
  assert.ok(c.damage>0);
  assert.ok(c.range>0);
 }
});

test('player names are trimmed, bounded and stripped safely',()=>{
 assert.equal(sanitizePlayerName('  <Admin>  '),'Admin');
 assert.equal(sanitizePlayerName(''),'Oyuncu');
 assert.equal(sanitizePlayerName('A'.repeat(30)).length,18);
 assert.equal(sanitizePlayerName('ab\ncd'),'abcd');
 assert.equal(sanitizePlayerName('<b>Oyuncu</b>'),'bOyuncu/b');
 assert.equal(sanitizePlayerName('\u0000Test\u007f'),'Test');
});

test('blue and red players can only deploy in their own half',()=>{
 assert.equal(validatePlacement('blue',545,300),true);
 assert.equal(validatePlacement('blue',546,300),false);
 assert.equal(validatePlacement('red',555,300),true);
 assert.equal(validatePlacement('red',554,300),false);
});

test('invalid coordinates and teams are rejected',()=>{
 for(const args of [
  ['blue',NaN,200],['blue',200,Infinity],['green',200,200],
  ['blue',19,200],['red',1100,200],['blue',200,84],['red',200,536]
 ]) assert.equal(validatePlacement(...args),false);
});
