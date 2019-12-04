<template>
  <div id="app">
    <div class="head">
      <div class="clear" v-on:click="clear">clear</div>
      <div class="tabs">
        <div
          class="tab"
          v-for="(v, k) in lists"
          v-bind:key="k"
          v-bind:class="{active: select === k}"
          v-on:click="switchList(k)">
          {{k}}
        </div>
      </div>
    </div>

    <div
      class="line"
      v-bind:class="{active: activeId === index, err: request.success===false}"
      v-for="(request, index) in displayList"
      v-bind:key="request.sequenceId"
      v-on:click="openDetail(request, index)"
    >
      <div>{{request.time | second}}</div>
      <div>{{request.status || request.type}}</div>
      <div>{{request.topic}}</div>
      <div v-if="select==='all'">{{JSON.stringify(request)}}</div>
      <div v-if="select==='request'">{{JSON.stringify(request.body)}}</div>
    </div>

    <div v-if="activeId !== -1" class="detail">
      <div class="close" v-on:click="closeDetail">x</div>
      <div v-for="(v, k) in displayList[activeId]" v-bind:key="k">
        <b>{{k}}:</b>
        <span v-if="k==='time' || k==='timeRes'">{{v | milliSeconds}}</span>
        <pre v-else-if="v.constructor===Object || v.constructor===Array">{{JSON.stringify(v, '', 2)}}</pre>
        <span v-else>{{v}}</span>
      </div>
      <div><b>{{timeRes}}</b></div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'app',
  data: () => {
    return {
      select: 'request',
      activeId: -1,
      lists: {
        all: [
          // {time: '19:00:30', sequenceid: '1', topic: '/alilang/abc', body: {data1: '1', data2: '123'}, timeout: 400, resp: {result: true, url: 'http://absdc'}},
          // {time: '19:02:40', sequenceid: '2', topic: '/alilang/abc', body: {data1: '2', data2: '123'}, timeout: 400},
          // {time: '19:02:40', sequenceid: '2', topic: '/alilang/abc', body: {data1: '2', data2: '123'}, timeout: 400},
        ],
        request: [
          // {time: '19:00:30', sequenceid: '1', topic: '/alilang/abc', body: {data1: '1', data2: '123'}, timeout: 400, resp: {result: true, url: 'http://absdc'}},
          // {time: '19:02:40', sequenceid: '2', topic: '/alilang/abc', body: {data1: '2', data2: '123'}, timeout: 400},
        ],
      }
    }
  },
  computed: {
    displayList: function() {
      return this.lists[this.select]
    }
  },
  methods: {
    openDetail: function(item, index){
      this.activeId = index;
    },
    closeDetail: function() {
      this.activeId = -1;
    },
    clear: function() {
      this.lists[this.select] = [];
    },
    switchList: function(t) {
      this.select = t;
    }
  },
  filters: {
    second: function (date) {
      return moment(date).format('HH:mm:ss');
    },
    milliSeconds: function(date) {
      return moment(date).format('HH:mm:ss:SSS');
    }
  },
  mounted() {
    if (window.chrome.runtime && window.chrome.runtime.id) {
      var backgroundPageConnection = window.chrome.runtime.connect(window.chrome.runtime.id);
      backgroundPageConnection.onMessage.addListener((msg) => {
        if (msg.identify !== 'ipcwork') return;
        if (msg.cmd === 'init') {
          this.lists.all = [];
          this.lists.request = [];
          return;
        }
        const now = Date.now();
        this.lists.all.push({time: now, ...msg.payload});
        const body = msg.payload.data;
        switch(msg.payload.type) {
          case 'request': {
            this.lists.request.push({
              time: now,
              timeRes: '',
              status: 'pending',
              ...body
            });
            break;
          }
          case 'response': {
            const historyItem = this.lists.request.find(r => r.sequenceId === body.sequenceId);
            historyItem.resp = body.resp;
            historyItem.success = body.success;
            historyItem.status = 'done';
            historyItem.timeRes = now;
            break;
          }
          case 'listen': {
            const historyItem = this.lists.request.find(r => r.topic === body.topic);
            if (!historyItem) {
              this.lists.request.push({time: now, topic: body.topic, resp: []})
            }
            if (body.receive) {
              historyItem.resp.push({time: now, ...body.data});
            }
            break;
          }
        }
      });
      backgroundPageConnection.postMessage({
        name: 'init',
        tabId: window.chrome.devtools.inspectedWindow.tabId
      });
    }
    
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowUp' && this.activeId - 1 >= 0) {
        this.activeId -= 1;
      } else if (e.key === 'ArrowDown' &&  this.activeId + 1 < this.displayList.length) {
        this.activeId += 1;
      }
    })
  }
}
</script>

<style lang="less">
* { margin: 0; padding: 0;}
.head {
  width: 100%;
  background: #F3F3F3;
  line-height: 22px;
  border-bottom: 1px solid #CCCCCC;
  >* {display: inline-block;}
  .clear{cursor: pointer; padding: 0 4px;}
  .tabs {
    margin-left: 12px;
    .tab{
      display: inline-block;
      cursor: pointer;
      margin: 0 4px;
      text-align: center;
      min-width: 3em;
      &.active {
        border-bottom: 1px solid #1A73E8;
      }
    }
  }
}
.line {
  padding-left: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  &:nth-child(odd) {background-color: #fff;}
  &:nth-child(even) {background-color: #F5F5F5;}
  &:hover {background-color: rgb(227, 240, 253);cursor: pointer;}
  &.active {background-color: rgb(189, 220, 252)}
  &.err {color: red;}
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
  overflow: auto;
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
