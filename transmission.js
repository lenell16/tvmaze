const Powersteer = require('powersteer');

let rpc = new Powersteer({
    url: 'http://localhost:9091/transmission/rpc'
});

var trace = (x) => {console.log('TRACE: ', x); return x;};

const addTorrentFile = (filename) => {
  rpc.torrentAdd({filename}).then(trace).catch(trace);
}

module.exports = {
  addTorrentFile
};
