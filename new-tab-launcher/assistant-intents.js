/* Decides what a spoken or typed sentence means. Pure function, no browser calls. */
(function (g) {
  'use strict';
  var THEMES = (g.LAUNCHER_THEME_IDS || ['slate', 'aurora', 'sunset', 'ocean', 'neon', 'midnight', 'forest', 'plum', 'ember']).slice();
  function intent(raw) {
    var s = String(raw || '').toLowerCase().replace(/[?.!,]+/g, ' ').replace(/\s+/g, ' ').trim();
    var m;
    if (!s) return null;
    var howto = /^(how (do|can|to|should|would|come)|why|explain|tell me how)\b/.test(s);
    if (!howto && !/^(open|go to|launch|take me to)\b/.test(s)) {
      if (/\b(what|which)\b.*\bfiles\b|\bmy files\b|\b(clean ?up|tidy|declutter)\b.*\b(files|downloads|folder|storage)\b|\b(unnecessary|useless|junk|duplicate|old|big|large|unneeded) files\b|\b(free up|how much)\b.*\b(space|storage|disk)\b|\bstorage\b.*\b(left|used|full)\b/.test(s)) return { k: 'files' };
      if (/\b(emails?|e-mails?|inbox|gmail|mail)\b/.test(s) && /\b(check|any|new|unread|read|summar\w*|digest|catch me up|latest|what|got|have)\b/.test(s)) {
        return { k: 'email', verb: /summar|digest|brief|catch me up/.test(s) ? 'summarize' : 'check' };
      }
    }
    var asking = /^(how (do|can|to|should|would|come)|why|explain|tell me|can you explain|what (is|are|does|do)|who|when did)\b/.test(s);
    if (/\b(what can you do|what do you do|help me|^help)\b/.test(s)) return { k: 'help' };
    if (/(performance|system|status) report|how('s| is) (my|the) (chromebook|laptop|computer|pc)|\b(ram|memory) (usage|report|status)\b|how much (ram|memory)|^(memory|ram)$/.test(s)) return { k: 'perf' };
    if (/\bweather\b|\btemperature\b|\bhow (hot|cold|warm)\b/.test(s)) return { k: 'weather' };
    if (/\bwhat time\b|\bthe time\b|\btime is it\b/.test(s)) return { k: 'time' };
    if (/\b(what|which)\b.*\b(date|day)\b|\btoday'?s date\b/.test(s)) return { k: 'date' };
    if (asking) return null;
    if (/\b(close|remove|get rid of)\b.*\b(duplicate|duplicates|dupes)\b/.test(s)) return { k: 'dupes' };
    if (/\b(free up|clear|save|reclaim)\b.*\b(memory|ram)\b|\bsuspend\b.*\btabs?\b/.test(s)) return { k: 'free' };
    if (/\bcode ?spaces?\b/.test(s)) {
      var verb = /\b(stop|shut ?down|turn off|pause)\b/.test(s) ? 'stop'
        : /\b(start|wake|turn on|resume|launch|boot)\b/.test(s) ? 'start' : 'list';
      return { k: 'codespace', verb: verb, text: s };
    }
    if (/\bdark mode\b/.test(s)) {
      var on = /\b(on|enable|activate)\b/.test(s), off = /\b(off|disable|deactivate)\b/.test(s);
      return { k: 'dark', value: on === off ? null : on };
    }
    if (/\b(theme|colou?r scheme)\b/.test(s)) {
      var found = null;
      THEMES.forEach(function (t) { if (s.indexOf(t) >= 0) found = t; });
      return { k: 'theme', value: found };
    }
    if ((m = /^(?:please )?(?:open|go to|launch|take me to)\s+(.+)$/.exec(s))) return { k: 'open', what: m[1] };
    if ((m = /^(?:please )?(?:search(?: for)?|google|look up|look for)\s+(.+)$/.exec(s))) return { k: 'search', what: m[1] };
    return null;
  }
  g.assistantIntent = intent;
  g.assistantThemes = THEMES;
  if (typeof module !== 'undefined') module.exports = { intent: intent };
})(typeof window !== 'undefined' ? window : globalThis);
