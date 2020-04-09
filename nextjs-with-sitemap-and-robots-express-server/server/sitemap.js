const { SitemapStream, streamToPromise } = require('sitemap')
const { createGzip } = require('zlib')

const posts = require('./posts')

let sitemap
const setup = ({ server }) => {

  server.get('/sitemap.xml', function (req, res) {
    res.header('Content-Type', 'application/xml')
    res.header('Content-Encoding', 'gzip')

    if (sitemap) {
      res.send(sitemap)
      return
    }

    try {
      const smStream = new SitemapStream({ hostname: 'https://sitemap-robots.now.sh/' })
      const pipeline = smStream.pipe(createGzip())

      const Posts = posts()
      for (let i = 0; i < Posts.length; i += 1) {
        const post = Posts[i]
        smStream.write({
          url: `/posts/${post.slug}`,
          changefreq: 'daily',
          priority: 0.9,
        })
      }

      // pipe your entries or directly write them.
      smStream.write({ url: '/support/', changefreq: 'daily', priority: 0.3 })
      smStream.write({ url: '/about/', changefreq: 'daily', priority: 0.3 })
      smStream.end()

      // cache the response
      streamToPromise(pipeline).then(sm => sitemap = sm)
      // stream write the response
      pipeline.pipe(res).on('error', (e) => { throw e })
    } catch (e) {
      console.error(e)
      res.status(500).end()
    }
  })
}

module.exports = setup