function createRateLimiter({limit,windowMs}) {
 const hits=new Map();
 return function allow(key,now=Date.now()) {
  const current=hits.get(key);
  if(!current||now-current.startedAt>=windowMs){hits.set(key,{startedAt:now,count:1});return true}
  if(current.count>=limit)return false;
  current.count++;
  return true;
 };
}
module.exports={createRateLimiter};
