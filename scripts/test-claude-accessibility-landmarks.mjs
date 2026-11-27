import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('new-tab-launcher/claude-app.html','utf8');
const css=fs.readFileSync('new-tab-launcher/claude-app.css','utf8');

assert.match(html,/<a class="cc-skip-link" href="#mainWorkspace">Skip to workspace<\/a>/,'skip link must target the workspace');
assert.match(html,/<main class="main" id="mainWorkspace" tabindex="-1" aria-label="AI development workspace">/,'workspace must expose a focusable main landmark');
assert.match(html,/<h1 class="cc-sr-only">AI Development Workspace<\/h1>/,'page needs a single visually hidden top-level heading');
assert.match(html,/<\/main>\s*<section class="panel" id="chatPanel">/,'main landmark must close before chat panel');
assert.match(css,/\.cc-skip-link:focus\s*\{[^}]*transform:translateY\(0\)/,'skip link must become visible when focused');
assert.match(css,/\.cc-sr-only\s*\{[^}]*clip:rect\(0,0,0,0\)/,'hidden heading must remain visually hidden');
console.log('Accessibility landmark/skip-link checks passed.');
