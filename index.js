
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
var express = require("express");
var app = express();

const port =  process.env.PORT || 4000;
app.listen(port);
app
  .get("/", (request, response) => {
    var result = "Bot listo!";
    response.send(result);
  })
  
const botToken = '6822993211:AAELxqFgRNSZv5xAcLrHOoYh2-hRQD1vvyI';
const botOwners = ['1701653200', '1708427708']; // Reemplaza con los ID de usuario de los dueños del bot

const bot = new TelegramBot(botToken, { polling: true });

const loteriaDataFile = 'loteriaData.json';
const tiempoEsperaEntreJuegos = 60 * 60 * 1000; // 1 minuto en milisegundos

// Cargar o inicializar datos
let loteriaData = {};
try {
  loteriaData = JSON.parse(fs.readFileSync(loteriaDataFile));
} catch (error) {
  console.error('Error cargando datos:', error);
}
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
 bot.sendMessage(chatId, "¡Hola-Peko🥕! Soy un bot en desarrollo creado por: @gnohee y @El_Bot_De_Ajedrez.")
  });
bot.onText(/\/loteria (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userFirstName = msg.from.first_name || 'Sin nombre';
    const userLastName = msg.from.last_name || '';
    const userFullName = userLastName ? `${userFirstName} ${userLastName}` : userFirstName;
  
    // Verificar si el usuario está expulsado
    if (loteriaData[userId] && loteriaData[userId].expulsado) {
      bot.sendMessage(chatId, '¡Estás prohibido participar en la lotería Peko! 🥕');
      return;
    }
  
    // Verificar si se proporciona un número como argumento
    if (!match[1]) {
      bot.sendMessage(chatId, 'Debes elegir un número entre 1 y 20. Ejemplo: /loteria 15');
      return;
    }
  
    const userGuess = parseInt(match[1]);
  
    // Verificar si el número está en el rango permitido
    if (userGuess < 1 || userGuess > 20) {
      bot.sendMessage(chatId, 'Debes elegir un número entre 1 y 20-Peko🥕.');
      return;
    }
  
    // Verificar si es tiempo para jugar nuevamente
    if (loteriaData[userId] && loteriaData[userId].lastPlayed && Date.now() - loteriaData[userId].lastPlayed < tiempoEsperaEntreJuegos) {
      bot.sendMessage(chatId, `¡Debes esperar *${tiempoEsperaEntreJuegos / ( 60 * 1000)}* minutos entre cada intento-Peko🥕!`,  {parse_mode: 'Markdown' });
      return;
    }
  
    // Jugar lotería
    const randomNumber = Math.floor(Math.random() * 20) + 1;
    const points = userGuess === randomNumber ? 1 : 0;
  
    // Actualizar datos
    loteriaData[userId] = {
      lastPlayed: Date.now(),
      points: (loteriaData[userId]?.points || 0) + points,
      fullName: userFullName
    };
  
    // Guardar datos en el archivo
    fs.writeFileSync(loteriaDataFile, JSON.stringify(loteriaData));
  
    // Responder al usuario
    bot.sendMessage(chatId, `_¡El número ganador es ${randomNumber} 🥕! ¡Has ganado *${points}* punto(s)-Peko!_`, {parse_mode: 'Markdown' });
  });

// Comando /ranking
bot.onText(/\/ranking/, (msg) => {
  const chatId = msg.chat.id;

  // Obtener el ranking
  const sortedRanking = Object.values(loteriaData)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  // Crear el mensaje de ranking
  let message = '🏆 **Ranking Global de PekoPuntos** 🏆\n';
  sortedRanking.forEach((userData, index) => {
    const name = userData.fullName || 'Usuario sin nombre';
    message += `${index + 1}. ${name} - ${userData.points} punto(s)\n`;
  });

  // Enviar el mensaje al chat
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Comando /expulsar
bot.onText(/\/expulsar (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const ownerUserId = msg.from.id;

  // Verificar si el usuario es dueño del bot
  if (!botOwners.includes(ownerUserId.toString())) {
    bot.sendMessage(chatId, '¡Solo los dueños del bot pueden expulsar a usuarios-Peko🥕!.');
    return;
  }

  const targetUserId = match[1];

  // Verificar si el usuario está en la lotería
  if (loteriaData[targetUserId]) {
    loteriaData[targetUserId].expulsado = true;
    fs.writeFileSync(loteriaDataFile, JSON.stringify(loteriaData));
    bot.sendMessage(chatId, `¡El usuario con ID ${targetUserId} ha sido expulsado de la lotería-Peko:)🥕!`);
  } else {
    bot.sendMessage(chatId, `El usuario con ID ${targetUserId} no está en la lotería-Peko🥕.`);
  }
});

// Comando /quitar
bot.onText(/\/quitar (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const ownerUserId = msg.from.id;

  // Verificar si el usuario es dueño del bot
  if (!botOwners.includes(ownerUserId.toString())) {
    bot.sendMessage(chatId, 'Solo los dueños del bot pueden quitar la expulsión de usuarios-Peko:)🥕.');
    return;
  }

  const targetUserId = match[1];

  // Verificar si el usuario está en la lotería y está expulsado
  if (loteriaData[targetUserId] && loteriaData[targetUserId].expulsado) {
    delete loteriaData[targetUserId].expulsado;
    fs.writeFileSync(loteriaDataFile, JSON.stringify(loteriaData));
    bot.sendMessage(chatId, `🥕Se ha quitado la expulsión al usuario con ID ${targetUserId}.`);
  } else {
    bot.sendMessage(chatId, `¡El usuario con ID ${targetUserId} no está expulsado de la lotería🥕!`);
  }
});
