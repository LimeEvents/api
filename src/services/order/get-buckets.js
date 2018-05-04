const moment = require('moment')

function createBuckets (start, count = 1, interval = 'week') {
  start = moment(start)
  return new Array(count)
    .fill(null)
    .map((_, idx) => start.clone().subtract(interval, idx).startOf(interval).unix())
}

console.log(createBuckets(Date.now(), 12, 'day'))
