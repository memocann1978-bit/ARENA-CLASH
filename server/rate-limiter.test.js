const test=require('node:test');
const assert=require('node:assert/strict');
const {createRateLimiter}=require('./rate-limiter');

test('rate limiter allows up to configured limit in a window',()=>{
 const allow=createRateLimiter({limit:2,windowMs:1000});
 const socket={};
 assert.equal(allow(socket,100),true);
 assert.equal(allow(socket,200),true);
 assert.equal(allow(socket,300),false);
});
test('rate limiter resets after the window expires',()=>{
 const allow=createRateLimiter({limit:1,windowMs:1000});
 const socket={};
 assert.equal(allow(socket,100),true);
 assert.equal(allow(socket,1099),false);
 assert.equal(allow(socket,1100),true);
});
test('each socket has an independent rate limit',()=>{
 const allow=createRateLimiter({limit:1,windowMs:1000});
 assert.equal(allow({},100),true);
 assert.equal(allow({},100),true);
});
