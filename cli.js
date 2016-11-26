#!/usr/bin/env node

const JsonDb = require('node-json-db')
const TVMaze = require('tvmaze');
const program = require('commander');
const leftPad = require('left-pad');
const map = require('promise-map');
const each = require('promise-each');
const transmission = require('./transmission');
const { getTorrent } = require('./torrent');
const moment = require('moment');

const tvm = new TVMaze();
const db = new JsonDb('tvDatabase', true, true)
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const showsDB = db.getData('/shows')

const whatDay = (day) => {
  const retDays = [];
  if (day === 'Today') {
    retDays.push(moment().day());
  } else if (day === 'Week') {
    retDays.push(0, 1, 2, 3, 4, 5, 6);
  } else {
    retDays.push(days.indexOf(day));
  }
  return retDays;
};
const removeShowFromDB = (showName) => {
  const index = showsDB.findIndex(show => show.name === showName);
  index >= 0 ? db.delete(`/shows[${index}]`) : console.log(`Show: ${showName} not in database`);
}

const getSeason = (showName, seasonNumber) => {
  const show = get
}

const getLatestEpisode = (show) => {
  const weekago = moment().subtract('1', 'week');
  return tvm.getShow(show.id, ['previousepisode'])
    .then(showResult => {
      let airstamp = moment(showResult._embedded.previousepisode.airstamp);
      return airstamp.diff(weekago) > 0 ? showResult : null;
    })
    .then(showResult => {
      if (showResult) {
        const episode = showResult._embedded.previousepisode;
        return `${showResult.name} S${leftPad(episode.season, 2, 0)}E${leftPad(episode.number, 2, 0)}`
      }
      return showResult;
    })
}

const getListOfLatestEpisodes = (shows) => {
  return map(show => getLatestEpisode(show))(shows)
    .then(value => value.filter(item => item));
};

const filterShowsInDb = (shows) => {
  return shows.filter(({ name }) => {
    if (showsDB.some(show => show.name === name)) {
      console.log(`Show: ${name} already in database.`);
      return false;
    }
    return true;
  });
};

program.version('0.0.1')

program
  .command('add-show <name> [other...]')
  .description('Add new show')
  .action((name, others) => {
    let newShows = [name, ...others];

    Promise.all(newShows.map((name) => tvm.findShow(name)))
      .then(map(result => result[0].show))
      .then(filterShowsInDb)
      .then(map(show => ({
        name: show.name,
        download: null,
        id: show.id,
        time: show.schedule.time,
        day: days.indexOf(show.schedule.days[0]),
        network: show.network ? show.network.name : show.webChannel.name
      })))
      .then(each(show => {
        db.push(`/shows[]`, data);
        console.log(`Show ${show.name} added to database`);
      }));
  })

program
  .command('remove-show <name> [other...]')
  .description('remove new show')
  .action((name, others) => {
    let removeShows = [name, ...others];
    removeShows.forEach(removeShowFromDB);
    console.log('Shows removed from database');
  })



program
  .option('-d, --day <day>', 'Day or date to download', whatDay)
  .option('-l, --list', 'List shows that match download day')
  .option('-q, --quality <quality>', '', /^(480p|720p|1080p)$/i, '720p')
  .option('-n, --name <name>', '')
  .command('download')
  .description('remove new show')
  .action(() => {
    if (program.day.length || program.name) {
      let shows = showsDB.filter(({ day, name }) => program.day.includes(day) || program.name === name);
      let latestEpisodes = getListOfLatestEpisodes(shows);

      if (program.list) {
        latestEpisodes.then(each(ep => console.log(ep)))
      } else {
        latestEpisodes
          .then(map(name => getTorrent(`${name} ${program.quality}`)))
          .then(each(torrent => transmission.addTorrentFile(torrent.magnet)))
      }
    }
  })

program.parse(process.argv)
