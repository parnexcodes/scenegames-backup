/* eslint-disable no-console */
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const hcaptcha = require('express-hcaptcha');
const cookieParser = require('cookie-parser');
const i18next = require('i18next');
const i18nextBackend = require('i18next-fs-backend');
const i18nextMiddleware = require('i18next-http-middleware');
const moment = require('moment');
const fs = require('fs');
const ISO6391 = require('iso-639-1');

// Load controllers
const ApiReleasesController = require('./controllers/api/releases');
const ApiHostsController = require('./controllers/api/hosts');
const ApiLinksController = require('./controllers/api/links');
const ApiFilesController = require('./controllers/api/files');
const ApiSiteController = require('./controllers/api/site');
const ApiVotesController = require('./controllers/api/votes');
const ApiIpController = require('./controllers/api/ip');
const ApiQueueController = require('./controllers/api/queue');
const FileController = require('./controllers/file');
const LinksController = require('./controllers/links');
const SearchController = require('./controllers/search');
const FeedController = require('./controllers/feed');
const ContactController = require('./controllers/contact');
const QueueController = require('./controllers/queue');
const PageController = require('./controllers/page');

// Load Configuration
const app = express();
const port = 46374;
const frontendRouter = express.Router();
const apiRouter = express.Router();
const db = mongoose.connection;
mongoose.set('useFindAndModify', false);

const upload = multer({ dest: 'uploads/' });

// Build languages array from directories
let languages = fs.readdirSync('locales/build/', { withFileTypes: true }).filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);

i18next.use(i18nextBackend).use(i18nextMiddleware.LanguageDetector).init({
  initImmediate: false,
  nsSeparator: ':-:',
  keySeparator: false,
  pluralSeparator: '_',
  fallbackLng: false,
  ns: ['translation', 'common', 'contact', 'errors'],
  defaultNS: 'translation',
  supportedLngs: languages,
  detection: {
    order: ['querystring', 'cookie', 'header', 'navigator'],
    lookupQuerystring: 'l',
    lookupCookie: 'lang',
  },
  backend: {
    loadPath: 'locales/build/{{lng}}/{{ns}}.json',
    addPath: 'locales/build/{{lng}}/{{ns}}.missing.json',
  },
  preload: ['en'],
});

// Sort and format languages after i18next initilization
languages = languages.map((lang) => {
  const code = i18next.services.languageUtils.getLanguagePartFromCode(lang);
  return {
    engName: ISO6391.getName(code),
    nativeName: ISO6391.getNativeName(code),
    code: lang,
  };
}).sort((a, b) => a.engName.localeCompare(b.engName));

app.use(express.static('public'));
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  i18nextMiddleware.handle(i18next, {
    // Ignore API pages
    ignoreRoutes: (req) => req.url.startsWith('/api'),
  }),
);

app.set('view engine', 'pug');
app.disable('x-powered-by');
app.enable('trust proxy');

// Site setting defaults
if (!process.env.SG_API_KEY) process.env.SG_API_KEY = 'default-key-oh-no';
if (!process.env.HC_SITE_KEY) process.env.HC_SITE_KEY = '10000000-ffff-ffff-ffff-000000000001';
if (!process.env.HC_SECRET_KEY) process.env.HC_SECRET_KEY = '0x0000000000000000000000000000000000000000';
if (!process.env.SG_DOMAIN) process.env.SG_DOMAIN = 'https://scenegames.to';

if (!process.env.RELEASE_EXPIRE_SECONDS) {
  process.env.RELEASE_EXPIRE_SECONDS = 30 * 3600 * 24;
} else {
  process.env.RELEASE_EXPIRE_SECONDS = parseInt(process.env.RELEASE_EXPIRE_SECONDS, 10);
}

if (!process.env.SMTP_HOST) process.env.SMTP_HOST = 'smtp.ethereal.email';
if (!process.env.SMTP_USER) process.env.SMTP_USER = null;
if (!process.env.SMTP_PASS) process.env.SMTP_PASS = null;
if (!process.env.SMTP_RCPT) process.env.SMTP_RCPT = null;
if (!process.env.SMTP_PORT) {
  process.env.SMTP_PORT = 587;
} else {
  process.env.SMTP_PORT = parseInt(process.env.SMTP_PORT, 10);
}
if (!process.env.SMTP_SECURE) {
  process.env.SMTP_SECURE = false;
} else {
  process.env.SMTP_SECURE = (process.env.SMTP_SECURE === 'true');
}

// Inject libs for pug tempaltes
app.locals.filesize = require('filesize');
app.locals.querystring = require('querystring');
app.locals.striptags = require('striptags');

app.locals.languages = languages;

app.locals.moment = moment;
app.locals.generatePagination = require('./lib/generatePagination');

// Asset paths for development
app.locals.staticAssetPaths = {
  css: '/style.css',
  js: '/js.js',
  nfoJs: '/nfo.js',
  nfoCss: '/nfo.css',
};

if (process.env.NODE_ENV === 'production') {
  const revManifest = JSON.parse(fs.readFileSync('rev-manifest.json', 'utf8'));
  app.locals.staticAssetPaths = {
    css: `/${revManifest['style.css']}`,
    js: `/${revManifest['js.js']}`,
    nfoJs: `/${revManifest['nfo.js']}`,
    nfoCss: `/${revManifest['nfo.css']}`,
  };
}

