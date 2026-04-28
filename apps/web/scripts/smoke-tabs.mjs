import fs from 'node:fs';
import path from 'node:path';

const webRoot = path.resolve(process.cwd());
const indexPath = path.join(webRoot, 'index.html');
const appPath = path.join(webRoot, 'src', 'app.js');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const appJs = fs.readFileSync(appPath, 'utf8');

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

const tabs = ['collaboration', 'projects', 'qualitative', 'quantitative', 'status'];

for (const tab of tabs) {
  const tabButtonId = `tab-btn-${tab}`;
  const panelId = `tab-${tab}`;
  check(
    indexHtml.includes(`id="${tabButtonId}"`) &&
      indexHtml.includes(`aria-controls="${panelId}"`) &&
      indexHtml.includes('role="tab"'),
    `Missing tab semantics for button "${tabButtonId}".`
  );
  check(
    indexHtml.includes(`id="${panelId}"`) &&
      indexHtml.includes(`aria-labelledby="${tabButtonId}"`) &&
      indexHtml.includes('role="tabpanel"'),
    `Missing panel semantics for "${panelId}".`
  );
}

check(
  indexHtml.includes('id="tab-collaboration" role="tabpanel"') &&
    indexHtml.includes('id="tab-collaboration" role="tabpanel" aria-labelledby="tab-btn-collaboration" aria-hidden="false" tabindex="0"'),
  'Collaboration tab is not marked as the active initial tabpanel.'
);

for (const tab of ['projects', 'qualitative', 'quantitative', 'status']) {
  check(
    indexHtml.includes(`id="tab-${tab}" role="tabpanel`) && indexHtml.includes(`id="tab-${tab}" role="tabpanel"`) && indexHtml.includes(' hidden'),
    `Non-active panel "tab-${tab}" should be hidden on first load.`
  );
}

check(appJs.includes("btn.setAttribute('aria-selected', isActive ? 'true' : 'false');"), 'Tab aria-selected state sync is missing.');
check(appJs.includes("panel.hidden = !isActive;"), 'Tab panel hidden state sync is missing.');
check(appJs.includes("event.key === 'ArrowRight'") && appJs.includes("event.key === 'ArrowLeft'"), 'Top-tab arrow-key navigation is missing.');
check(appJs.includes("event.key === 'Home'") && appJs.includes("event.key === 'End'"), 'Top-tab Home/End keyboard support is missing.');
check(appJs.includes("setAriaCurrent(button, isActive);"), 'Cross-menu aria-current sync is missing.');

check(
  appJs.includes('permissions.hasProject') && appJs.includes('Select a project first.'),
  'Project-gated (selected/unselected) guidance checks are missing in app logic.'
);
check(
  (indexHtml.match(/value="No project selected"/g) ?? []).length >= 5,
  'Expected unselected-project placeholders are missing from form fields.'
);

if (failures.length > 0) {
  console.error('Tab smoke failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Tab smoke passed (${tabs.length} tabs, accessibility + project-state guards validated).`);
