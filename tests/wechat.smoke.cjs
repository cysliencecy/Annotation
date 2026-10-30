const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const automator = require('miniprogram-automator');

// Opt-in: connect to the actual local WeChat DevTools started in automation mode.
test('微信开发者工具：装载、选词、切换、关闭与原图比例', { timeout: 60000 }, async (t) => {
  // Separate CLI startup avoids Node 23's restriction on spawning .bat directly.
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9420' });
  t.after(() => mini.disconnect());
  const page = await mini.reLaunch('/pages/result/index');
  assert.ok(page);
  await page.waitFor('.word-label');
  const labels = await page.$$('.word-label');
  assert.deepEqual(await Promise.all(labels.map((label) => label.text())), ['plastic cup', 'glass', 'napkin', 'fork']);
  const photo = await page.$('.photo');
  assert.ok(photo);
  assert.equal(await photo.attribute('mode'), 'widthFix');
  const original = await mini.callWxMethod('getImageInfo', { src: '/assets/daily1.jpg' });
  const size = await photo.size();
  assert.ok(Math.abs(size.height / size.width - original.height / original.width) < 0.03, '图片显示比例应与解码后的原图一致');
  const expected = require('../miniprogram/fixtures/daily1-v2.json').objects;
  for (let i = 0; i < labels.length; i++) {
    await labels[i].tap();
    await page.waitFor('.meaning-card');
    assert.equal((await page.$$('.meaning-card')).length, 1);
    assert.equal((await page.$$('.word-label--selected')).length, 1);
    assert.equal(await (await page.$('.card-english')).text(), expected[i].name_en);
    assert.equal(await (await page.$('.card-chinese')).text(), expected[i].name_zh);
    assert.equal(await (await page.$('.card-description')).text(), expected[i].description);
  }
  fs.mkdirSync(path.resolve(__dirname, '../.artifacts'), { recursive: true });
  await mini.screenshot({ path: path.resolve(__dirname, '../.artifacts/daily1-selected.png') });
  await (await page.$('.card-close')).tap();
  await page.waitFor(200);
  assert.equal((await page.$$('.meaning-card')).length, 0);
  assert.equal((await page.$$('.word-label--selected')).length, 0);
  assert.equal((await page.$$('.word-label')).length, 4);
  await mini.screenshot({ path: path.resolve(__dirname, '../.artifacts/daily1-default.png') });
});