// Site settings middleware
frontendRouter.use((req, res, next) => {
  // Set language for libs from i18next-http-middleware
  const lng = req.language;
  moment.locale(lng); // Change global moment language

  // Theme
  switch (req.cookies.theme) {
    case 'light':
      app.locals.siteTheme = 'light';
      break;
    case 'dark':
      app.locals.siteTheme = 'dark';
      break;

    default:
      app.locals.siteTheme = null;
  }
  next();
});

/*
  Authenticated API endpoints
*/
apiRouter.use((req, res, next) => {
  const key = req.get('X-API-Key');
  if (process.env.SG_API_KEY !== key) {
    return res.status(401).json({
      status: 'fail',
      data: { 'X-API-Key': 'Invalid API Key' },
    });
  }
  return next();
});

apiRouter.post('/release', ApiReleasesController.addRelease);
apiRouter.patch('/release/:releaseName', ApiReleasesController.editRelease);
apiRouter.get('/release/:releaseName', ApiReleasesController.getRelease);
apiRouter.delete('/release/:releaseName', ApiReleasesController.deleteRelease);

apiRouter.post('/host', ApiHostsController.addHost);
apiRouter.patch('/host/:key', ApiHostsController.editHost);
apiRouter.get('/host/:key', ApiHostsController.getHost);
apiRouter.delete('/host/:key', ApiHostsController.deleteHost);

apiRouter.get('/hosts', ApiHostsController.getHosts);

apiRouter.post('/link', ApiLinksController.addLink);
apiRouter.delete('/link/:releaseName/:host?', ApiLinksController.removeLinks);

apiRouter.post('/file/:releaseName', upload.single('file'), ApiFilesController.addFile);
apiRouter.delete('/file/:releaseName/:type?', ApiFilesController.deleteFile);

apiRouter.get('/announcement', ApiSiteController.getAnnouncement);
apiRouter.post('/announcement', ApiSiteController.addAnnouncement);

apiRouter.get('/faq', ApiSiteController.getFaq);
apiRouter.post('/faq', ApiSiteController.addFaq);

apiRouter.get('/donate', ApiSiteController.getDonate);
apiRouter.post('/donate', ApiSiteController.addDonate);

apiRouter.get('/queue', ApiQueueController.getQueue);
apiRouter.delete('/queue/:releaseName?', ApiQueueController.deleteQueue);

apiRouter.get('/ip', ApiIpController.getIp);

app.use('/api/v1', apiRouter);

/*
  Main website front-end
*/
frontendRouter.get('/', SearchController.search);

frontendRouter.get('/api', (req, res) => {
  res.render('api');
});

frontendRouter.post(
  '/api/public/vote/:releaseName',
  hcaptcha.middleware.validate(process.env.HC_SECRET_KEY),
  (err, req, res, next) => {
    // Handle captcha error
    if (req.hcaptcha && req.hcaptcha.success) {
      next();
    } else {
      res.status(400).json({ status: 'fail', data: { token: 'Invalid captcha' } });
    }
  },
  ApiVotesController.addVote,
);

frontendRouter.get('/rss', FeedController.releases);
frontendRouter.get('/rss/torrents', FeedController.torrents);

frontendRouter.get('/download/:releaseName/nfo', FileController.getNfo);
frontendRouter.get('/download/:releaseName/sfv', FileController.getSfv);
frontendRouter.get('/download/:releaseName/file_id', FileController.getFileId);

frontendRouter.route('/download/:releaseName/:host')
  .post(
    hcaptcha.middleware.validate(process.env.HC_SECRET_KEY),
    (err, req, res, next) => {
      // Refresh page if captcha error
      if (req.hcaptcha && req.hcaptcha.success) {
        res.status(err.status).render('error', { status: err.status });
        next();
      } else {
        res.redirect(302, '');
      }
    },
    LinksController.getLinks,
  )
  .get(LinksController.getLinks);

frontendRouter.get('/:type/:releaseName', FileController.viewFile);

frontendRouter.get('/contact', ContactController.contact);
frontendRouter.post(
  '/contact',
  hcaptcha.middleware.validate(process.env.HC_SECRET_KEY),
  (err, req, res, next) => {
    // Handle captcha error
    if (req.hcaptcha && req.hcaptcha.success) {
      next();
    } else {
      res.render('contact', { success: false, errors: ['Invalid Captcha.'] });
    }
  },
  ContactController.submit,
);

frontendRouter.get('/faq', PageController.faq);

frontendRouter.get('/queue', QueueController.queue);

frontendRouter.get('/opensearchdescription.xml', (req, res) => {
  res.set('Content-Type', 'application/opensearchdescription+xml');
  res.render('opensearchdescription');
});

// 404 handler, keep this route last.
frontendRouter.use((req, res) => {
  res.status(404).render('error', { status: '404' });
});

app.use('/', frontendRouter);

mongoose.connect(`mongodb://${process.env.NODE_ENV === 'production' ? 'mongo' : 'localhost'}:27017/sg`, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.once('open', () => {
  app.listen(port, () => {
    console.info(`SG running on ${port} in ${process.env.NODE_ENV} mode.`);
    console.info(`API key is ${process.env.SG_API_KEY}`);
  });
});
