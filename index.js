const fs = require('fs-jetpack');
const TVMaze = require('tvmaze');
const xlsx = require('node-xlsx');

const path = __dirname + '/tvShows.xlsx';
const tvm = new TVMaze();

const tvShows = fs.read('tvShows.json', 'json');
const tvShowPromises = tvShows.map(({name}) => tvm.findShow(name));

Promise.all(tvShowPromises)
  .then(values => values.map(value => value[0].show))
  .then(shows => {
    return shows.map(({name, schedule, network, webChannel}) => {
      return [name, network ? network.name : webChannel.name, schedule.days[0]];
    })
  })
  .then(parsedShows => xlsx.build([{name: 'tvShows', data: parsedShows}]))
  .then(workbookBuffer => fs.write(path, workbookBuffer));
