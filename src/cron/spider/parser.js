'use strict'

const cheerio = require('cheerio')
const axios = require('axios')

exports.parser = function (url) {
  return axios.get(url)
    .then((res) => {
      return res.data
    })
    .then(cheerio.load.bind(cheerio))
}
