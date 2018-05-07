'use strict'

const get = require('lodash.get')
const Bluebird = require('bluebird')
const { parser } = require('./parser')
const { getEvent } = require('./item')
const { TICKET_BISCUIT_URL } = require('./constants')
const { fromGlobalId, toGlobalId } = require('graphql-relay')

function getEventID (url) {
  return /\d+$/.exec(url)[0]
}

function getAccountID (url) {
  return /Wiseguys\w+/i.exec(url)[0]
}

function getNextPage ($) {
  return $('#event-list-table-next-page-content a').attr('href')
}

function getVenues (...venueIDs) {
  return Bluebird.all(
    venueIDs.map(getVenue)
  ).then((results) => [].concat(...results))
}

function getVenue (venueID) {
  return getList(`${TICKET_BISCUIT_URL}/${venueID}/Events`)
}

function getList (url) {
  const venueID = getAccountID(url)
  return parser(url)
    .then(($) => {
      const nextPage = getNextPage($)
      const idList = $('a.event-title-link').map(function () {
        return toGlobalId(venueID, getEventID($(this).attr('href')))
      }).get()

      if (nextPage) {
        return getList(`${TICKET_BISCUIT_URL}${nextPage}`)
          .then((events) => {
            return events.concat(idList)
          })
      }

      return idList
    })
}

function populateEvents (events) {
  return Bluebird
    .all(events.map(event => Bluebird.resolve(getEvent(event)).reflect()))
    .filter((promise) => promise.isFulfilled())
    .map((promise) => promise.value())
}

function filterUniqueEvents (events) {
  const handled = []

  return Bluebird.all(events)
    .then((events) => {
      return events.filter((event) => {
        const { id } = fromGlobalId(event.id)
        if (handled.includes(id)) {
          return false
        }

        if (event.showtimes) {
          const beenHandled = !!event.showtimes.find((showtime) => {
            return handled.includes(`${event.title.toLowerCase().replace(/\W+/gi, '')}${showtime.datetime}`)
          })
          if (beenHandled) {
            return false
          }
          event.showtimes.forEach((showtime) => {
            if (showtime.url) {
              handled.push(getEventID(showtime.url))
            } else {
              handled.push(`${event.title.toLowerCase().replace(/\W+/gi, '')}${showtime.datetime}`)
            }
          })
        } else {
          console.error('crap event', event)
        }

        return true
      })
    })
}

function sortByDate (showtimes, path) {
  return showtimes
    .sort((a, b) => {
      return new Date(get(a, path)).getTime() - new Date(get(b, path)).getTime()
    })
}

exports.getVenue = getVenue
exports.getVenues = getVenues
exports.filterUniqueEvents = filterUniqueEvents
exports.populateEvents = populateEvents
exports.sortByDate = sortByDate
