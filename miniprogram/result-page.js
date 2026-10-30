const { loadDailySample } = require('./sample-source');

const LABEL_COLORS = ['#d53939', '#2461d9', '#128247', '#8734d0'];

/**
 * Result-page boundary: the data source can be replaced without changing UI actions.
 * @param {import('./types').SampleSource} source
 * @returns {WechatMiniprogram.Component.Options<import('./types').ResultData, {}, import('./types').ResultMethods, []>}
 */
function createResultPage(source = loadDailySample) {
  return {
    data: { photoSrc: '', labels: [], selected: null },
    methods: {
      onCloseCard() {
        this.setData({ selected: null });
      },
      onLabelTap(event) {
        const selected = this.data.labels.find((label) => label.id === event.currentTarget.dataset.id);
        if (selected) this.setData({ selected });
      },
    },
    lifetimes: {
      attached() {
        source().then((sample) => {
          const labels = sample.objects.map((object, index) => ({
            id: `${sample.id}:${index}`,
            english: object.name_en,
            chinese: object.name_zh,
            description: object.description,
            color: LABEL_COLORS[index % LABEL_COLORS.length],
            x: (object.bbox[0] + object.bbox[2]) / 20,
            y: (object.bbox[1] + object.bbox[3]) / 20,
            nearRightEdge: (object.bbox[0] + object.bbox[2]) / 2 > 900,
          }));
          this.setData({ photoSrc: sample.photoSrc, labels });
        });
      },
    },
  };
}

module.exports = { createResultPage };
