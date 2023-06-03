const { Telegraf } = require('telegraf')
const { Sequelize, DataTypes } = require('sequelize')
const axios = require('axios')
const {DateTime} = require('luxon')

const bot = new Telegraf('5891318186:AAFCjsPZveqnw78w_3EHfu95J-MZVeDJM_8')

// Create an instance of Sequelize and define the database connection
const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'C:/Users/dimai/database.sqlite',
});

const History = sequelize.define('History', {
  id:
  {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: 
  {
    type: DataTypes.STRING,
    allowNull: false
  }
});


const keyboard = [[{ text: "Русский", callback_data: 'ru' }, { text: "English", callback_data: 'en' }], [{ text: "Deutsch", callback_data: 'de' },
{ text: "Français", callback_data: 'fr' }], [{ text: "Italiano", callback_data: 'it' }, { text: "Español", callback_data: 'es' }]]

let lang = 'en'
let pageSize = 5


bot.start(ctx => ctx.replyWithHTML(
  'Hi, I\'m a news bot, use the following commands to get the news you need: \n\n<strong>/lang - choose your language (English as default)\n/news \"keyword\" - to search for news by keyword\n/history - to view history \n/reset - to clear the search history \n /size - choose number of news to be sent</strong>'
))

bot.command('lang', async ctx => {
  ctx.reply('Choose your language', { reply_markup: { inline_keyboard: keyboard } })
})

bot.command('size', ctx =>{
  const quantity = ctx.message.text.replace("/size", '')
  const regex = /^\d+$/g

  if (Number(quantity) < 1 || Number(quantity) > 20 || regex.test(quantity) == false)
  {
    ctx.reply('The number of news to be sent is incorrect (from 1 to 20)')
  } 
  else
  {
    pageSize = quantity
    ctx.reply(`Current size of page is${pageSize}`)
  }
})


bot.command('news', ctx => {

  const keyword = ctx.message.text.replace("/news", '')

  axios.get(`https://newsapi.org/v2/everything?language=${lang}&q=${keyword}&sortBy=popularity&pageSize=${pageSize}&domains=google.com&apiKey=14a0aa304dbc42db90fd770b2b3a8e31`)
    .then(response => {
      const articles = response.data.articles
      const arr = articles.map(item => {

        if ((item.title.split(' ')).includes("ВСУ")) {
          articles.splice(articles.indexOf(item), 1)
        }
        else {

          const title = item.title
          const regex = /<[a-z]+>/ig

          const cleanTitle = title.replace(regex, '')

          return `<strong>${cleanTitle}</strong> \n <a href=\"${item.url}\">Link to the source</a>\n`
        }
      })
      if ( arr.length == 0) {
        ctx.reply("No news found with this keyword, please try something else.")
      } else{
      ctx.replyWithHTML(arr.join('\n'))
      const date = DateTime.now().setZone("UTC+7")
      sequelize.authenticate()

      if (keyword) {
        History.sync()
        .then(() => {History.create({text: keyword, date: date.toFormat("d MMMM HH:mm")})})
        .catch(err => ctx.reply(err))
      }
      }
    })
})

bot.command('history', ctx => {
  History.findAll({raw: true})
  .then( res => {
    const arr = res.map( item => {
      return `${item.date} - ${item.text}`
    })
  if (arr.length == 0) {
    ctx.reply('History is empty')
  }
  else {
     ctx.reply(arr.join('\n'))
  }
  })
})

bot.command('reset', ctx => {
  History.sync({force: true})
  ctx.reply('History has been cleared')
})


bot.action(/[a-z]/ig, async ctx => {
  switch (ctx.callbackQuery.data) {
    case 'en': {
      lang = 'en'
      ctx.answerCbQuery("You have chosen English")
    }; break;

    case 'ru': {
      lang = 'ru'
      ctx.answerCbQuery("You have chosen Russian")
    }; break;

    case 'de': {
      lang = 'de'
      ctx.answerCbQuery("You have chosen German")
    }; break;

    case 'fr': {
      lang = 'fr'
      ctx.answerCbQuery("You have chosen French")
    }; break;

    case 'it': {
      lang = 'it'
      ctx.answerCbQuery("You have chosen Italian")
    }; break;

    case 'es': {
      lang = 'es'
      ctx.answerCbQuery("You have chosen Spanish")
    }; break;

    default: console.log('default'); break;
  }
})

bot.launch()

