const i18next = require('i18next');

i18next.init({ lng: 'pt-BR', fallbackLng: 'pt-BR', resources: {
  'pt-BR': { translation: { api: { contactSent: 'Contato enviado com sucesso.', contactFailed: 'Não foi possível enviar o contato. Tente novamente.', notFound: 'Recurso não encontrado.', serverError: 'Ocorreu um erro inesperado. Tente novamente.' }, email: { subject: 'A equipe KSI agradece o seu contato', adminSubject: 'Novo contato de' } } },
  en: { translation: { api: { contactSent: 'Your message was sent successfully.', contactFailed: 'We could not send your message. Please try again.', notFound: 'Resource not found.', serverError: 'An unexpected error occurred. Please try again.' }, email: { subject: 'The KSI team thanks you for contacting us', adminSubject: 'New contact from' } } },
  es: { translation: { api: { contactSent: 'Tu mensaje fue enviado correctamente.', contactFailed: 'No pudimos enviar tu mensaje. Inténtalo de nuevo.', notFound: 'Recurso no encontrado.', serverError: 'Ocurrió un error inesperado. Inténtalo de nuevo.' }, email: { subject: 'El equipo KSI agradece tu contacto', adminSubject: 'Nuevo contacto de' } } }
} });

const getLocale = (header = '') => { const language = header.split(',')[0].trim(); return language.startsWith('pt') ? 'pt-BR' : language.startsWith('es') ? 'es' : 'en'; };
module.exports = { middleware: (req, res, next) => { req.locale = getLocale(req.headers['accept-language']); req.t = (key, options) => i18next.t(key, { lng: req.locale, ...options }); next(); }, t: (locale, key, options) => i18next.t(key, { lng: locale, ...options }) };
