'use strict'

const { getVenues, populateEvents, sortByDate } = require('./list')
const { getEvent, goodPlaceToStop, parseRange } = require('./item')
const slug = require('slug')
const slugify = (str) => slug(str).toLowerCase()
const merge = require('lodash.mergewith')

const ALL_VENUES = [ 'WiseGuysComedy', 'WiseguysComedySLC', 'WiseguysComedyOgden', 'WiseguysJordanLanding' ]

const idMap = {}

exports.listEvents = (venues = ALL_VENUES) => {
  if (!Array.isArray(venues)) {
    venues = [ venues ]
  }
  return getVenues(...venues)
    .then(populateEvents)
    .then((events) => {
      return Object.values(
        events
          .reduce((prev, curr, idx) => {
            let id = slugify(curr.title)
            let event = curr

            if (prev[id] && prev[id].locationSlug !== curr.locationSlug) {
              id = `${id}-${curr.locationSlug}`
            } else {
              let range = event.range
              event = merge({}, curr, prev[id] || {}, (dest, src, key, object, source, stack) => {
                if (key === 'showtimes' && dest && src) {
                  const showtimes = dest.filter(({ datetime }) => {
                    const should = !src.find(({ datetime: _datetime }) => datetime === _datetime)
                    return should
                  }).concat(src)
                  range = parseRange(showtimes.map((showtime) => showtime.datetime))
                  return showtimes
                }
              })
              if (id !== 'open-mic') event.range = range
            }
            idMap[curr.id] = id
            event.id = id
            if (id === 'open-mic') {
              id = `${id}-${curr.showtimes[0].date}`
            }
            prev[id] = event
            return prev
          }, {})
      )
    })
    // .then(filterUniqueEvents)
    .then((events) => sortByDate(events, 'showtimes[0].datetime'))
}

exports.idMap = idMap
exports.getEvent = getEvent
exports.goodPlaceToStop = goodPlaceToStop
