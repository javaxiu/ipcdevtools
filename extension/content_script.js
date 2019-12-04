function inject(content) {
  var script = document.createElement('script')
  script.textContent = ';(' + content.toString() + ')(window)'
  document.documentElement.appendChild(script)
}

inject(
  (insideWin)=>{
    const hook = insideWin.__ALILANG_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return;
    insideWin.postMessage({identify: 'ipcwork', cmd: 'init'}, '*')
    hook.subscribe(d => {
      d = JSON.parse(JSON.stringify(d));
      insideWin.postMessage({identify: 'ipcwork', payload: d}, '*')
    });
  }
);

window.addEventListener('message', (event) => {
  if (event.data.identify !== 'ipcwork') return;
  chrome.runtime.sendMessage(event.data);
})
