
require("dotenv").config({
  path: require("path").join(__dirname, ".env")
});
const express=require("express"), axios=require("axios"), cheerio=require("cheerio");
const app=express(); app.use(express.json({limit:"3mb"})); app.use(express.static("public"));
const PORT=process.env.PORT||3000;
const UA="SiteSignalBot/1.0 (+local SEO audit tool)";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function abs(h,base){try{return new URL(h,base).toString().split("#")[0]}catch{return null}}
function same(a,b){try{return new URL(a).host===new URL(b).host}catch{return false}}
async function get(url){try{let r=await axios.get(url,{timeout:12000,headers:{"User-Agent":UA}});return {url,status:r.status,html:String(r.data),headers:r.headers}}catch(e){return {url,status:e.response?.status||0,html:"",error:e.message}}}

function audit(p,root){
 if(!p.html)return {url:p.url,status:p.status,error:p.error,score:0,issues:["Page could not be fetched"]};
 const $=cheerio.load(p.html), title=$("title").first().text().trim();
 const desc=$('meta[name="description"]').attr("content")?.trim()||"";
 const h1=$("h1").map((_,e)=>$(e).text().trim()).get();
 const h2=$("h2").map((_,e)=>$(e).text().trim()).get();
 const canonical=$('link[rel="canonical"]').attr("href")||"";
 const robots=$('meta[name="robots"]').attr("content")||"";
 const lang=$("html").attr("lang")||"";
 const imgs=$("img").length, missingAlt=$("img").filter((_,e)=>!($(e).attr("alt")||"").trim()).length;
 const links=$("a[href]").map((_,e)=>abs($(e).attr("href"),p.url)).get().filter(Boolean);
 const internal=[...new Set(links.filter(x=>same(x,root)))], external=[...new Set(links.filter(x=>!same(x,root)))];
const bodyText = $("body").text().replace(/\s+/g, " ").trim();
const words = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;
 let score=100,issues=[];
 if(!title){score-=15;issues.push("Missing title")}else if(title.length<30||title.length>60){score-=7;issues.push("Title length needs review")}
 if(!desc){score-=12;issues.push("Missing meta description")}else if(desc.length<70||desc.length>165){score-=5;issues.push("Meta description length needs review")}
 if(!h1.length){score-=12;issues.push("Missing H1")}else if(h1.length>1){score-=4;issues.push("Multiple H1s")}
 if(!canonical){score-=5;issues.push("Missing canonical")}
 if(!lang){score-=2;issues.push("Missing html lang")}
 if(missingAlt){score-=Math.min(10,missingAlt*2);issues.push(`${missingAlt} image(s) missing alt text`)}
 if(/noindex/i.test(robots)){score-=10;issues.push("noindex detected")}
 if(words<250){score-=8;issues.push("Very thin visible text (<250 words)")}
 return {url:p.url,status:p.status,title,titleLength:title.length,description:desc,descriptionLength:desc.length,
 h1,h1Count:h1.length,h2,h2Count:h2.length,canonical,robots,lang,images:imgs,missingAlt,
 internalLinks:internal.slice(0,100),externalLinks:external.slice(0,100),wordCount:words,score:Math.max(0,score),issues};
}
async function crawl(start,max=30){
 start=new URL(start).toString().replace(/\/$/,""); let q=[start],seen=new Set(),pages=[];
 while(q.length&&pages.length<max){
  let u=q.shift(); if(seen.has(u)||!same(u,start))continue; seen.add(u);
  let p=await get(u), a=audit(p,start); pages.push(a);
  for(let l of (a.internalLinks||[]))if(!seen.has(l)&&q.length+pages.length<max)q.push(l);
 }
 const titleMap={},descMap={};
 for(const p of pages){if(p.title)(titleMap[p.title]??=[]).push(p.url);if(p.description)(descMap[p.description]??=[]).push(p.url)}
 const duplicates=[];
 for(const [v,urls] of Object.entries(titleMap))if(urls.length>1)duplicates.push({type:"duplicate title",value:v,urls});
 for(const [v,urls] of Object.entries(descMap))if(urls.length>1)duplicates.push({type:"duplicate description",value:v,urls});
 const avg=pages.length?Math.round(pages.reduce((a,p)=>a+p.score,0)/pages.length):0;
 return {start,pages,duplicates,score:avg};
}
async function robotsSitemap(site){
 let base=new URL(site).origin;
 const out={robots:null,sitemap:null};
 for(const kind of ["robots.txt","sitemap.xml"]){
  try{let r=await get(base+"/"+kind);out[kind.split(".")[0]]={status:r.status,body:r.html.slice(0,20000)}}catch{}
 }
 return out;
}
function tokens(result){
 const text=result.pages.map(p=>[p.title,p.description,...p.h1,...p.h2].filter(Boolean).join(" ")).join(" ");
 const stop=new Set(("the and for with from that this your our you are was were what when where which how why into about guide complete best page home official latest new").split(" "));
 const c={}; for(const w of (text.toLowerCase().match(/[a-z0-9₹$][a-z0-9₹$-]{2,}/g)||[]))if(!stop.has(w))c[w]=(c[w]||0)+1;
 return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,20).map(x=>x[0]);
}
async function autocomplete(q){
 try{let r=await axios.get("https://suggestqueries.google.com/complete/search",{params:{client:"firefox",q},timeout:8000,headers:{"User-Agent":"Mozilla/5.0"}});return Array.isArray(r.data?.[1])?r.data[1]:[]}catch{return []}
}
async function discover(result){
 const seeds=tokens(result), qs=[...new Set(seeds.flatMap(s=>[s,`best ${s}`,`${s} guide`,`${s} vs`,`${s} alternatives`,`${s} how to`]))].slice(0,30);
 let all=new Set(); for(const q of qs){(await autocomplete(q)).forEach(x=>all.add(x));await sleep(80)}
 const existing=result.pages.map(p=>`${p.title} ${p.description} ${p.h1.join(" ")} ${p.h2.join(" ")}`.toLowerCase()).join(" ");
 const opportunities=[...all].filter(x=>!existing.includes(x.toLowerCase())).slice(0,60).map((query,i)=>({
  query,intent:/best|vs|alternative|review|price|buy|top/i.test(query)?"commercial":"informational",
  priority:Math.max(40,100-i),reason:i<8?"High topical relevance":"Potential content gap"
 }));
 return {seeds,source:"Google Autocomplete (no search-volume claim)",opportunities};
}
async function cse(query){
 if(!process.env.GOOGLE_CSE_KEY||!process.env.GOOGLE_CSE_ID)return {enabled:false,items:[]};
 try{let r=await axios.get("https://www.googleapis.com/customsearch/v1",{params:{key:process.env.GOOGLE_CSE_KEY,cx:process.env.GOOGLE_CSE_ID,q:query,num:10},timeout:15000});
 return {enabled:true,items:(r.data.items||[]).map(x=>({title:x.title,url:x.link,snippet:x.snippet||""}))}}catch(e){return {enabled:true,error:e.message,items:[]}}
}
function makeBrief(query,result,disc,serp){
 const existing=result.pages.slice(0,20).map(p=>({url:p.url,title:p.title,h1:p.h1,h2:p.h2}));
 return {targetQuery:query,searchIntent:/best|vs|alternative|review|price|buy|top/i.test(query)?"commercial investigation":"informational",
 relatedQueries:disc.opportunities.filter(x=>x.query!==query).slice(0,15).map(x=>x.query),
 siteContent:existing,serpResults:serp.items||[],
 gaps:[
  "Answer the exact target query immediately.",
  "Cover useful subtopics suggested by related queries.",
  "Add sections that are missing from the site's existing content.",
  "Use concrete examples only when supported by research.",
  "Do not invent prices, statistics, reviews, rankings, quotes, or product specifications."
 ],format:["SEO title","meta description","outline","article","FAQ","internal-link suggestions"]};
}
async function gemini(prompt){
 if(!process.env.GEMINI_API_KEY)throw Error("GEMINI_API_KEY is not configured.");
 const model=process.env.GEMINI_MODEL||"gemini-3.6-flash";
 const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
 const r=await axios.post(url,{contents:[{role:"user",parts:[{text:prompt}]}]},{timeout:120000});
 return r.data?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||"";
}
app.post("/api/analyze",async(req,res)=>{
 try{if(!req.body.url)return res.status(400).json({error:"URL required"});
  const result=await crawl(req.body.url,Math.min(30,Number(req.body.maxPages)||30));
  const infra=await robotsSitemap(req.body.url),disc=await discover(result);
  res.json({result,infra,discovery:disc});
 }catch(e){res.status(500).json({error:e.message})}
});
app.post("/api/research",async(req,res)=>{
 try{const {query}=req.body;if(!query)return res.status(400).json({error:"Query required"});
  res.json(await cse(query));
 }catch(e){res.status(500).json({error:e.message})}
});
app.post("/api/generate",async(req,res)=>{
 try{const {query,result,discovery,serp}=req.body;
  const brief=makeBrief(query,result,discovery,serp||{items:[]});
  const prompt=`You are an expert SEO researcher and editorial strategist. Write a specific, evidence-aware article, NOT a generic SEO template.
TARGET QUERY: ${query}
STRUCTURED RESEARCH:
${JSON.stringify(brief,null,2)}
Rules:
1. Satisfy the target query in the first paragraph.
2. Use the related queries to choose genuinely useful sections.
3. Use the site's existing content to suggest natural internal links, but never fabricate URLs.
4. Use SERP snippets only as research leads; do not copy them.
5. Never invent facts, prices, statistics, citations, reviews, rankings or quotations.
6. If a current fact cannot be verified from supplied research, label it "needs verification".
7. Avoid filler such as generic 'key factors' sections unless directly relevant.
Return Markdown with: TITLE, META DESCRIPTION, OUTLINE, ARTICLE, FAQ, INTERNAL LINK SUGGESTIONS.`;
  const article=await gemini(prompt);res.json({brief,article});
 }catch(e){res.status(500).json({error:e.message})}
});
app.listen(PORT,()=>console.log(`SiteSignal on http://localhost:${PORT}`));
