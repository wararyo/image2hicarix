<template>
<section>
  <canvas id="preview-canvas" ref="previewCanvas" width="8" height="8"></canvas>
</section>
</template>

<script>
const Intervals = [3200,2900,2500,2200,1900,1500,1200,900,750,500,350,250,120,66,27,16];
export default {
  props: ["images","speed","isPlaying"],
  data: function(){
    return {
      canvas: null,
      ctx: null,
      currentFrame: 0,
    }
  },
  watch: {
    currentFrame(val,oldval) {
      if(this.images.length === 0) return;
      while(val >= this.images.length) val -= this.images.length;
      while(val < 0) val += this.images.length;
      if(val !== oldval) this.ctx.drawImage(this.images[val],0,0);
    },
    isPlaying(val,oldval) {
      if(val && !oldval) this.update(); 
    },
    images() {
      this.currentFrame = 0;
      if(this.images.length !== 0) this.ctx.drawImage(this.images[0],0,0);
    }
  },
  mounted() {
    this.canvas = this.$refs.previewCanvas;
    this.ctx = this.canvas.getContext('2d');
    console.log(this.isPlaying);
    this.update();
  },
  methods: {
    async update() {
      const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
      while(this.isPlaying) {
        this.currentFrame++;
        await sleep(Intervals[this.speed]);
      }
    }
  }
}
</script>

<style lang="scss" scoped>

</style>