<template>
  <div id="app">
    <h1>Preview</h1>
    <canvas id="preview-canvas" ref="previewCanvas" width="8" height="8"></canvas>
    <h1>Writer</h1>
    <button @click="write">Write</button>
    <canvas id="writer-canvas" ref="writerCanvas" width="2" height="2"></canvas>
    {{Math.floor(progress*100)}}%
  </div>
</template>

<script>
  import LandingPage from '@/components/LandingPage'
  const fs = require("fs");
  const path = require("path");

  export default {
    name: 'image2hicarix',
    components: {
      LandingPage
    },
    data: function() {
      return {
        clk: 1,
        d1: 1,
        d2: 0,
        previewCtx: null,
        writerCtx: null,
        playSpeed: 11,
        progress: 0
      }
    },
    watch: {
      clk() {this.setWriterBits();},
      playSpeed(val) {
        if(val < 0) this.playSpeed = 0;
        else if(val > 15) this.playSpeed = 15;
      }
    },
    methods: {
      loadImage(filePath) {
        let $vue = this;
        return new Promise((resolve,reject) => {
          let image = new Image();
          const data = fs.readFileSync(filePath);
          const base64data = new Buffer(data).toString('base64');
          image.src = `data:image/${path.extname(filePath).substring(1)};base64,${base64data}`;
          image.onload = function(){$vue.previewCtx.drawImage(image,0,0,8,8);resolve()};
        });
      },
      setWriterBits() { //CLK変更で自動的に呼び出される
        let writerCanvas = this.$refs.writerCanvas;
        let ctx = writerCanvas.getContext('2d');
        ctx.fillStyle = (this.clk === 0)?"black":"white";
        ctx.fillRect(1,0,1,1);
        ctx.fillStyle = (this.d1 === 0)?"black":"white";
        ctx.fillRect(0,1,1,1);
        ctx.fillStyle = (this.d2 === 0)?"black":"white";
        ctx.fillRect(1,1,1,1);
      },
      async write() {
        let folderPath = "/mnt/d/Git/image2hicarix/static/Sequence/";
        let fileList = fs.readdirSync(folderPath);
        //header
        let data = [1,0,0,1,1,0];
        //page length
        let pageLength = fileList.length;
        for(let i = 7;i>=0;i--) data.push((pageLength >> i) & 0b1);
        //play speed
        for(let i = 3;i>=0;i--) data.push(((this.playSpeed >> i) & 0b1) > 0?0:1);
        //reserved
        data.push(0,0,0,0);
        //content
        for(let file of fileList) {
          await this.loadImage(path.join(folderPath,file));
          let imagedata = this.previewCtx.getImageData(0,0,8,8);
          for(let x = 0;x<8;x++) {
            for(let y = 7;y >= 0;y--) {
              let index = (y*8+x)*4;
              data.push((imagedata.data[index] > 127)?1:0);
            }
          }
        }
        //footer
        data.push(0,1,1,0);
        console.log(data);

        //start writing
        const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
        for(let i = 1;i<data.length/2;i++) {//最初の2ビットは初期状態なのでスキップ
          this.d1 = data[i*2];
          this.d2 = data[i*2+1];
          this.clk = this.clk === 0?1:0;//クロックは最後に書く
          await sleep(100);
          this.progress = i / data.length * 2;
        }
      }
    },
    mounted() {
      let canvas = this.$refs.previewCanvas;
      this.previewCtx = canvas.getContext('2d');
      this.setWriterBits();
    }
  }
</script>

<style lang="scss">
#app {
  padding: 16px;
}
#preview-canvas {
  width: 240px;
  height: 240px;
  image-rendering: pixelated;
  box-shadow: 0 3px 6px rgba(black,.3);
}
#writer-canvas {
  display: block;
  width: 240px;
  height: 240px;
  image-rendering: pixelated;
  box-shadow: 0 3px 6px rgba(black,.3);
}
</style>
