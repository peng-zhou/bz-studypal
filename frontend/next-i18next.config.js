/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    localeDetection: true,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}
