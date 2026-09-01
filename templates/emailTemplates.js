require('dotenv').config();

const customerTemplates = require('./html/contact-return');
const teamTemplates = require('./html/contact');

const normalizeLocale = (locale) => (locale === 'es' ? 'es' : locale === 'en' ? 'en' : 'pt-BR');
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const interpolate = (template, values) => template.replace(/{{(\w+)}}/g, (_, key) => escapeHtml(values[key]));

module.exports = {
  contactReturn(name, locale = 'pt-BR') {
    return interpolate(customerTemplates[normalizeLocale(locale)], { name, year: new Date().getFullYear() });
  },
  contact(name, email, tel, obs, requestType, ip, locale = 'pt-BR') {
    return interpolate(teamTemplates[normalizeLocale(locale)], {
      name, email, tel, obs, requestType, ip,
      date: new Intl.DateTimeFormat(normalizeLocale(locale), { dateStyle: 'short', timeStyle: 'medium' }).format(new Date()),
      year: new Date().getFullYear()
    });
  }
};
