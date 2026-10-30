const daily = require('./fixtures/daily1-v2');

/**
 * Only this known photo is paired with this historical result.
 * @type {import('./types').SampleSource}
 */
function loadDailySample() {
  return Promise.resolve({
    id: 'daily1-v2',
    photoSrc: '/assets/daily1.jpg',
    objects: daily.objects,
  });
}

module.exports = { loadDailySample };
