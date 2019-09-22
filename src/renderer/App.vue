<template>
  <div id="app">
    <h1>Image2Hicarix</h1>
    <section>
      <h2>Settings</h2>
      <b-field label="Directory" label-position="on-border">
          <b-input v-model="directory" placeholder="/path/to/your/directory/of/images/" expanded></b-input>
          <p class="control">
              <b-button class="button is-primary" @click="browse">Browse</b-button>
          </p>
      </b-field>
      <b-button type="is-primary" @click="loadImages">Load</b-button>
      <b-field label="Speed">
        <b-numberinput v-model="playSpeed" min="0" max="15" controls-position="compact">
        </b-numberinput>
      </b-field>
    </section>
    <div style="display:flex;justify-content:space-around;">
      <section>
        <h2>Preview</h2>
        <viewer ref="viewer" :images="images" :speed="playSpeed" :isPlaying="isPlaying" />
        <div class="field">
          <b-switch v-model="isPlaying">Play</b-switch>
        </div>
      </section>
      <section>
        <h2>Writer</h2>
        <canvas id="writer-canvas" ref="writerCanvas" width="2" height="2"></canvas>
        <p>{{Math.floor(progress*100+0.5)}}%</p>
        <b-button type="is-primary" @click="write">Write</b-button>
      </section>
    </div>
  </div>
</template>

<script>
  import Viewer from '@/components/Viewer'
  const fs = require("fs");
  const path = require("path");
  const remote = require('electron').remote;
  const Dialog = remote.dialog;
  const browserWindow = remote.BrowserWindow;

  export default {
    name: 'image2hicarix',
    components: {
      Viewer
    },
    data: function() {
      return {
        clk: 1,
        d1: 1,
        d2: 0,
        writerCtx: null,
        playSpeed: 11,
        progress: 0,
        directory: "",
        images: [],
        isPlaying: false,
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
          image.onload = function(){resolve(image)};
        });
      },
      async loadImages() {
        this.images = [];
        let fileList = fs.readdirSync(this.directory);
        for(let file of fileList) {
          this.images.push(await this.loadImage(path.join(this.directory,file)));
        }
        this.isPlaying = true;
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
      browse() {
        Dialog.showOpenDialog(null, {
            properties: ['openDirectory'],
            title: 'Select directory of image sequence',
            defaultPath: this.directory === "" ? "." : path.join(this.directory,"../")
        }, (folderNames) => {
            this.directory = folderNames[0];
        });
      },
      async write() {
        //header
        let data = [1,0,0,1,1,0];
        //page length
        let pageLength = this.images.length;
        for(let i = 7;i>=0;i--) data.push((pageLength >> i) & 0b1);
        //play speed (negative)
        for(let i = 3;i>=0;i--) data.push(((this.playSpeed >> i) & 0b1) > 0?0:1);
        //reserved
        data.push(0,0,0,0);
        //content
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext("2d");
        for(let image of this.images) {
          ctx.drawImage(image,0,0);
          let imagedata = ctx.getImageData(0,0,8,8);
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

        this.isPlaying = false;

        //start writing
        const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
        for(let i = 1;i<data.length/2;i++) {//最初の2ビットは初期状態なのでスキップ
          this.d1 = data[i*2];
          this.d2 = data[i*2+1];
          this.clk = this.clk === 0?1:0;//クロックは最後に書く
          await sleep(66);
          this.progress = i / data.length * 2;
          this.$refs.viewer.currentFrame = Math.floor(this.images.length * (i / data.length * 2));
        }
      }
    },
    mounted() {
      this.setWriterBits();
    }
  }
</script>

<style lang="scss">
body {
  background-color: #FAFAFA;
  overflow: hidden;

  &::-webkit-scrollbar {
    display: none;
  }
}
#app {
  height: 100vh;
  > section {
    margin: 24px;
  }
  h1 {
    margin: 24px;
    font-weight: bold;
    font-size: 2rem;
  }
  h2 {
    font-weight: bold;
    font-size: 1.5rem;
    margin-bottom: 1em;
  }
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
