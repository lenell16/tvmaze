const bytes = require('bytes');
const ExtraTorrentAPI = require("extratorrent-api");

const extraTorrentAPI = new ExtraTorrentAPI();

const compareFileSizes = (prev, curr) => {
  prev = bytes(prev.replace(' ', ''));
  curr = bytes(curr.replace(' ', ''));
  return curr > prev;
}

const torrentSizeReducer = (prev, curr) =>
  compareFileSizes(prev.size, curr.size) ? curr : prev;

const getLargestTorrent = torrents => torrents.reduce(torrentSizeReducer);

const getTorrent = (query) => {
  return extraTorrentAPI.search(query)
    .then(search => search.results)
    .then(results => getLargestTorrent(results))
    .then(({ torrent_link, magnet }) => ({ torrent_link, magnet }));
}

module.exports = {
  getTorrent
};
