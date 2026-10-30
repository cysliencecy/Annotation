const path = require('node:path');

// Both native-page suites keep behavioral assertions running after one screenshot
// failure, then fail explicitly. A capture failure never counts as visual evidence.
function createScreenshotRecorder(mini, directory) {
  let failure;
  return {
    async capture(filename) {
      if (failure) return;
      let timer;
      try {
        await Promise.race([
          mini.screenshot({ path: path.join(directory, filename) }),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('微信截图 15 秒内未返回；布局测量已保存，视觉验收未通过')), 15000); }),
        ]);
      } catch (error) { failure = error; }
      finally { clearTimeout(timer); }
    },
    assertComplete() {
      if (failure) throw failure;
    },
  };
}

module.exports = { createScreenshotRecorder };
