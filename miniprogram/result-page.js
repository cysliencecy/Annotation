const { loadSample } = require('./sample-source');

const LABEL_COLORS = ['#d53939', '#2461d9', '#128247', '#8734d0', '#a75610', '#a92975', '#087d8b'];

/**
 * Result-page boundary: the data source can be replaced without changing UI actions.
 * @param {import('./types').SampleSource} source
 * @returns {WechatMiniprogram.Component.Options<import('./types').ResultData, {}, import('./types').ResultMethods, []>}
 */
function createResultPage(source = loadSample) {
  return {
    data: { photoSrc: '', labels: [], selected: null, sampleId: 'daily1' },
    methods: {
      onCollapseLabel() {
        const selected = this.data.selected;
        if (!selected) return;
        this.setData({
          labels: this.data.labels.map(label => label.id === selected.id ? { ...label, expanded: false } : label),
          selected: null,
        });
      },
      onDotTap(event) {
        const id = event.currentTarget.dataset.id;
        this.setData({ labels: this.data.labels.map(label => label.id === id ? { ...label, expanded: true } : label) });
      },
      onSwitchSample() {
        this.loadSample(this.data.sampleId === 'daily1' ? 'flower1' : 'daily1');
      },
      onCloseCard() {
        this.setData({ selected: null });
      },
      onLabelTap(event) {
        const selected = this.data.labels.find((label) => label.id === event.currentTarget.dataset.id);
        if (selected && selected.expanded) this.setData({ selected });
      },
      loadSample(sampleId) {
        source(sampleId).then((sample) => {
          const labels = sample.objects.map((object, index) => ({
            id: `${sample.id}:${index}`,
            english: object.name_en,
            chinese: object.name_zh,
            description: object.description || '',
            color: LABEL_COLORS[index % LABEL_COLORS.length],
            x: (object.bbox[0] + object.bbox[2]) / 20,
            y: (object.bbox[1] + object.bbox[3]) / 20,
            nearRightEdge: (object.bbox[0] + object.bbox[2]) / 2 > 900,
            // Presentation offset from the daily1 preview; never replaces raw coordinates.
            offsetAbove: sample.id === 'daily1-v2' && index === 3,
            expanded: index < 5,
          }));
          this.setData({ photoSrc: sample.photoSrc, labels, selected: null, sampleId });
        });
      },
    },
    lifetimes: {
      attached() {
        this.loadSample('daily1');
      },
    },
  };
}

module.exports = { createResultPage };
