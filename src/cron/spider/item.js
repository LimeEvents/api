'use strict'

const { parser } = require('./parser')
const { TICKET_BISCUIT_URL, TICKET_BISCUIT_DATE_FORMAT } = require('./constants')
const moment = require('moment')
const get = require('lodash.get')
const sanitize = require('sanitize-html')
const { fromGlobalId } = require('graphql-relay')

const locations = {
  'downtown-slc': 'TG9jYXRpb246Yjc5NWY2YzUtMWJlYS00MzlhLTg4N2QtODc3ZDM3ZGJhZDM1',
  'ogden': 'TG9jYXRpb246MDY5YTQ4NmUtYzA0NS00NjgyLWJmNWQtNjgzNzMyZjI3ZDhm',
  'jordan-landing': 'TG9jYXRpb246MzY1YmIyNTMtYjUwYy00NTA1LTg3NGYtNjY0ZTA0MzUxYjAx'
}

function getEvent (id) {
  const { type: venueID, id: eventID } = fromGlobalId(id)
  return parser(`${TICKET_BISCUIT_URL}/${venueID}/Events/Series/${eventID}`)
    .then(($) => {
      const image = $('.event-image img')
        .attr('src')
        .replace(/300\/450\/Png/gi, '600/0')
        .replace('https://d1wo5tgrc6dsg6.cloudfront.net/images/', 'https://wiseguyscomedy.imgix.net/')
        .replace('https://d2ykm7e3p913e.cloudfront.net/', 'https://wiseguyscomedy.imgix.net/')

      const video = $('.event-media-container .event-media iframe').attr('src')

      const name = $('.event-title-container.page-title').text().trim()
      const { start, url } = getShowtimes($)
      const description = sanitize($('.attraction-summary-container').html().trim())
      let caption = sanitize($('.event-headline-container').html().trim())
      if (!caption) caption = description
      const venue = {
        name: $('.venue-info-name').text().trim(),
        city: $('.venue-info-location meta[itemprop="addressLocality"]').attr('content'),
        state: $('.venue-info-location meta[itemprop="addressRegion"]').attr('content'),
        street: $('.venue-info-location meta[itemprop="streetAddress"]').attr('content'),
        postalCode: $('.venue-info-location meta[itemprop="postalCode"]').attr('content'),
        googleMapsUrl: $('.venue-info-directions a').attr('href')
      }
      const slug = getLocationSlug(venue.name)
      console.log('names!!', shortName(name), slug, venue.name)
      return {
        id,
        name: shortName(name),
        price: findPrice($),
        isSpecialEvent: isSpecialEvent(name, sanitize($('.genre-item').html())),
        isSoldOut: !url,
        image,
        video,
        description,
        start,
        url,
        contentRating: getRating(sanitize($('.genre-item').html())),
        caption: goodPlaceToStop(caption, 100),
        locationId: locations[slug]
      }
    })
}

function isSoldOut (showtimes) {
  return !showtimes.find(({ url }) => !!url)
}

function getRating (text) {
  const regex = /Rated\s+([^<\n\s,]+)/gim
  const match = regex.exec(text)

  if (!match) {
    return ''
  }

  return match[1] || ''
}

function isSpecialEvent (...strs) {
  return !!strs.find(str => /special\s+event/i.test(str)) || false
}

function sortByDate (showtimes, path) {
  return showtimes
    .sort((a, b) => {
      return new Date(get(a, path)).getTime() - new Date(get(b, path)).getTime()
    })
}

function shortName (name) {
  name = name.replace(/special\s+(event)?/i, '')

  return name.split(/:|\s(as|seen|with|host|star|of|from|live|semi|finalist|winner|featuring|the)/i).shift()
}

function findPrice ($) {
  return $('.section-content')
    .map(function (el) {
      return $(this).text().trim()
    })
    .get()
    .map(text => {
      const match = /\$(\d+\.\d{2})/m.exec(text)
      if (!match) {
        return false
      }
      const price = parseFloat(match[1], 10)
      if (price < 100) return Math.ceil(price) * 100
      return false
    })
    .find(Boolean) || ''
}

function filterGarbage (str) {
  return str
    .replace(/<\/*.*?>/g, '')
    .replace(/&.*?;/g, '')
}

function goodPlaceToStop (str, target = 300) {
  str = filterGarbage(str)
  var sentence = findSentence(target, str, 0)
  if (sentence.length) return sentence
  return `${str.substr(0, target - 3)}...`
}

function findSentence (target, str, lastIdx) {
  var m = /[.?!]\s/g.exec(str.substr(lastIdx))
  if (!m) return str.substr(0, lastIdx)
  var newIdx = m.index + lastIdx + 1
  if (newIdx > target) {
    if (!lastIdx) return str.substr(0, target) + '...'
    return str.substr(0, lastIdx)
  }
  return findSentence(target, str, newIdx)
}

function getShowtimes ($) {
  const mainDate = moment($('.event-date-container span').map(function (idx) {
    return $(this).text().trim()
  }).get().filter((_, idx) => {
    return idx !== 1
  }).join(' '), TICKET_BISCUIT_DATE_FORMAT)

  return {
    url: $('.eventdetails-ticket-availability-wrapper a.buy-ticket-link').attr('href'),
    start: mainDate.toDate().getTime()
  }
}

// getVenue('WiseGuysComedy')
// getVenue('WiseguysComedyOgden')

function parseRange (list) {
  let i = 0
  const uniq = []
  return list
    .map((d) => moment(d))
    .reduce((prev, curr) => {
      const day = curr.dayOfYear()
      if (uniq.includes(day)) {
        return prev
      }
      uniq.push(day)
      const last = prev[i][prev[i].length - 1]
      if (last && day - last.dayOfYear() !== 1) prev[++i] = []
      prev[i].push(curr)
      return prev
    }, [[]])
    .map((range, idx, arr) => {
      const start = range[0]
      const str = parseMinRange(range)
      const lastBlock = arr[idx - 1]
      const lastDate = idx && lastBlock[lastBlock.length - 1]
      if (!idx || lastDate.month() !== start.month()) {
        return `${start.format(' MMM')} ${str}`
      }
      return str
    }).join(',')
}

function parseMinRange (list) {
  const start = list[0]
  const end = list[list.length - 1]

  if (start.month() === end.month()) {
    if (start.date() === end.date()) {
      return start.date()
    }

    return `${start.date()}-${end.date()}`
  }

  return `${start.date()}-${end.format('MMM D')}`
}

function getLocation (slug) {
  return {
    'golden-spike': 'Golden Spike',
    'downtown-slc': 'Salt Lake',
    ogden: 'Ogden',
    'jordan-landing': 'Jordan Landing'
  }[slug]
}

function getLocationSlug (venueName) {
  if (/moab|pbr|corona/i.test(venueName)) {
    return 'golden-spike'
  } else if (/slc|gateway|salt/i.test(venueName)) {
    return 'downtown-slc'
  } else if (/ogden/i.test(venueName)) {
    return 'ogden'
  } else if (/jordan|landing/i.test(venueName)) {
    return 'jordan-landing'
  }

  return 'other'
}

exports.goodPlaceToStop = goodPlaceToStop
exports.getEvent = getEvent
exports.parseRange = parseRange
