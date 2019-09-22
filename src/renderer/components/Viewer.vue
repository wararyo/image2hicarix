<template>
<section>
  <canvas id="preview-canvas" ref="previewCanvas" width="8" height="8"></canvas>
</section>
</template>

<script>
const Intervals = [3200,2900,2500,2200,1900,1500,1200,900,750,500,350,250,120,66,27,16];
export default {
  props: ["images","speed"],
  data: function(){
    return {
      canvas,
      ctx
    }
  },
  mounted() {
    this.canvas = this.$refs.previewCanvas;
    this.ctx = this.canvas.getContext('2d');
    this.update();
  },
  methods: {
    async update() {
      const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
      for(;;) {
        for(var image of this.images) {
          this.ctx.drawImage(image,0,0);
          await sleep(Intervals[this.speed]);
        }
        if(this.images.length === 0 ) await sleep(1000);
      }
    }
  }
}
</script>

<style lang="scss" scoped>

</style>