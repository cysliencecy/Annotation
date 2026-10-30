const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const automator = require('miniprogram-automator');
const { createScreenshotRecorder } = require('./wechat-screenshots.cjs');

test('微信花束：五标签两圆点、连续展开、关闭、全部收起与重开', { timeout: 120000 }, async t => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9420' });
  t.after(() => mini.disconnect());
  const page = await mini.reLaunch('/pages/result/index');
  await page.waitFor('.choose-sample');
  const viewport = await mini.evaluate(() => wx.getWindowInfo());
  assert.ok([375, 390].includes(viewport.windowWidth));
  const directory = path.resolve(__dirname, `../.scratch/photo-exploration-frontend/evidence/02-${viewport.windowWidth}`);
  fs.mkdirSync(directory, { recursive: true });
  const screenshots = createScreenshotRecorder(mini, directory);
  const scroll = async top => {
    await mini.callWxMethod('pageScrollTo', { scrollTop: top, duration: 0 });
    await page.waitFor(350);
  };
  const tap = async element => {
    assert.ok(element, '操作目标必须出现在真实页面中');
    await element.tap();
    await page.waitFor(350);
  };
  const word = async english => {
    for (const label of await page.$$('.word-label')) if (await label.text() === english) return label;
    assert.fail(`未找到英文标签 ${english}`);
  };
  const counts = async (labels, dots) => {
    // Wait for the native setData/render bridge, not a private page method.
    for (let i = 0; i < 10; i++) {
      if ((await page.$$('.word-label')).length === labels && (await page.$$('.discovery-dot')).length === dots) return;
      await page.waitFor(50);
    }
    assert.equal((await page.$$('.word-label')).length, labels);
    assert.equal((await page.$$('.discovery-dot')).length, dots);
  };
  const card = async () => {
    const title = await page.$('.card-english');
    return title ? title.text() : null;
  };
  async function capture(state) {
    const metrics = {
      viewportWidth: viewport.windowWidth,
      card: await card(),
      labels: await Promise.all((await page.$$('.word-label')).map(async label => ({
        english: await label.text(), id: await label.attribute('data-id'),
        color: await label.style('border-top-color'), ...await label.size(), ...await label.offset(),
      }))),
      dots: (await page.$$('.discovery-dot')).length,
    };
    fs.writeFileSync(path.join(directory, `${state}.json`), JSON.stringify(metrics, null, 2));
    await screenshots.capture(`${state}.png`);
    return metrics;
  }
  await scroll(10000);
  await tap(await page.$('.choose-sample'));
  await page.waitFor('.discovery-dot');
  await scroll(0);
  await page.waitFor(200);
  await counts(5, 2);
  const initial = await capture('flower-initial');
  assert.deepEqual(initial.labels.map(label => label.english), ['Delphinium', 'Orchid', 'Carnation', 'Alstroemeria', 'Allium']);
  assert.equal(initial.card, null);
  assert.match(await (await page.$('.provenance-note')).text(), /原始结果未提供简短解释/);
  await tap(await page.$('.discovery-dot'));
  await counts(6, 1);
  assert.equal(await card(), null);
  await tap(await word('Dahlia'));
  assert.equal(await card(), 'Dahlia');
  await tap(await page.$('.discovery-dot'));
  await counts(7, 0);
  assert.equal(await card(), 'Dahlia');
  await tap(await word('Rose'));
  assert.equal(await card(), 'Rose');
  assert.equal(await (await page.$('.card-chinese')).text(), '玫瑰');
  assert.equal(Boolean(await page.$('.card-description')), false);
  await scroll(10000);
  await capture('rose-card');
  await tap(await page.$('.card-close'));
  await counts(7, 0);
  assert.equal(await card(), null);
  await scroll(0);
  const expanded = await capture('seven-labels');
  await tap(await word('Rose'));
  await page.waitFor('.card-collapse');
  await page.waitFor(120);
  await scroll(10000);
  await tap(await page.$('.card-collapse'));
  await counts(6, 1);
  assert.equal(await card(), null);
  await scroll(0);
  await tap(await page.$('.discovery-dot'));
  await counts(7, 0);
  assert.equal(await card(), null);
  for (let i = 0; i < 7; i++) {
    await scroll(0);
    await tap(await page.$('.word-label'));
    await page.waitFor('.card-collapse');
    await scroll(10000);
    await tap(await page.$('.card-collapse'));
    await counts(6 - i, i + 1);
  }
  await scroll(0);
  await capture('all-collapsed');
  for (let i = 0; i < 7; i++) {
    await tap(await page.$('.discovery-dot'));
    await counts(i + 1, 6 - i);
    assert.equal(await card(), null);
  }
  const restored = await capture('all-reopened');
  assert.deepEqual(restored.labels, expanded.labels);
  screenshots.assertComplete();
});
