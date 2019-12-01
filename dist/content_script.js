function inject(content) {
  var script = document.createElement('script')
  script.textContent = ';(' + content.toString() + ')(window)'
  document.documentElement.appendChild(script)
}

inject(
  (insideWin)=>{
    const originIpc = insideWin.ipc;
    insideWin.ipc = (...args) => {
      window.postMessage({identify: 'ipcwork', cmd: 'receive', payload: args}, '*')
      if (args.callback) {
        const originCb = args.callback;
        args.callback = (...args) => {
          window.postMessage({identify: 'ipcwork', cmd: 'response', args});
          originCb.apply(insideWin, args)
        }
      }
      originIpc && originIpc.apply(insideWin, args)
    }
    window.postMessage({identify: 'ipcwork', cmd: 'load'})
  }
);

window.addEventListener('message', (event) => {
  if (event.data.identify !== 'ipcwork') return;
  const data = event.data.payload;
  console.log(data);
  chrome.runtime.sendMessage(event.data);
})
