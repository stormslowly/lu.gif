'use strict'

var fs = require('fs')
var path = require('path')
var cheerio = require('cheerio')
var co = require('co')
var request = require('superagent')
var Gif = require('./storage')

var homeUrl = 'http://m.lovefou.com/dongtaitu/'
var BASE = 'http://m.lovefou.com'

class Lovefou {

  getStartUrl() {
    return co(function*() {
      var {text} = yield request.get(homeUrl)
      var $ = cheerio.load(text)
      return BASE + $('.list li > a').first().attr('href')
    })
  }

  fetchMeta(url) {
    return co.call(this, function*() {
      var {text} = yield request.get(url)
      var $ = cheerio.load(text)
      var img = $('.cont img').attr('src')
      var title = $('.cont strong').text()
      var id = Number($('.cont p').last().text().match(/\d+/))
      var next = BASE + $('.pagearti a').last().attr('href')
      var meta = {img, title, id}

      return {tasks: [meta], next}
    })
  }

  has(id) {
    return Gif.findOne({site: 'lovefou', extId: id}).exec()
  }
}

var download = function (meta) {
  var fileName = meta.id + '.gif'
  var out = fs.createWriteStream(path.join(__dirname, 'gifs', fileName))
  request.get(meta.img).pipe(out)

  return new Promise(function (resolve, reject) {
    out.on('close', function () {
      resolve()
    })
    out.on('error', reject)
  })
}


var pages = 50
co(function*() {
  var crawler = new Lovefou()
  var startUrl = yield crawler.getStartUrl()

  var i = 0;
  var url = startUrl
  var gif
  while (i < pages) {
    try {
      var meta = yield crawler.fetchMeta(url)
    } catch (error) {
      console.log('meta for ', url, 'failed')
    }

    url = meta.next
    i++
    for (var m = 0, l = meta.tasks.length; m < l; m++) {
      let task = meta.tasks[m]
      gif = yield crawler.has(task.id)
      if (gif) {
        console.log('conflict id', meta.id)
        continue
      }
      gif = {extId: task.id, img: task.img, title: task.title, site:'lovefou'}
      yield  download(task)
      yield  Gif.create(gif)
    }
    console.log(meta.tasks, meta.next)
  }
  process.exit(0)
})
  .catch(function (err) {
    console.log(err)
  })
  .then(function () {
    process.exit()
  })







