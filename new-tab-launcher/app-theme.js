(function(){
'use strict';
var root=document.documentElement,current={};
function rgb(hex){var h=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return '';return parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16);}
function apply(data){Object.keys(data||{}).forEach(function(k){current[k]=data[k];});
var palette=current.customPalette&&typeof current.customPalette==='object'?current.customPalette:{};
var a=rgb(palette.accent),b=rgb(palette.accent2);
if(a)root.style.setProperty('--accent-rgb',a);else root.style.removeProperty('--accent-rgb');
if(b)root.style.setProperty('--accent2-rgb',b);else root.style.removeProperty('--accent2-rgb');
var p=current.accessibilityPrefs||{};
root.setAttribute('data-text-size',['small','normal','large'].indexOf(p.textSize)>=0?p.textSize:'normal');
root.setAttribute('data-density',p.density==='compact'?'compact':'comfortable');
if(p.highContrast)root.setAttribute('data-contrast','high');else root.removeAttribute('data-contrast');
if(current.motion==='off')root.setAttribute('data-motion','off');else root.removeAttribute('data-motion');
if(typeof current.theme==='string')root.setAttribute('data-theme',current.theme);
}
chrome.storage.local.get(['theme','customPalette','accessibilityPrefs','motion'],apply);
chrome.storage.onChanged.addListener(function(changes,area){if(area!=='local')return;var next={};['theme','customPalette','accessibilityPrefs','motion'].forEach(function(k){if(changes[k])next[k]=changes[k].newValue;});if(Object.keys(next).length)apply(next);});
})();