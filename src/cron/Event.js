'use strict'

const fs = require('fs')
const Spider = require('./spider')
const sanitize = require('sanitize-html')
// var algoliasearch = require('algoliasearch')
// var algoliasearch = require('algoliasearch/reactnative')
// var algoliasearch = require('algoliasearch/lite')
// or just use algoliasearch if you are using a <script> tag
// if you are using AMD module loader, algoliasearch will not be defined in window,
// but in the AMD modules of the page

// var client = algoliasearch('T0AFS8LMSH', '18d9ad40f3e9c3972d1efaf44c73370b')
// var index = client.initIndex('wiseguyscomedy')

const FIVE_MINUTES = 5 * 60 * 1000
const ONE_HOUR = 60 * 60 * 1000

const IS_DEV = process.env.NODE_ENV === 'development'

const CACHE_KEY = 'cached-events.json'

function get (id) {
  return memFind()
    .then((events) => events.find(({ id: _id }) => id === _id))
}

const cache = {}

if (IS_DEV) {
  try {
    cache['events'] = Promise.resolve(require(`../${CACHE_KEY}`))
  } catch (ex) { /* Cache miss */ }
}

const memFind = mem('events', find, IS_DEV ? ONE_HOUR : FIVE_MINUTES)

memFind()
  .then((data) => {
    if (IS_DEV) {
      fs.writeFileSync(CACHE_KEY, JSON.stringify(data, null, 2))
    }
    return data
  })

async function find () {
  console.info('Loading event from TicketBiscuit')
  let openMics = 0
  return Spider.listEvents()
    .then(async (events) => {
      // var objects = events.map((event) => {
      //   event.objectID = event.id
      //   return event
      // })
      // await index.addObjects(objects)
      return events.filter((event) => {
        const title = event.title.toLowerCase()
        if (/wiseguys\sgift/i.test(title)) {
          return false
        }
        if (title === 'open mic' && openMics++ >= 3) {
          return false
        }
        return true
      })
    })
}

function findByVenue (venueID) {
  return memFind()
    .then((events) => {
      return events.filter((event) => {
        return event.locationSlug === venueID
      })
    })
}

const HERO_BLACKLIST = [
  'open-mic',
  'carlos-mencia',
  'michael-quu'
]

function findHeroEvents (len = 10) {
  return memFind()
    .then((events) => {
      const found = []
      return events
        .filter((event) => {
          if (HERO_BLACKLIST.find(bl => event.id.startsWith(bl)) || found.includes(event.title)) {
            return false
          }
          return event.title.length < 25 && !!found.push(event.title)
        })
        .map((event) => {
          const desc = sanitize(event.description, { allowedTags: [], allowedAttributes: [] })
          return Object.assign({}, event, { summary: Spider.goodPlaceToStop(desc, 300) })
        })
      // return Bluebird.reduce(events, (heroes, event) => {
      //   if (heroes.length > len) {
      //     return heroes
      //   }
      //   // https://static.ticketbiscuit.com/images/90998/600/0
      //   // http://wiseguyscomedy.imgix.net/90999/600/0?w=260&h=260&fit=crop&crop=entropy
      //   console.log(event.imageUrl)
      //   const url = event.imageUrl
      //     .replace('http://wiseguyscomedy.imgix.net', 'https://d1wo5tgrc6dsg6.cloudfront.net/images');
      //   return request({
      //     url,
      //     method: 'GET',
      //     responseType: 'arraybuffer',
      //   })
      //     .then((res) => res.data)
      //     .then((img) => {
      //       const { height, width } = sizeOf(img)

      //       if (height >= 400 || width >= 400) {
      //         heroes.push(event)
      //       }

      //       return heroes
      //     })
      // }, [])
    })
}

exports.get = get
exports.find = memFind
exports.findByVenue = findByVenue
exports.findHeroEvents = findHeroEvents

function mem (key, fn, expires = FIVE_MINUTES, roll = 30 * 1000) {
  let expiration = Date.now() + expires
  return (...args) => {
    if (!cache[key]) {
      // CACHE MISS
      cache[key] = fn(...args)
      return cache[key]
    }

    if (expiration > Date.now()) {
      // CACHE HIT
      return cache[key]
    }

    if (expiration < Date.now() - roll) {
      // REBUILD
      expiration = Date.now() + expires
      fn(...args)
        .then((data) => {
          return (cache[key] = Promise.resolve(data))
        })

      return cache[key]
    }

    return cache[key]
  }
}
