const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const automator = require('miniprogram-automator');
const expectedViewport = Number(process.env.WECHAT_VIEWPORT || 390);

// Opt-in: connect to the actual local WeChat DevTools started in automation mode.
test(`微信开发者工具：${expectedViewport}px 装载、选词、切换、关闭与原图比例`, { timeout: 60000 }, async (t) => {
  assert.ok([375, 390].includes(expectedViewport), 'WECHAT_VIEWPORT 只支持规格约定的 375 或 390');
  // Separate CLI startup avoids Node 23's restriction on spawning .bat directly.
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9420' });
  t.after(() => mini.disconnect());
  const page = await mini.reLaunch('/pages/result/index');
  assert.ok(page);
  await page.waitFor('.word-label');
  const labels = await page.$$('.word-label');
  assert.deepEqual(await Promise.all(labels.map((label) => label.text())), ['plastic cup', 'glass', 'napkin', 'fork']);
  const evidenceRoot = path.resolve(__dirname, '../.scratch/prototype-visual-fidelity/evidence');
  const evidenceDir = expectedViewport === 390 ? evidenceRoot : path.join(evidenceRoot, String(expectedViewport));
  fs.mkdirSync(evidenceDir, { recursive: true });
  // getWindowInfo avoids the deprecated getSystemInfoSync automation bridge.
  const system = await mini.evaluate(() => wx.getWindowInfo());
  assert.equal(system.windowWidth, expectedViewport, '实际微信视口必须与验收目标一致，不能以环境变量伪造设备尺寸');
  let screenshotFailure;
  async function saveScreenshot(filename) {
    // After one capture failure, continue the behavioral checks but do not retry.
    if (screenshotFailure) return;
    let screenshotTimer;
    try {
      await Promise.race([
        mini.screenshot({ path: path.join(evidenceDir, filename) }),
        new Promise((_, reject) => { screenshotTimer = setTimeout(() => reject(new Error('微信截图 15 秒内未返回；布局测量已保存，视觉验收未通过')), 15000); }),
      ]);
    } catch (error) { screenshotFailure = error; }
    finally { clearTimeout(screenshotTimer); }
  }
  async function capture(state, cardSelector) {
    const card = await page.$(cardSelector);
    const image = await page.$('.photo');
    const metrics = {
      viewportWidth: system.windowWidth,
      pixelRatio: system.pixelRatio,
      photo: { ...await image.offset(), ...await image.size() },
      card: { ...await card.offset(), ...await card.size(), background: await card.style('background-color'), border: await card.style('border-top-color') },
      labels: await Promise.all(labels.map(async label => ({
        text: await label.text(), ...await label.offset(), ...await label.size(),
        fontSize: await label.style('font-size'), lineHeight: await label.style('line-height'),
        color: await label.style('color'), background: await label.style('background-color'),
      }))),
    };
    fs.writeFileSync(path.join(evidenceDir, `daily1-${state}.json`), JSON.stringify(metrics, null, 2));
    await saveScreenshot(`daily1-${state}.png`);
    return metrics;
  }
  const initial = await capture('default', '.card-placeholder');
  assert.ok(Math.abs(Number(initial.photo.width) - (system.windowWidth - 40)) <= 2, '照片左右各保留 20px');
  assert.ok(Math.abs(Number(initial.photo.left) - 20) <= 2);
  assert.equal(initial.labels.every(label => label.fontSize === '12px'), true, '标签字号沿用原型');
  assert.ok(Number(initial.labels[3].width) < Number(initial.labels[0].width), '标签根据英文长度收缩');
  assert.ok(Number(initial.labels[0].width) < 110, '不允许微信默认长条标签');
  for (const label of initial.labels) {
    assert.ok(Number(label.left) >= Number(initial.photo.left) - 1, '标签左侧不能被图片裁切');
    assert.ok(Number(label.left) + Number(label.width) <= Number(initial.photo.left) + Number(initial.photo.width) + 1, '标签右侧不能被图片裁切');
  }
  assert.ok(Math.abs(Number(initial.card.height) - 148) <= 2, '引导卡高度与原型一致');
  assert.match(initial.card.background.replace(/\s/g, ''), /rgb\(246,246,246\)/);
  assert.equal((await page.$$('.leader')).length, 1);
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
    if (i === 0) {
      const selected = await capture('selected', '.meaning-card');
      assert.equal(selected.card.background, initial.card.background);
      assert.equal(selected.card.border, initial.card.border);
      const close = await page.$('.card-close');
      assert.equal(await close.text(), '×');
      assert.equal(Number((await close.size()).width), 36);
      assert.equal(await (await page.$('.card-english')).style('font-size'), '17px');
      for (let j = 0; j < labels.length; j++) assert.ok(Math.abs(Number(selected.labels[j].width) - Number(initial.labels[j].width)) <= 1);
    }
  }
  if (expectedViewport === 375) {
    await mini.pageScrollTo(10000);
    await page.waitFor(200);
    const description = await page.$('.card-description');
    const descriptionTop = Number((await description.offset()).top);
    const closeTop = Number((await (await page.$('.card-close')).offset()).top);
    assert.ok(descriptionTop >= 0 && descriptionTop + Number((await description.size()).height) <= system.windowHeight + 2, '小屏滚动后解释应完整可读');
    assert.ok(closeTop >= 0 && closeTop + 36 <= system.windowHeight + 2, '小屏滚动后关闭按钮应可见');
    await saveScreenshot('daily1-card-scrolled.png');
  }
  await (await page.$('.card-close')).tap();
  await mini.pageScrollTo(0);
  await page.waitFor(200);
  assert.equal((await page.$$('.meaning-card')).length, 0);
  assert.equal((await page.$$('.word-label--selected')).length, 0);
  assert.equal((await page.$$('.word-label')).length, 4);
  const closed = await capture('closed', '.card-placeholder');
  assert.deepEqual(closed.labels, initial.labels);
  if (screenshotFailure) throw screenshotFailure;
});
