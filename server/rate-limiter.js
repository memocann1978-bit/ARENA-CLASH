function createRateLimiter({limit,windowMs}) {
 const hits=new WeakMap();
 return function allow(key,now=Date.now()) {
  if((typeof key!=='object'&&typeof key!=='function')||key===null)throw new TypeError('Rate-limit key must be an object');
  const current=hits.get(key);
  if(!current||now-current.startedAt>=windowMs){hits.set(key,{startedAt:now,count:1});return true}
  if(current.count>=limit)return false;
  current.count++;
  return true;
 };
}
module.exports={createRateLimiter};
