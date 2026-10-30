const daily = require('./fixtures/daily1-v2');
const flower = require('./fixtures/flower1-v2');

/**
 * Only the two known demo photos are paired with their historical results.
 * @type {import('./types').SampleSource}
 */
function loadSample(sampleId) {
  const isFlower = sampleId === 'flower1';
  return Promise.resolve({
    id: isFlower ? 'flower1-v2' : 'daily1-v2',
    photoSrc: isFlower ? '/assets/flower1.jpg' : '/assets/daily1.jpg',
    objects: isFlower ? flower.objects : daily.objects,
  });
}

module.exports = { loadSample };
