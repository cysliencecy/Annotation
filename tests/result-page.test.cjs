const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body></body></html>');
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent']) {
  global[name] = name === 'window' ? dom.window : name === 'document' ? dom.window.document : dom.window[name];
}
const simulate = require('miniprogram-simulate');

async function openPage(t, source) {
  const pagePath = path.resolve(__dirname, '../miniprogram/pages/result/index');
  const id = source ? simulate.load({
    ...require('../miniprogram/result-page').createResultPage(source),
    template: fs.readFileSync(`${pagePath}.wxml`, 'utf8'),
  }) : simulate.load(pagePath, { compiler: 'simulate' });
  const page = simulate.render(id);
  const host = document.createElement('result-page-host');
  document.body.appendChild(host);
  page.attach(host);
  t.after(() => { page.detach(); host.remove(); });
  await simulate.sleep(20);
  return page;
}

test('打开日常演示，完整展示四个原始英文和明确的预览说明', async (t) => {
  const page = await openPage(t);
  assert.deepEqual(page.querySelectorAll('.word-label').map((label) => label.dom.textContent.trim()), [
    'plastic cup', 'glass', 'napkin', 'fork',
  ]);
  assert.match(page.dom.textContent, /演示/);
  assert.match(page.dom.textContent, /尚未验证/);
  assert.match(page.dom.textContent, /清晰、彼此分开/);
  assert.equal(Boolean(page.querySelector('.meaning-card')), false);
  assert.ok(page.querySelector('.photo'));
  // The simulator cannot verify image decoding; preserve the original photo bytes.
  const photo = fs.readFileSync(path.resolve(__dirname, '../miniprogram/assets/daily1.jpg'));
  assert.equal(createHash('sha256').update(photo).digest('hex'), '4ff06acc88f5201e31ffb0549adb0728e18d6fb986c821b89de8f2f4e8c194e6');
});

test('外部数据中的同名记录可独立选择，操作不改写输入或原始文件', async (t) => {
  const original = fs.readFileSync(path.resolve(__dirname, '../miniprogram/fixtures/daily1-v2.json'));
  const objects = [
    { name_en: 'cup', name_zh: '红杯', description: '第一只杯子。', bbox: [100, 100, 300, 300] },
    { name_en: 'cup', name_zh: '蓝杯', description: '第二只杯子。', bbox: [600, 600, 800, 800] },
  ];
  const before = JSON.stringify(objects);
  objects.forEach((object) => { Object.freeze(object.bbox); Object.freeze(object); });
  Object.freeze(objects);
  const page = await openPage(t, async () => ({ id: 'duplicates', photoSrc: '/assets/daily1.jpg', objects }));
  const labels = page.querySelectorAll('.word-label');
  assert.equal(labels.length, 2);
  assert.notEqual(labels[0].dom.getAttribute('data-id'), labels[1].dom.getAttribute('data-id'));
  for (let i = 0; i < labels.length; i++) {
    labels[i].dispatchEvent('tap');
    await simulate.sleep(5);
    assert.match(page.querySelector('.meaning-card').dom.textContent, new RegExp(objects[i].name_zh));
    assert.match(page.querySelector('.meaning-card').dom.textContent, new RegExp(objects[i].description));
  }
  page.querySelector('.card-close').dispatchEvent('tap');
  await simulate.sleep(5);
  assert.equal(JSON.stringify(objects), before);
  assert.deepEqual(fs.readFileSync(path.resolve(__dirname, '../miniprogram/fixtures/daily1-v2.json')), original);
  // Fingerprint captured from the user's original results/daily/daily1-v2.json.
  assert.equal(createHash('sha256').update(original).digest('hex'), '61a47a7e8564daa265518b2c1a0b978340d1e447f82370c817f48038e6ed5dd5');
});

test('点击标签显示对应词卡和同色选中样式', async (t) => {
  const page = await openPage(t);
  page.querySelectorAll('.word-label')[0].dispatchEvent('tap');
  await simulate.sleep(10);
  const card = page.querySelector('.meaning-card');
  assert.ok(card);
  assert.match(card.dom.textContent, /plastic cup/);
  assert.match(card.dom.textContent, /塑料杯/);
  assert.match(card.dom.textContent, /用于盛装饮料的塑料容器。/);
  const selected = page.querySelectorAll('.word-label--selected');
  assert.equal(selected.length, 1);
  assert.match(selected[0].dom.getAttribute('style'), /color:\s*#fff/);
  assert.match(selected[0].dom.getAttribute('style'), /background:\s*#d53939/);
  assert.doesNotMatch(page.dom.textContent, /√/);
});

test('切换仅保留一张词卡，关闭恢复四个标签的原始颜色', async (t) => {
  const page = await openPage(t);
  const labels = page.querySelectorAll('.word-label');
  const defaults = labels.map((label) => label.dom.getAttribute('style'));
  for (let i = 0; i < labels.length; i++) {
    labels[i].dispatchEvent('tap');
    await simulate.sleep(5);
    assert.equal(page.querySelectorAll('.meaning-card').length, 1);
    assert.equal(page.querySelectorAll('.word-label--selected').length, 1);
    assert.match(page.querySelector('.meaning-card').dom.textContent, new RegExp(['塑料杯', '玻璃杯', '餐巾纸', '叉子'][i]));
  }
  page.querySelector('.card-close').dispatchEvent('tap');
  await simulate.sleep(5);
  assert.equal(Boolean(page.querySelector('.meaning-card')), false);
  assert.equal(page.querySelectorAll('.word-label--selected').length, 0);
  assert.deepEqual(page.querySelectorAll('.word-label').map((label) => label.dom.getAttribute('style')), defaults);
});
