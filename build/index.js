!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("superwstest",[],t):"object"==typeof exports?exports.superwstest=t():e.superwstest=t()}(global,function(){return function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=4)}([function(e,t){e.exports=require("blocking-queue")},function(e,t){e.exports=require("supertest")},function(e,t){e.exports=require("fast-deep-equal")},function(e,t){e.exports=require("ws")},function(e,t,r){e.exports=r(5)},function(e,t,r){"use strict";r.r(t);var n=r(1),o=r.n(n),s=r(0),c=r.n(s),u=r(2),i=r.n(u),f=r(3),a=r.n(f);const l=/^http/;function p(e){if("string"!=typeof e)throw new Error(`Expected text message, got ${typeof e}`);return e}function d(e){return JSON.parse(p(e))}const w={send:(e,t)=>e.send(t),sendText:(e,t)=>e.send(String(t)),sendJson:(e,t)=>e.send(JSON.stringify(t)),wait:(e,t)=>new Promise(e=>setTimeout(e,t)),expectMessage:async(e,t,r=null)=>{const n=await Promise.race([e.messages.pop(),e.closed.then(()=>{throw new Error(`Expected message '${r}', but connection closed`)})]).then(t);if(null!==r)if("function"==typeof r){if(!1===r(n))throw new Error(`Message expectation failed for ${n}`)}else if(!i()(n,r))throw new Error(`Expected message '${r}', got '${n}'`)},expectText:(e,t)=>w.expectMessage(e,p,t),expectJson:(e,t)=>w.expectMessage(e,d,t),close:e=>e.close(),expectClosed:async(e,t=null,r=null)=>{const{code:n,message:o}=await e.closed;if(null!==t&&n!==t)throw new Error(`Expected close code ${t}, got ${n}`);if(null!==r&&o!==r)throw new Error(`Expected close message '${r}', got '${o}'`)}};function g(e){let t=new Promise((t,r)=>{const n=new a.a(e);n.messages=new c.a;const o=new c.a,s=new c.a;n.closed=s.pop(),n.firstError=o.pop().then(e=>{throw e}),n.on("message",e=>n.messages.push(e)),n.on("error",e=>o.push(e)),n.on("error",r),n.on("close",(e,t)=>s.push({code:e,message:t})),n.on("open",()=>{n.removeListener("error",r),t(n)})});const r={};function n(e){return Object.assign(e,r)}return Object.keys(w).forEach(e=>{r[e]=(e=>(...r)=>n(t=t.then(t=>Promise.race([e(t,...r),t.firstError]).then(()=>t))))(w[e])}),n(t)}const x=new WeakSet;var m=e=>{if(!e.address())throw new Error("Server must be listening: beforeEach((done) => server.listen(0, done));");!function(e){if(x.has(e))return;x.add(e);const t=new Set;e.on("connection",e=>{t.add(e),e.on("close",()=>t.delete(e))});const r=e.close.bind(e);e.close=(n=>{e.address()?([...t].forEach(e=>e.end()),r(n)):n&&n()})}(e);const t=o()(e);return t.ws=(t=>g(function(e,t){if(!e.address())throw new Error("Server was closed");return n.Test.prototype.serverAddress(e,t).replace(l,"ws")}(e,t))),t};r.d(t,"default",function(){return m})}])});
//# sourceMappingURL=index.js.map