<template>
  <div id="app">
    <div
      class="line"
      v-bind:class="{active: activeId === index}"
      v-for="(request, index) in requests"
      v-bind:key="request.sequenceid"
      v-on:click="openDetail(request, index)"
    >
      <div>{{request.time}}</div>
      <div>{{request.topic}}</div>
    </div>
    <div v-if="activeId !== -1" class="detail">
      <div class="close" v-on:click="closeDetail">x</div>
      <div><b>topic:</b><span>{{requests[activeId].topic}}</span></div>
      <div><b>sequenceid:</b><span>{{requests[activeId].sequenceid}}</span></div>
      <div><b>timeout:</b><span>{{requests[activeId].timeout}} ms</span></div>
      <div><b>body:</b><pre>{{JSON.stringify(requests[activeId].body, '', 2)}}</pre></div>
      <div><b>response:</b><pre>{{JSON.stringify(requests[activeId].resp, '', 2)}}</pre></div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'app',
  data: () => {
    return {
      activeId: -1,
      requests: [
        {time: '19:00:30', sequenceid: '1', topic: '/alilang/abc', body: {data1: '1', data2: '123'}, timeout: 400, resp: {result: true, url: 'http://absdc'}},
        {time: '19:02:40', sequenceid: '2', topic: '/alilang/abc', body: {data1: '2', data2: '123'}, timeout: 400},
      ]
    }
  },
  methods: {
    openDetail: function(item, index){
      this.activeId = index;
    },
    closeDetail: function() {
      this.activeId = -1;
    }
  },
  mounted() {
    window.chrome.runtime && window.chrome.runtime.onMessage && window.chrome.runtime.onMessage.addListener(msg => {
      if (msg.identify !== 'ipcwork') return;
      if (msg.cmd === 'load') {
        document.body.innerHTML='';
        return;
      }
      this.requests.push({
        time: moment().format('HH:mm:ss'),
        ...msg.payload[0]
      });
    })
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowUp' && this.activeId - 1 >= 0) {
        this.activeId -= 1;
      } else if (e.key === 'ArrowDown' &&  this.activeId + 1 < this.requests.length) {
        this.activeId += 1;
      }
    })
  }
}
</script>

<style lang="less">
* { margin: 0; padding: 0;}
.line {
  padding-left: 12px;
  &:nth-child(odd) {background-color: #fff;}
  &:nth-child(even) {background-color: #F5F5F5;}
  &:hover {background-color: rgb(227, 240, 253);cursor: pointer;}
  &.active {background-color: rgb(189, 220, 252)}
  >* {
    display: inline-block;
    margin-right: 12px;
  }
}
.detail {
  position: fixed;
  top: 0;
  right: 0;
  width: calc(100% - 300px);
  background: #fff;
  height: 100%;
  border-left: 1px solid #eee;
  padding: 24px;
  box-sizing: border-box;
  .close {
    position: absolute;
    top: 0;
    left: 0;
    width: 1.5em;
    line-height: 1.5em;
    font-weight: bolder;
    text-align: center;
    color: #666;
    cursor: pointer;
  }
  b {
    margin-right: 12px;
  }
}
</style>
